const recast = require('recast');
const astHelper = require('../astHelper');
const actions = require('../actions');
const constants = require('../constants');
const setting = require('../setting');
const {
	assignmentExpression,
	memberExpression,
	arrayExpression,
	objectExpression,
	callExpression,
	classProperty,
	identifier: id,
	variableDeclaration,
	variableDeclarator,
	importDeclaration,
	importDefaultSpecifier,
	literal,
	line,
	property
} = recast.types.builders;


function deleteAstLoc(ast) {
	for (let key in ast) {
		if (ast.hasOwnProperty(key)) {
			if (key === 'loc' || key === 'range') {
				ast[key] = null;
			} else {
				if (typeof (ast[key]) == 'object') {
					deleteAstLoc(ast[key]);
				}
			}
		}
	}
}

function buildMemberExpression(item) {
	if (!item) {
		return null;
	}
	if (constants.specialTypes.indexOf(item.type) >= 0) {
		let argExpressions = [];
		if (item.type === 'shape' || item.type === 'exact') {
			argExpressions.push(buildObjectExpression(item.childTypes));
		} else if (['arrayOf', 'objectOf', 'instanceOf'].indexOf(item.type) !== -1) {
			let singleType = buildMemberExpression(item.childTypes.find(item => !item.name));
			singleType && argExpressions.push(singleType);
		} else if (item.type === 'oneOf') {
			if (item.ast) {
				argExpressions.push(item.ast);
			}
		} else if (item.type === 'oneOfType') {
			argExpressions.push(buildArrayExpression(item.childTypes.filter(item => !item.name)));
		} else {
			return null;
		}
		let specialAst = callExpression(memberExpression(id('PropTypes'), id(item.type)), argExpressions);
		return item.isRequired ? memberExpression(specialAst, id('isRequired')) : specialAst;
	} else {
		return item.isRequired ?
			memberExpression(memberExpression(id('PropTypes'), id(item.type)), id('isRequired')) :
			memberExpression(id('PropTypes'), id(item.type));
	}
}

function buildArrayExpression(propTypes) {
	return arrayExpression(propTypes.map(item => {
		return buildMemberExpression(item);
	}));
}

function buildObjectExpression(propTypes) {
	let properties = propTypes.map((item, index) => {
		let propertyNode = property('init', id(item.name), buildMemberExpression(item));
		let lastItem = propTypes[index - 1];
		if (lastItem && lastItem.comment) {
			propertyNode.comments = [line(lastItem.comment)];
		}
		return propertyNode;
	});
	let finalItem = propTypes[propTypes.length - 1];
	if (finalItem && finalItem.comment) {
		let empty = property('init', id("_null"), id("_null"));
		empty.comments = [line(finalItem.comment)];
		properties.push(empty);
	}
	return objectExpression(properties);
}

function buildES6PropTypes(propTypes, options) {
	let ast = assignmentExpression('=',
		memberExpression(id(options.name), id('propTypes')), buildObjectExpression(propTypes));
	return recast.prettyPrint(ast, setting.getCodeStyle(options)).code
		.replace(/(\r\n|\n|\r)\1/g, '$1') // 替换多余的换行符
		.replace(/\s*(\/\/.*)/g, ' $1') // 替换注释前面的换行
		.replace(/\s*_null: _null/g, ''); // 替换占位字符串
}

function buildClassPropTypes(propTypes, options) {
	let ast = classProperty(id('propTypes'), buildObjectExpression(propTypes), null, true);
	return recast.prettyPrint(ast, setting.getCodeStyle(options)).code
		.replace(/(\r\n|\n|\r)\1/g, '$1')  // 替换多余的换行符
		.replace(/(\r\n|\n|\r)/g, '$1  ') // 替换最后一行的换行符
		.replace(/\s*(\/\/.*)/g, ' $1') // 替换注释前面的换行
		.replace(/\s*_null: _null/g, ''); // 替换占位字符串
}

function buildPropTypes(propTypes, options) {
	if (options.isRequired) {
		propTypes.forEach(item => {
			item.isRequired = true;
		});
	}
	let code = options.codeStyle === 'class'
		? buildClassPropTypes(propTypes, options)
		: buildES6PropTypes(propTypes, options);
	if (options.semicolon) {
		return code.replace(/;$/, "") + ";";
	} else {
		return code.replace(/;$/, "");
	}
}

function buildImportCode(options) {
	if (options.autoImport === 'commonJS') {
		let ast = variableDeclaration('const', [variableDeclarator(id('PropTypes'), callExpression(id('require'), [
			literal('prop-types')
		]))]);
		return recast.prettyPrint(ast, setting.getCodeStyle(options)).code.replace(/;$/, "") + (options.semicolon ? ";" : "");
	} else if (options.autoImport === 'ES6') {
		let ast = importDeclaration([importDefaultSpecifier(id('PropTypes'))], literal('prop-types'), 'value');
		return recast.prettyPrint(ast, setting.getCodeStyle(options)).code.replace(/;$/, "") + (options.semicolon ? ";" : "");
	} else {
		return '';
	}
}

function getEditRanges(code, options) {
	let ast = astHelper.flowAst(code);
	return actions.findPropTypesNode(ast, options).then((node) => {
		let ranges = [];
		if (node) {
			let objectNode;
			if (node.type === 'ClassProperty') {
				objectNode = node.value;
			} else if (node.type === 'ExpressionStatement' && node.expression.type === 'AssignmentExpression') {
				objectNode = node.expression.right;
			}
			if (objectNode && objectNode.type === 'ObjectExpression') {
				objectNode.properties.forEach((item) => {
					if (item.value.type === 'MemberExpression') {
						let object = item.value.object;
						let property = item.value.property;
						if (object.type === 'Identifier' && object.name === 'PropTypes' && property.type === 'Identifier') {
							if (property.name === 'any') {
								ranges.push(property.range);
							}
						} else if (object.type === 'MemberExpression') {
							let name = object.property.name;
							if (name === 'any') {
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
exports.buildImportCode = buildImportCode;
exports.getEditRanges = getEditRanges;
