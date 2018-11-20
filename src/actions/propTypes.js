const recast = require("recast");
const Promise = require('bluebird');
const arrayUtils = require("../utils/arrayUtils");
const PropTypes = require("../beans/PropTypes");
const propTypesHelper = require("../utils/propTypesHelper");

function findPropTypes({ classNode, propTypesNode, defaultPropsNode }) {
  return Promise.all([
    findPropTypesByPropsIdentity(classNode, 'props'),
    findPropTypesInPropTypeNode(propTypesNode),
    findPropTypesInDefaultPropsNode(defaultPropsNode)
  ]).then((results) => {
    return results.reduce((total = [], current = []) => total.concat(current))
      .sort(arrayUtils.sortByKey())
      .filter(arrayUtils.distinctByKey("name"));
  });
}

function findPropTypesByPropsIdentity(ast, identity) {
  let propTypes = [];
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
      if (idNode && initNode && idNode.type === 'ObjectPattern'
        && initNode.type === 'MemberExpression' && initNode.property.name === identity) {
        let properties = idNode.properties || [];
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
                  propType.setDefaultValue(recast.prettyPrint(right, { tabWidth: 2 }).code);
                }
                propTypes.push(propType);
              }
            } else if (property.type === 'Identifier') {
              propTypes.push(new PropTypes(property.name));
            }
          }
        }
      }
      this.traverse(path);
    }
  });
  return Promise.resolve(propTypes);
}

function findClassNode(ast, { name }) {
  let classNode;
  recast.visit(ast, {
    visitClassDeclaration: function (path) {
      const node = path.node;
      if (node.id.name === name) {
        classNode = node;
      }
      this.traverse(path);
    }
  });
  if (classNode) {
    return Promise.resolve(classNode);
  } else {
    return Promise.reject(new Error('The selected text is not a valid React Component !'));
  }
}

function findPropTypesNode(ast, { name, alias }) {
  let propTypesNode;
  recast.visit(ast, {
    visitAssignmentExpression: function (path) {
      const node = path.node;
      let left = node.left;
      if (left.type === "MemberExpression"
        && left.object.type === "Identifier"
        && left.property.type === "Identifier"
        && left.object.name === name
        && left.property.name === (alias || "propTypes")) {
        propTypesNode = node;
      }
      this.traverse(path);
    }
  });
  if (propTypesNode) {
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
          if( value.type === "MemberExpression"){
            let props = new PropTypes(key.name);
            propTypesHelper.updatePropTypeFromCode(props, recast.prettyPrint(value).code);
            propTypes.push(props);
          }else if(value.type === "CallExpression"){
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
            props.setDefaultValue(recast.prettyPrint(value).code);
          }
          propTypes.push(props);
        }
        this.traverse(path);
      }
    });
  }
  return Promise.resolve(propTypes);
}

exports.findPropTypes = findPropTypes;
exports.findClassNode = findClassNode;
exports.findPropTypesNode = findPropTypesNode;
exports.findPropTypesInPropTypeNode = findPropTypesInPropTypeNode;