const recast = require('recast');
const Promise = require('bluebird');
const arrayUtils = require('../utils/arrayUtils');
const PropTypes = require('../beans/PropTypes');
const propTypesHelper = require('../utils/propTypesHelper');
const setting = require('../setting');
const constants = require('../constants');

function findPropTypes({ componentNode, propTypesNode, defaultPropsNode }, options, comments = []) {
  let actions = [
    findPropTypesByPropsIdentity(componentNode, options), //代码生成类型
    findPropTypesInDefaultPropsNode(defaultPropsNode, options), //默认类型
  ];
  if (!options.noMergeOld) {
    //优先级最高，必须确保已经填写的PropTypes级别最高
    actions.push(findPropTypesInPropTypeNode(propTypesNode, comments));
  }
  return Promise.all(actions).then((results) => {
    if (options.mergeOldIfExist) {
      let newPropTypes = results.slice(0, 2).reduce((total = [], current = []) => {
        return propTypesHelper.customMergePropTypes(total, current, options.sort);
      }, []);
      if (options.sort) {
        newPropTypes.sort(arrayUtils.sortByKey());
      }
      let oldPropTypes = results[2] || [];
      return newPropTypes.map(item => {
        let updateItem = oldPropTypes.find(updateItem => item.name === updateItem.name);
        if (updateItem) {
          return propTypesHelper.customMergePropTypes(item, updateItem, options.sort);
        } else {
          return item;
        }
      });
    } else {
      let newPropTypes = results.reduce((total = [], current = []) => {
        return propTypesHelper.customMergePropTypes(total, current, options.sort);
      }, []);
      if (options.sort) {
        newPropTypes.sort(arrayUtils.sortByKey());
      }
      return newPropTypes;
    }
  });
}

function findPropTypesByPropsIdentity(ast, options) {
  let identity;
  let propTypes = [];
  let visitOptions = {};
  if ((ast.type === 'FunctionDeclaration' || ast.type === 'ArrowFunctionExpression' || ast.type === 'FunctionExpression')
    && ast.params.length > 0
  ) {
    let firstParams = ast.params[0];
    if (firstParams.type === 'Identifier') {
      identity = ast.params[0].name;
    } else if (firstParams.type === 'ObjectPattern') {
      let newPropTypes = findAndCompletePropTypes(ast, findPropTypesInObjectPattern(firstParams, options), options);
      propTypes = propTypesHelper.customMergePropTypes(propTypes, newPropTypes, options.sort);
    }

  } else if (ast.type === 'ClassDeclaration') {
    identity = 'this\\.props';
    visitOptions.visitMethodDefinition = function (path) {
      let node = path.node;
      if (node.key.type === 'Identifier'
        && node.key.name === 'constructor'
        && node.value.type === 'FunctionExpression'
      ) {
        let newPropTypes = findPropTypesByPropsIdentity(node.value, options);
        propTypes = propTypesHelper.customMergePropTypes(propTypes, newPropTypes, options.sort);
      }
      this.traverse(path);
    };
  }

  if (identity) {
    // 可能是 props or this.props
    visitOptions.visitMemberExpression = function (path) {
      let { propType } = getPropTypeByMemberExpression(path, [identity], options);
      if (propType) {
        propTypes = propTypesHelper.customMergePropTypes(propTypes, [propType], options.sort);
      }
      this.traverse(path);
    };
  }

  visitOptions.visitVariableDeclarator = function (path) {
    let node = path.node;
    let idNode = node.id;
    let initNode = node.init;
    if (idNode && initNode && idNode.type === 'ObjectPattern') {
      if (
        (initNode.type === 'MemberExpression'
          && initNode.object.type === 'ThisExpression'
          && initNode.property.name === 'props') ||
        (initNode.type === 'Identifier' && initNode.name === identity)
      ) {
        let newPropTypes = findAndCompletePropTypes(findBlockStatement(path), findPropTypesInObjectPattern(idNode), options);
        propTypes = propTypesHelper.customMergePropTypes(propTypes, newPropTypes, options.sort);
      }
    }
    this.traverse(path);
  };

  recast.visit(ast, visitOptions);
  return fixAllShapePropType(propTypes, options);
}

