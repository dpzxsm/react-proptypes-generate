// 获取PropTypes的代码
const Promise = require("bluebird");
const actionHelper = require("../actions");
const codeBuilder = require("../utils/codeBuilder");

function generatePropTypesCode(ast, options) {
	return Promise.all([
		actionHelper.findComponentNode(ast, options),
		actionHelper.findPropTypesNode(ast, options),
		actionHelper.findPropTypesNode(ast, Object.assign({}, options, {
			alias: 'defaultProps'
		}))
	], options).then((nodes) => {
		let componentNode = nodes[0];
		let propTypesNode = nodes[1];
		let defaultPropsNode = nodes[2];
		return actionHelper.findPropTypes({
			componentNode,
			propTypesNode,
			defaultPropsNode
		}, options, ast.comments).then((propTypes) => {
			if (propTypes.length === 0) {
				throw new Error("Not find any props");
			}
			if (propTypesNode) {
				if (propTypesNode.type === 'ExpressionStatement') {
					// override old code style
					options.codeStyle = 'default';
				} else if (propTypesNode.type === 'ClassProperty') {
					options.codeStyle = 'class';
				}
			} else if (componentNode.type === 'FunctionExpression' || componentNode.type === 'FunctionDeclaration' || componentNode.type === 'ArrowFunctionExpression') {
				options.codeStyle = 'default';
			}
			return {
				code: codeBuilder.buildPropTypes(propTypes, options),
				options,
				componentNode,
				propTypesNode,
				defaultPropsNode
			};
		});
	});
}

module.exports = {
	generatePropTypesCode
};
