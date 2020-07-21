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

// 找到可能的组件名称，不一定准确
function findComponentNames(ast) {
  let result = []
  let body = ast.body || []
  for (let i = 0; i < body.length; i++) {
    if (isComponent(body[i])) {
      let name = getComponentName(body[i])
      if (name && name.match(/^[A-Z]/)) {
        result.push({
          name,
          node: body[i]
        })
      }
    }
  }
  return result
}

function findComponentNode(ast, options) {
  let name = options.name;
  let names = findComponentNames(ast).map(item => item.name)
  if (names.indexOf(name) !== -1) {
    let componentNode;
    recast.visit(ast, {
      visitClassDeclaration: function (path) {
        const node = path.node;
        if (node.id.name === name) {
          componentNode = node;
          this.abort()
        }
        this.traverse(path);
      },
      visitFunctionDeclaration: function (path) {
        const node = path.node;
        if (node.id && node.id.type === 'Identifier' && node.id.name === name) {
          componentNode = node;
          this.abort()
        }
        this.traverse(path);
      },
      visitVariableDeclarator: function (path) {
        const node = path.node;
        if (node.id && node.id.name === name) {
          const init = node.init;
          if (init && init.type === 'CallExpression' && init.arguments.length > 0) {
            const argNode = init.arguments[0];
            if (argNode.type === 'FunctionExpression' || argNode.type === 'ArrowFunctionExpression') {
              componentNode = argNode
              this.abort()
            }
          } else if (init && init.type === 'FunctionExpression' || init.type === 'ArrowFunctionExpression') {
            componentNode = init
            this.abort()
          }
        }
        this.traverse(path);
      }
    });
    if (componentNode) {
      return Promise.resolve(componentNode);
    }
  }
  return Promise.reject(new Error('The selected text is not a valid React Component !'));
}

function findComponentParentRange(ast, name) {
  let components = findComponentNames(ast)
  let component = components.find(item => item.name === name)
  if (component) {
    return component.node.range
  }
}

module.exports = {
  findComponentNames,
  findComponentNode,
  findComponentParentRange
}