// 统一修正类型
function fixAllShapePropType(propTypes, options) {
  return propTypes.map(item => {
    if (item.type === 'shape') {
      if (options.arrayLike && item.childTypes.every(child => {
        let isArrayLength = child.name === 'length' && child.type === 'number';
        let isArrayFunc = child.type === 'func' && constants.arrayFunctions.indexOf(child.name) !== -1;
        return isArrayLength || isArrayFunc;
      })) {
        // 如果shape的所有类型和array极其相似，那就默认为array类型
        return new PropTypes(item.name, 'array', item.isRequired);
      }
      if (options.noShape) {
        // 如果setting不允许生成shape类型，那就默认为object类型
        return new PropTypes(item.name, 'object', item.isRequired);
      }
      item.childTypes = fixAllShapePropType(item.childTypes, options);
      return item;
    } else {
      return item;
    }
  });
}

function findPropTypesNode(ast, options) {
  let { name, alias } = options;
  let propTypesNode;
  let propTypesClassPropertyNode;
  recast.visit(ast, {
    visitAssignmentExpression: function (path) {
      const node = path.node;
      let left = node.left;
      let right = node.right;
      if (left && left.type === 'MemberExpression'
        && (left.object.type === 'Identifier' || left.object.type === 'MemberExpression')
        && left.property.type === 'Identifier'
        && left.property.name === (alias || 'propTypes')
        && right.type === 'ObjectExpression'
        && recast.print(left.object).code === name
      ) {
        propTypesNode = path.parentPath.node;
      }
      this.traverse(path);
    },
    visitClassProperty: function (path) {
      const node = path.node;
      let key = node.key;
      let value = node.value;
      if (key && value
        && key.type === 'Identifier'
        && value.type === 'ObjectExpression'
        && key.name === (alias || 'propTypes')
        && node.static) {
        let classNode = path.parentPath.parentPath.parentPath.node;
        if (classNode && classNode.type === 'ClassDeclaration'
          && classNode.id.name === name) {
          propTypesClassPropertyNode = node;
        }
      }
      this.traverse(path);
    }
  });
  if (propTypesClassPropertyNode) {
    return Promise.resolve(propTypesClassPropertyNode);
  } else if (propTypesNode) {
    return Promise.resolve(propTypesNode);
  } else {
    return Promise.resolve(null);
  }
}

function findUpdateSpecialPropTypes(typeNode, name, comments = []) {
  let props = new PropTypes(name); // name可能为空
  let callee, calleeParams;
  if (typeNode.type === 'CallExpression') {
    callee = typeNode.callee;
    calleeParams = typeNode.arguments[0];
  } else if (typeNode.type === 'MemberExpression') {
    let object = typeNode.object;
    let property = typeNode.property;
    if (object.type === 'CallExpression') {
      callee = object.callee;
      calleeParams = object.arguments[0];
    } else if (object.type === 'MemberExpression') {
      if (object.property.name !== 'any') {
        props.type = object.property.name;
      }
    } else if (object.type === 'Identifier') {
      if (property.name !== 'any') {
        props.type = property.name;
      }
    }
    // 设置isRequired
    if (property.type === 'Identifier' && property.name === 'isRequired') {
      props.isRequired = true;
    }
  } else {
    // 不符合的类型，返回null
    return null;
  }

  // 如果是特殊类型, 在这里统一处理
  if (callee && calleeParams) {
    // 设置类型
    if (callee.type === 'MemberExpression') {
      let property = callee.property;
      if (property.type === 'Identifier' && property.name !== 'any') {
        props.type = property.name;
      }
    }
    if (calleeParams.type === 'ObjectExpression') {
      // shape or exact
      props.childTypes = findPropTypesInObjectNode(calleeParams, comments);
    } else if (calleeParams.type === 'ArrayExpression') {
      // oneOf、oneOfType
      if (props.type === 'oneOf') {
        // 保存当前的ast
        props.ast = calleeParams;
      } else {
        let elements = calleeParams.elements || [];
        props.childTypes = elements.map(item => findUpdateSpecialPropTypes(item, null, comments)).filter(item => !!item);
      }
    } else if (calleeParams.type === 'MemberExpression' || calleeParams.type === 'CallExpression') {
      // arrayOf、objectOf、instanceOf
      let childType = findUpdateSpecialPropTypes(calleeParams, null, comments);
      if (childType) {
        props.childTypes = [childType];
      }
    }
  }

  // 返回类型
  return props;
}

