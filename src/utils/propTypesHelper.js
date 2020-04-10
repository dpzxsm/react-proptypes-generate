const PropTypes = require('../beans/PropTypes');
const merge = require('deepmerge');
const recast = require('recast');

function isBool(value) {
  return !!value.match(/true|false/);
}

function isNumeric(value) {
  return !!value.match(/-?[0-9]+.?[0-9]*/);
}

function getPropTypeByNode(node) {
  if (node.type === 'CallExpression' || node.type === 'ArrowFunctionExpression') {
    return 'func';
  } else if (node.type === 'ObjectExpression') {
    return 'object';
  } else if (node.type === 'ArrayExpression') {
    return 'array';
  } else if (node.type === 'Literal') {
    return getPropTypeByValue(node.raw);
  } else {
    return 'any';
  }
}

function getPropTypeByValue(value = '') {
  let type = 'any';
  if (value.startsWith('"') && value.endsWith('"')) {
    type = 'string';
  } else if (value.startsWith('\'') && value.endsWith('\'')) {
    type = 'string';
  } else if (value.startsWith('{') && value.endsWith('}')) {
    type = 'object';
  } else if (value.startsWith('[') && value.endsWith(']')) {
    type = 'array';
  } else if (isBool(value)) {
    type = 'bool';
  } else if (isNumeric(value)) {
    type = 'number';
  }
  return type;
}

function updatePropTypeFromCode(bean, code) {
  code = code.replace(/[\r\n]/g, '');
  let regex = new RegExp('(React)?\\s*\\.?\\s*PropTypes\\s*\\.' +
    '\\s*(any|string|object|bool|func|number|array|symbol|node|exact|element|arrayOf|objectOf|oneOf|instanceOf|oneOfType|shape)' +
    '\\s*(\\((.*)\\))?' +
    '\\s*\\.?\\s*(isRequired)?$');
  let m = regex.exec(code);
  if (m) {
    bean.type = m[2] || 'any';
    if (m[3] && m[4]) {
      bean.jsonData = m[4];
    }
    bean.isRequired = !!m[5];
  }
  return bean;
}

function getPropTypeByMemberExpression(ids, path) {
  let code = recast.print(path.node).code;
  let regex = new RegExp(`(${ids.join('|')})((\\.[a-zA-Z_$][a-zA-Z0-9_$]*)+)`);
  let match = regex.exec(code);
  let lastPropType;
  if (match) {
    let properties = match[2].replace('.', '').split('.');
    for (let i = properties.length - 1; i >= 0; i--) {
      let propType = new PropTypes(properties[i]);
      if (lastPropType) {
        propType.childTypes = [lastPropType]
      }
      lastPropType = propType
    }
    if (lastPropType && path.parent.node.type === 'VariableDeclarator') {
      lastPropType.id = path.parent.node.id.name
    }
    return {
      name: match[1],
      propType: lastPropType
    };
  } else {
    return {};
  }
}

// 自定义合并数组
function customMergeChildTypes(target, source) {
  const destination = target.slice();
  const targetNames = target.map(item => item.name);
  source.forEach((item, index) => {
    if (targetNames.indexOf(item.name) !== -1) {
      let oldTypeIndex = destination.findIndex(dest => dest.name === item.name);
      destination[oldTypeIndex] = customMergePropTypes(destination[oldTypeIndex], item)
    } else {
      destination.push(item);
    }
  });
  return destination;
}

// 合并两个PropType对象
function customMergePropTypes(target, source) {
  let result = merge(target, source, {
    arrayMerge: customMergeChildTypes
  });

  if (result && !Array.isArray(result)) {
    // 修改合并后的对象的原型链
    result.__proto__ = PropTypes.prototype
  }
  return result;
}

exports.getPropTypeByNode = getPropTypeByNode;
exports.getPropTypeByValue = getPropTypeByValue;
exports.updatePropTypeFromCode = updatePropTypeFromCode;
exports.getPropTypeByMemberExpression = getPropTypeByMemberExpression;
exports.customMergePropTypes = customMergePropTypes;
