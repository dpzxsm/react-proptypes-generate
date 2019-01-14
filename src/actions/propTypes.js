const recast = require("recast");
const Promise = require('bluebird');
const arrayUtils = require("../utils/arrayUtils");
const PropTypes = require("../beans/PropTypes");
const propTypesHelper = require("../utils/propTypesHelper");
const setting = require("../setting");

function findPropTypes({ componentNode, propTypesNode, defaultPropsNode }) {
  return Promise.all([
    findPropTypesByPropsIdentity(componentNode),
    findPropTypesInPropTypeNode(propTypesNode),
    findPropTypesInDefaultPropsNode(defaultPropsNode)
  ]).then((results) => {
    return results.reduce((total = [], current = []) => total.concat(current))
      .sort(arrayUtils.sortByKey())
      .filter(arrayUtils.distinctByKey("name"));
  });
}

function findPropTypesByPropsIdentity(ast, identity = 'props') {
  let propTypes = [];
  if (ast.type === 'FunctionDeclaration'
    && ast.params.length > 0
  ) {
    let firstParams = ast.params[0];
    if (firstParams.type === 'Identifier') {
      identity = ast.params[0].name;
    } else if (firstParams.type === 'ObjectPattern') {
      propTypes.push(...findPropTypesInObjectPattern(firstParams))
    }
  }
  recast.visit(ast, {
    visitIdentifier: function (path) {
      let node = path.node;
      let pNode = path.parentPath.node;
      if (node.name === identity && pNode) {
        if (pNode.type === 'MemberExpression') {
          if (pNode.object.type === 'ThisExpression') {
            let ppNode = path.parentPath.parentPath.node;
            if (ppNode.type === 'MemberExpression') {
              let property = ppNode.property;
              if (property.type === "Identifier") {
                propTypes.push(new PropTypes(property.name));
              }
            }
          } else if (pNode.object.type === 'Identifier' && pNode.object.name === identity) {
            let property = pNode.property;
            if (property.type === "Identifier") {
              propTypes.push(new PropTypes(property.name));
            }
          }
        }
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
          propTypes.push(...findPropTypesInObjectPattern(idNode));
        }
      }
      this.traverse(path);
    }
  });
  return Promise.resolve(propTypes);
}

function findComponentNode(ast, { name }) {
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
    }
  });
  if (componentNode) {
    return Promise.resolve(componentNode);
  } else {
    return Promise.reject(new Error('The selected text is not a valid React Component !'));
  }
}

function findPropTypesNode(ast, { name, alias }) {
  let propTypesNode;
  let propTypesClassPropertyNode;
  recast.visit(ast, {
    visitAssignmentExpression: function (path) {
      const node = path.node;
      let left = node.left;
      if (left && left.type === "MemberExpression"
        && left.object.type === "Identifier"
        && left.property.type === "Identifier"
        && left.object.name === name
        && left.property.name === (alias || "propTypes")) {
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
        && key.name === (alias || "propTypes")
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

function findPropTypesInPropTypeNode(ast) {
  let propTypes = [];
  if (ast) {
    recast.visit(ast, {
      visitProperty: function (path) {
        const node = path.node;
        let key = node.key;
        let value = node.value;
        if (key && value && key.type === "Identifier") {
          if (value.type === "MemberExpression") {
            let props = new PropTypes(key.name);
            propTypesHelper.updatePropTypeFromCode(props, recast.prettyPrint(value).code);
            propTypes.push(props);
          } else if (value.type === "CallExpression") {
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

function findPropTypesInDefaultPropsNode(ast) {
  let propTypes = [];
  if (ast) {
    recast.visit(ast, {
      visitProperty: function (path) {
        const node = path.node;
        let key = node.key;
        let value = node.value;
        if (key && value && key.type === "Identifier") {
          let props = new PropTypes(key.name);
          props.type = propTypesHelper.getPropTypeByNode(value);
          if (props.type !== "any") {
            props.setDefaultValue(recast.prettyPrint(value, setting.getCodeStyle()).code);
          }
          propTypes.push(props);
        }
        this.traverse(path);
      }
    });
  }
  return Promise.resolve(propTypes);
}

function findPropTypesInObjectPattern(ast) {
  let propTypes = [];
  let properties = ast.properties || [];
  for (let i = 0; i < properties.length; i++) {
    let property = properties[i].value;
    if (property) {
      if (property.type === 'AssignmentPattern') {
        let left = properties[i].value.left;
        let right = properties[i].value.right;
        if (left && left.type === "Identifier" && right) {
          let propType = new PropTypes(left.name);
          propType.type = propTypesHelper.getPropTypeByNode(right);
          if (propType.type !== "any") {
            propType.setDefaultValue(recast.prettyPrint(right, setting.getCodeStyle()).code);
          }
          propTypes.push(propType);
        }
      } else if (property.type === 'Identifier') {
        propTypes.push(new PropTypes(property.name));
      }
    }
  }
  return propTypes;
}

exports.findPropTypes = findPropTypes;
exports.findComponentNode = findComponentNode;
exports.findPropTypesNode = findPropTypesNode;
exports.findPropTypesInPropTypeNode = findPropTypesInPropTypeNode;