function findPropTypesInObjectNode(objectNode, comments = []) {
  let propTypes = [];
  if (objectNode && objectNode.type === 'ObjectExpression') {
    let properties = objectNode.properties || [];
    for (let i = 0; i < properties.length; i++) {
      let key = properties[i].key;
      let value = properties[i].value;
      let propType = findUpdateSpecialPropTypes(value, key.name, comments);
      if (propType) {
        let start = value.range[1];
        let end = (i === properties.length - 1) ? objectNode.range[1] : properties[i + 1].value.range[0];
        let commentNode = comments.find(comment => comment.range[0] >= start && comment.range[1] <= end);
        commentNode && (propType.comment = commentNode.value);
        propTypes.push(propType);
      }
    }
  }
  return propTypes;
}

function findPropTypesInPropTypeNode(propNode, comments) {
  if (!propNode) {
    return [];
  }
  if (propNode.type === 'ClassProperty' && propNode.static) {
    return findPropTypesInObjectNode(propNode.value, comments);
  } else if (propNode.type === 'ExpressionStatement' && propNode.expression.type === 'AssignmentExpression') {
    return findPropTypesInObjectNode(propNode.expression.right, comments);
  } else {
    return [];
  }
}

function findPropTypesInDefaultPropsNode(ast, options) {
  let propTypes = [];
  if (ast) {
    recast.visit(ast, {
      visitProperty: function (path) {
        const node = path.node;
        let key = node.key;
        let value = node.value;
        if (key && value && key.type === 'Identifier') {
          let props = new PropTypes(key.name);
          propTypesHelper.updatePropTypeByNode(value, props);
          if (props.type !== 'any') {
            props.defaultValue = recast.prettyPrint(value, setting.getCodeStyle(options)).code;
          }
          propTypes.push(props);
        }
        this.traverse(path);
      }
    });
  }
  return propTypes;
}

function findPropTypesInObjectPattern(ast, options) {
  let propTypes = [];
  let properties = ast.properties || [];
  for (let i = 0; i < properties.length; i++) {
    let property = properties[i].value;
    let key = properties[i].key;
    if (property && key) {
      let props = new PropTypes(key.name);
      if (property.type === 'AssignmentPattern') {
        let left = properties[i].value.left;
        let right = properties[i].value.right;
        if (left && left.type === 'Identifier' && right) {
          propTypesHelper.updatePropTypeByNode(right, props);
          if (props.type !== 'any') {
            props.defaultValue = recast.prettyPrint(right, setting.getCodeStyle(options)).code;
          }
          props.id = left.name;
          propTypes.push(props);
        }
      } else if (property.type === 'Identifier') {
        props.id = property.name;
        propTypes.push(props);
      }
    }
  }
  return propTypes;
}

// 获取当前函数的块级作用域
function findBlockStatement(path) {
  if (!path) return null;
  if (!path.parent) {
    return null;
  }
  if (path.parent.node.type === 'BlockStatement') {
    return path.parent.node;
  } else {
    return findBlockStatement(path.parent);
  }
}

function getPropTypeByMemberExpression(path, ids, options) {
  let code = recast.print(path.node).code;
  let regex = new RegExp(`^(${ids.join('|')})((\\??\\.[a-zA-Z_$][a-zA-Z0-9_$]*)+)$`);
  let match = regex.exec(code);
  let firstPropType;
  let lastPropType;
  if (match) {
    let parentNode = path.parent.node;
    let properties = match[2].replace(/^\??\./, '').split(/\??\./);
    for (let i = properties.length - 1; i >= 0; i--) {
      let propType = new PropTypes(properties[i]);
      if (lastPropType) {
        propType.type = 'shape';
        propType.childTypes = [lastPropType];
      }
      if (i === properties.length - 1) {
        // 如果第一个PropTypes 是一个变量声明表达式的话 TODO 暂时不考虑析构函数，不然又是一个递归
        if (parentNode.type === 'VariableDeclarator') {
          if (parentNode.id.type === 'Identifier') {
            propType.id = parentNode.id.name;
            propType = findAndCompletePropTypes(findBlockStatement(path), [propType], options)[0];
          } else if (parentNode.id.type === 'ObjectPattern') {
            propType.type = 'shape';
            propType.childTypes = findAndCompletePropTypes(findBlockStatement(path), findPropTypesInObjectPattern(parentNode.id), options);
          }
        }
        firstPropType = propType;
      }
      lastPropType = propType;
    }
    if (firstPropType) {
      if (parentNode.type === 'BinaryExpression') {
        if (parentNode.operator === '*') {
          firstPropType.type = 'number';
        } else {
          propTypesHelper.updatePropTypeByNode(parentNode.right, firstPropType);
        }
      } else if (parentNode.type === 'LogicalExpression') {
        propTypesHelper.updatePropTypeByNode(parentNode.right, firstPropType);
      } else if (parentNode.type === 'UpdateExpression') {
        firstPropType.type = 'number';
      } else if (parentNode.type.indexOf('CallExpression') !== -1 && recast.print(parentNode.callee).code === code) {
        firstPropType.type = 'func';
      }
    }
    return {
      name: match[1],
      propType: lastPropType
    };
  } else {
    return {};
  }
}


