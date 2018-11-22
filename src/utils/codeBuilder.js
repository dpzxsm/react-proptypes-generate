const recast = require("recast");
const astHelper = require("../astHelper");
const actions = require("../actions");
const constants = require("../constants");
const {
  assignmentExpression,
  memberExpression,
  objectExpression,
  callExpression,
  classProperty,
  identifier: id,
  property
} = recast.types.builders;

function deleteAstLoc(ast) {
  for (let key in ast) {
    if (ast.hasOwnProperty(key)) {
      if (key === "loc" || key === 'range') {
        ast[key] = null;
      } else {
        if (typeof (ast[key]) == "object") {
          deleteAstLoc(ast[key]);
        }
      }
    }
  }
}

function buildObjectExpression(propTypes) {
  return objectExpression(propTypes.map(item => {
    if (constants.specialTypes.indexOf(item.type) >= 0) {
      let argExpressions = [];
      if (item.jsonData) {
        let argAst = astHelper.flowAst("(" + item.jsonData + ")");
        if (argAst.body && argAst.body.length > 0) {
          let firstStatement = argAst.body[0];
          if (firstStatement.type === "ExpressionStatement") {
            // deleteAstLoc(firstStatement);
            argExpressions.push(firstStatement.expression);
          }
        }
      }
      let specialAst = callExpression(memberExpression(id("PropTypes"), id(item.type)), argExpressions);
      return property("init", id(item.name), item.isRequired ?
        memberExpression(specialAst, id("isRequired")) :
        specialAst);
    } else {
      return property("init", id(item.name), item.isRequired ?
        memberExpression(memberExpression(id("PropTypes"), id(item.type)), id("isRequired")) :
        memberExpression(id("PropTypes"), id(item.type))
      );
    }
  }));
}

function buildES6PropTypes(propTypes, options) {
  let ast = assignmentExpression("=",
    memberExpression(id(options.name), id("propTypes")), buildObjectExpression(propTypes));
  return recast.prettyPrint(ast, { tabWidth: 2, }).code.replace(/([\n|\r]){2}/g, "$1");
}

function buildClassPropTypes(propTypes, options) {
  let ast = classProperty(id('propTypes'), buildObjectExpression(propTypes), null, true);
  return recast.prettyPrint(ast, { tabWidth: 2, }).code.replace(/([\n|\r]){2}/g, "$1").replace(/([\n|\r])/g, "$1  ");
}

function buildPropTypes(propTypes, options) {
  if (options.codeStyle === 'class') {
    return buildClassPropTypes(propTypes, options);
  } else {
    return buildES6PropTypes(propTypes, options);
  }

}

function getEditRanges(code, options) {
  let ast = astHelper.flowAst(code);
  return actions.findPropTypesNode(ast, options).then((node) => {
    let ranges = [];
    if (node) {
      let objectNode;
      if (node.type === "ClassProperty") {
        objectNode = node.value;
      } else if (node.type === "AssignmentExpression") {
        objectNode = node.right;
      }
      if (objectNode && objectNode.type === 'ObjectExpression') {
        objectNode.properties.forEach((item) => {
          if (item.value.type === "MemberExpression") {
            let object = item.value.object;
            let property = item.value.property;
            if (object.type === "Identifier" && object.name === "PropTypes" && property.type === "Identifier") {
              if (property.name === "any") {
                ranges.push(property.range);
              }
            } else if (object.type === "MemberExpression") {
              let name = object.property.name;
              if (name === "any") {
                ranges.push(object.property.range);
              }
            }
          }
        });
      }
    }
    return {
      ranges,
      node
    };
  });
}

exports.buildPropTypes = buildPropTypes;
exports.getEditRanges = getEditRanges;