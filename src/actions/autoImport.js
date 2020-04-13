const recast = require("recast");
const Promise = require('bluebird');

function findImportOrRequireModuleNode(ast, options) {
  let result = {};
  if (ast) {
    recast.visit(ast, {
      visitImportDeclaration: function (path) {
        let node = path.node;
        if (node.source && node.source.type === 'Literal'
          && node.source.value === 'prop-types') {
          result.importNode = node;
        }
        this.traverse(path);
      },
      visitCallExpression: function (path) {
        let node = path.node;
        let callee = node.callee;
        let params = node.arguments;
        if (callee && callee.type === 'Identifier' && callee.name === 'require'
          && params && params[0].type === 'Literal'
          && params[0].value === 'prop-types'
        ) {
          result.requireNode = path.parentPath.parentPath.node;
        }
        this.traverse(path);
      }
    });
  }
  return result;
}

exports.findImportOrRequireModuleNode = findImportOrRequireModuleNode;