function findAndCompletePropTypes(ast, propTypes, options) {
  let newPropTypes = propTypes.slice();
  let ids = newPropTypes
    .filter(item => !!item.id) // Must have id
    .filter(item => item.type === 'any' || item.type === 'shape') // Others not need complete
    .map(item => item.id);
  // 优化性能，减少查找次数
  if (ids.length === 0) return newPropTypes;
  if (ast) {
    let visitLogicalExpression = function (path) {
      let node = path.node;
      let left = node.left;
      let right = node.right;
      if (left && right && left.type === 'Identifier' && ids.indexOf(left.name) !== -1) {
        let updatePropType = newPropTypes.find(item => item.id === left.name);
        updatePropType && propTypesHelper.updatePropTypeByNode(right, updatePropType);
      }
      this.traverse(path);
    };
    let visitMemberExpression = function (path) {
      let { name, propType } = getPropTypeByMemberExpression(path, ids, options);
      if (name && propType) {
        let updatePropType = newPropTypes.find(item => item.id === name);
        if (updatePropType) {
          // 这时候说明肯定是复杂类型，所以用shape
          updatePropType.type = 'shape';
          updatePropType.childTypes = propTypesHelper.customMergePropTypes(updatePropType.childTypes, [propType], options.sort);
        }
      }
      this.traverse(path);
    };
    let visitVariableDeclarator = function (path) {
      let node = path.node;
      const { id, init } = node;
      if (id && init) {
        if (id.type === 'ObjectPattern' && init.type === 'Identifier') {
          let updatePropType = newPropTypes.find(item => item.id === init.name);
          if (updatePropType) {
            const childTypes = findAndCompletePropTypes(findBlockStatement(path), findPropTypesInObjectPattern(id), options);
            if (childTypes.length > 0) {
              // 这时候说明肯定是复杂类型，所以用shape
              updatePropType.type = 'shape';
              updatePropType.childTypes = propTypesHelper.customMergePropTypes(updatePropType.childTypes, childTypes, options.sort);
            }
          }
        }
      }
      this.traverse(path);
    };
    let visitCallExpression = function (path) {
      let node = path.node;
      let callee = node.callee;
      if (callee.type === 'Identifier' && ids.indexOf(callee.name) !== -1) {
        let updatePropType = newPropTypes.find(item => item.id === callee.name);
        if (updatePropType) {
          updatePropType.type = 'func';
        }
      }
      this.traverse(path);
    };
    recast.visit(ast, {
      visitBinaryExpression: visitLogicalExpression,
      visitLogicalExpression: visitLogicalExpression,
      visitOptionalMemberExpression: visitMemberExpression,
      visitVariableDeclarator: visitVariableDeclarator,
      visitMemberExpression: visitMemberExpression,
      visitUpdateExpression: function (path) {
        let node = path.node;
        let argument = node.argument;
        if (argument && argument.type === 'Identifier' && ids.indexOf(argument.name) !== -1) {
          let updatePropType = newPropTypes.find(item => item.id === argument.name);
          updatePropType && (updatePropType.type = 'number');
        }
        this.traverse(path);
      },
      visitCallExpression: visitCallExpression,
      visitOptionalCallExpressionL: visitCallExpression
    });
  }
  return newPropTypes;
}

exports.findPropTypes = findPropTypes;
exports.findPropTypesNode = findPropTypesNode;
exports.findAndCompletePropTypes = findAndCompletePropTypes;
