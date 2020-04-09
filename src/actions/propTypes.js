const recast = require('recast');
const Promise = require('bluebird');
const arrayUtils = require('../utils/arrayUtils');
const PropTypes = require('../beans/PropTypes');
const propTypesHelper = require('../utils/propTypesHelper');
const setting = require('../setting');

function findPropTypes({ componentNode, propTypesNode, defaultPropsNode }, options) {
  return Promise.all([
    findPropTypesByPropsIdentity(componentNode, options),
    findPropTypesInPropTypeNode(propTypesNode, options),
    findPropTypesInDefaultPropsNode(defaultPropsNode, options)
  ]).then((results) => {
    return results.reduce((total = [], current = []) => total.concat(current))
      .sort(arrayUtils.sortByKey())
      .filter(arrayUtils.distinctByKey('name'));
  });
}

function findPropTypesByPropsIdentity(ast, options) {
  let identity = 'props';
  let propTypes = [];
  if ((ast.type === 'FunctionDeclaration' || ast.type === 'ArrowFunctionExpression')
    && ast.params.length > 0
  ) {
    let firstParams = ast.params[0];
    if (firstParams.type === 'Identifier') {
      identity = ast.params[0].name;
    } else if (firstParams.type === 'ObjectPattern') {
      propTypes.push(...findPropTypesInObjectPattern(firstParams, options))
    }
  }

  recast.visit(ast, {
    visitMemberExpression: function (path) {
      let { propType } = propTypesHelper.getPropTypeByMemberExpression(['this\\.props', 'props'], path);
      if (propType) {
        let newPropTypes = findAndCompletePropTypes(path, [propType]);
        propTypes = propTypesHelper.customMergePropTypes(propTypes, [propType])
      }
      this.traverse(path);
    },
    visitVariableDeclarator: function (path) {
      let node = path.node;
      let idNode = node.id;
      let initNode = node.init;
      if (idNode && initNode && idNode.type === 'ObjectPattern') {
        if (
          (initNode.type === 'MemberExpression' && initNode.property.name === identity) ||
          (initNode.type === 'Identifier' && initNode.name === identity)
        ) {
          let newPropTypes = findAndCompletePropTypes(path, findPropTypesInObjectPattern(idNode));
          propTypes = propTypesHelper.customMergePropTypes(propTypes, newPropTypes)
        }
      }
      this.traverse(path);
    }
  });
  return Promise.resolve(propTypes);
}

function findComponentNode(ast, options) {
  let name = options.name;
  let componentNode;
  recast.visit(ast, {
    visitClassDeclaration: function (path) {
      const node = path.node;
      if (node.id.name === name) {
        componentNode = node;
      }
      this.traverse(path);
    },
    visitFunctionDeclaration: function (path) {
      const node = path.node;
      if (node.id && node.id.type === 'Identifier' && node.id.name === name) {
        componentNode = node;
      }
      this.traverse(path);
    },
    visitArrowFunctionExpression: function (path) {
      const node = path.node;
      const parentNode = path.parentPath.node;
      if (parentNode.type === 'VariableDeclarator' && parentNode.id && parentNode.id.type === 'Identifier' && parentNode.id.name === name) {
        componentNode = node;
      }
      this.traverse(path);
    }
  });
  if (componentNode) {
    return Promise.resolve(componentNode);
  } else {
    return Promise.reject(new Error('The selected text is not a valid React Component !'));
  }
}

function findPropTypesNode(ast, options) {
  let { name, alias } = options;
  let propTypesNode;
  let propTypesClassPropertyNode;
  recast.visit(ast, {
    visitAssignmentExpression: function (path) {
      const node = path.node;
      let left = node.left;
      if (left && left.type === 'MemberExpression'
        && left.object.type === 'Identifier'
        && left.property.type === 'Identifier'
        && left.object.name === name
        && left.property.name === (alias || 'propTypes')) {
        propTypesNode = node;
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

function findPropTypesInPropTypeNode(ast, options) {
  let propTypes = [];
  if (ast) {
    recast.visit(ast, {
      visitProperty: function (path) {
        const node = path.node;
        let key = node.key;
        let value = node.value;
        if (key && value && key.type === 'Identifier') {
          if (value.type === 'MemberExpression') {
            let props = new PropTypes(key.name);
            propTypesHelper.updatePropTypeFromCode(props, recast.prettyPrint(value).code);
            propTypes.push(props);
          } else if (value.type === 'CallExpression') {
            let props = new PropTypes(key.name);
            propTypesHelper.updatePropTypeFromCode(props, recast.prettyPrint(value).code);
            propTypes.push(props);
          }
        }
        this.traverse(path);
      }
    });
  }
  return Promise.resolve(propTypes);
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
          props.type = propTypesHelper.getPropTypeByNode(value);
          if (props.type !== 'any') {
            props.setDefaultValue(recast.prettyPrint(value, setting.getCodeStyle(options)).code);
          }
          propTypes.push(props);
        }
        this.traverse(path);
      }
    });
  }
  return Promise.resolve(propTypes);
}

function findPropTypesInObjectPattern(ast, options) {
  let propTypes = [];
  let properties = ast.properties || [];
  for (let i = 0; i < properties.length; i++) {
    let property = properties[i].value;
    let key = properties[i].key;
    if (property && key) {
      let propType = new PropTypes(key.name);
      if (property.type === 'AssignmentPattern') {
        let left = properties[i].value.left;
        let right = properties[i].value.right;
        if (left && left.type === 'Identifier' && right) {
          propType.type = propTypesHelper.getPropTypeByNode(right);
          if (propType.type !== 'any') {
            propType.setDefaultValue(recast.prettyPrint(right, setting.getCodeStyle(options)).code);
          }
          propType.setId(left.name);
          propTypes.push(propType);
        }
      } else if (property.type === 'Identifier') {
        propType.setId(property.name);
        propTypes.push(propType);
      }
    }
  }
  return propTypes;
}

// 获取当前函数的块级作用域
function findBlockStatement(path) {
  while (true) {
    if (!path.parent) {
      return null;
    }
    if (path.parent.node.type === 'BlockStatement') {
      return path.parent.node;
    } else {
      return findBlockStatement(path.parent)
    }
  }
}

function findAndCompletePropTypes(path, propTypes) {
  let newPropTypes = propTypes.slice();
  let ids = newPropTypes.filter(item => !!item.id).map(item => item.id);
  let ast = findBlockStatement(path);
  if (ast) {
    recast.visit(ast, {
      visitIdentifier: function (path) {
        this.traverse(path);
      },
      visitMemberExpression: function (path) {
        let { name, propType } = propTypesHelper.getPropTypeByMemberExpression(ids, path);
        if (name && propType) {
          let updatePropType = newPropTypes.find(item => item.name === name);
          if (updatePropType) {
            updatePropType.childTypes = propTypesHelper.customMergePropTypes(updatePropType.childTypes, [propType])
          }
        }
        this.traverse(path);
      },
    });
  }
  return newPropTypes;
}

exports.findPropTypes = findPropTypes;
exports.findComponentNode = findComponentNode;
exports.findPropTypesNode = findPropTypesNode;
exports.findPropTypesInPropTypeNode = findPropTypesInPropTypeNode;
