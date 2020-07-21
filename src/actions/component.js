const recast = require("recast");

function isComponent(ast) {
  let flag = false
  recast.visit(ast, {
    visitJSXElement: function (path) {
      flag = true
      this.abort();
    }
  })
  return flag
}

function getComponentName(ast) {
  const ExportDeclarationTypes = [
    'ExportNamedDeclaration',
    'ExportDefaultDeclaration',
  ]
  const VariableDeclarationTypes = [
    'VariableDeclaration',
  ]
  const DirectDeclarationTypes = [
    'FunctionDeclaration',
    'ClassDeclaration',
  ]
  let declaration = ast
  if (ExportDeclarationTypes.indexOf(ast.type) !== -1) {
    declaration = ast.declaration
  }
  if (declaration) {
    if (VariableDeclarationTypes.indexOf(declaration.type) !== -1) {
      if (declaration.declarations.length > 0) {
        let id = declaration.declarations[0].id
        if (id) {
          return id.name
        }
      }
    } else if (DirectDeclarationTypes.indexOf(declaration.type) !== -1) {
      let id = declaration.id;
      if (id) {
        return id.name
      }
    }
  }

  return null
}

function findComponentNames(ast) {
  let result = []
  let body = ast.body || []
  for (let i = 0; i < body.length; i++) {
    if (isComponent(body[i])) {
      let name = getComponentName(body[i])
      if(name && name.match(/^[A-Z]/)){
        result.push(name)
      }
    }
  }
  return result
}


module.exports = {
  findComponentNames
}
