const recast = require("recast");

function isHasJSXElement(ast) {
	let flag = false;
	recast.visit(ast, {
		visitJSXElement: function (path) {
			flag = true;
			this.abort();
		}
	});
	return flag;
}

function getComponentName(ast) {
	if (!isHasJSXElement(ast)) {
		return null;
	}
	const ExportDeclarationTypes = [
		'ExportNamedDeclaration',
		'ExportDefaultDeclaration',
	];
	const VariableDeclarationTypes = [
		'VariableDeclaration',
	];
	const DirectDeclarationTypes = [
		'FunctionDeclaration',
		'ClassDeclaration',
	];
	// 判断是否是赋值表达式
	if (ast.type === 'ExpressionStatement') {
		let expression = ast.expression;
		if (expression.type === 'AssignmentExpression') {
			let left = expression.left;
			if (left) {
				return recast.print(left).code;
			}
		}
	}

	// 判断是否是函数声明或者变量声明
	let declaration = ast;
	if (ExportDeclarationTypes.indexOf(ast.type) !== -1) {
		declaration = ast.declaration;
	}
	if (declaration) {
		if (VariableDeclarationTypes.indexOf(declaration.type) !== -1) {
			if (declaration.declarations.length > 0) {
				let id = declaration.declarations[0].id;
				if (id) {
					return id.name;
				}
			}
		} else if (DirectDeclarationTypes.indexOf(declaration.type) !== -1) {
			let id = declaration.id;
			if (id) {
				return id.name;
			}
		}
	}

	return null;
}

// 找到可能的组件名称，不一定准确
function findComponentNames(ast) {
	let result = [];
	let body = ast.body || [];
	for (let i = 0; i < body.length; i++) {
		let name = getComponentName(body[i]);
		if (name && name.match(/^[A-Z]/)) {
			result.push({
				name,
				node: body[i]
			});
		}
	}
	return result;
}

function findComponentNode(ast, options) {
	let name = options.name;
	let names = findComponentNames(ast).map(item => item.name);
	let getFunctionComponentNode = (init) => {
		if (init) {
			if (init.type === 'CallExpression' && init.arguments.length > 0) {
				const argNode = init.arguments[0];
				if (argNode.type === 'FunctionExpression' || argNode.type === 'ArrowFunctionExpression') {
					return argNode;
				}
			} else if (init.type === 'FunctionExpression' || init.type === 'ArrowFunctionExpression') {
				return init;
			}
		}
		return null;
	};
	if (names.indexOf(name) !== -1) {
		let componentNode;
		recast.visit(ast, {
			visitClassDeclaration: function (path) {
				const node = path.node;
				if (node.id.name === name) {
					componentNode = node;
					this.abort();
				}
				this.traverse(path);
			},
			visitFunctionDeclaration: function (path) {
				const node = path.node;
				if (node.id && node.id.type === 'Identifier' && node.id.name === name) {
					componentNode = node;
					this.abort();
				}
				this.traverse(path);
			},
			visitVariableDeclarator: function (path) {
				const node = path.node;
				if (node.id && node.id.name === name) {
					const result = getFunctionComponentNode(node.init);
					if (result) {
						componentNode = result;
						this.abort();
					}
				}
				this.traverse(path);
			},
			visitAssignmentExpression: function (path) {
				const node = path.node;
				const leftCode = recast.print(node.left).code;
				if (leftCode === name) {
					const result = getFunctionComponentNode(node.right);
					if (result) {
						componentNode = result;
						this.abort();
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

// 查找component的最顶层的range
function findComponentParentRange(ast, name) {
	let components = findComponentNames(ast);
	let component = components.find(item => item.name === name);
	if (component) {
		return component.node.range;
	}
}

module.exports = {
	findComponentNames,
	findComponentNode,
	findComponentParentRange
};
