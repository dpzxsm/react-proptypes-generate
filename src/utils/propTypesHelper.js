const PropTypes = require('../beans/PropTypes');
const merge = require('deepmerge');
const recast = require('recast');
const arrayUtils = require('./arrayUtils');

function updatePropTypeByNode(node, propType) {
  if (node.type === 'CallExpression'
    || node.type === 'FunctionExpression'
    || node.type === 'ArrowFunctionExpression') {
    propType.type = 'func';
  } else if (node.type === 'ObjectExpression') {
    let properties = node.properties;
    let childTypes = [];
    if (properties.length > 0) {
      propType.type = 'shape';
    } else {
      propType.type = 'object';
    }
    for (let i = 0; i < properties.length; i++) {
      let key = properties[i].key;
      let value = properties[i].value;
      let childType = new PropTypes(key.name);
      // 递归补充类型
      updatePropTypeByNode(value, childType);
      childTypes.push(childType);
    }
    //不需要合并子类型
    propType.childTypes = childTypes;
  } else if (node.type === 'ArrayExpression') {
    propType.type = 'array';
  } else if (node.type === 'Literal') {
    let value = node.value;
    if (typeof value === 'string') {
      propType.type = 'string';
    } else if (typeof value === 'boolean') {
      propType.type = 'bool';
    } else if (typeof value === 'number') {
      propType.type = 'number';
    }
  }
  return propType;
}

function updatePropTypeFromCode(bean, code) {
  code = code.replace(/[\r\n]/g, '');
  let regex = new RegExp('(React)?\\s*\\.?\\s*PropTypes\\s*\\.' +
    '\\s*(any|string|object|bool|func|number|array|symbol|node|exact|element|arrayOf|objectOf|oneOf|instanceOf|oneOfType|shape)' +
    '\\s*(\\((.*)\\))?' +
    '\\s*\\.?\\s*(isRequired)?$');
  let m = regex.exec(code);
  if (m) {
    if (m[2] && m[2] !== 'any') {
      bean.type = m[2];
    }
    if (m[3] && m[4]) {
      bean.jsonData = m[4];
    }
    if (!!m[5]) {
      bean.isRequired = true;
    }
  }
  return bean;
}

// 自定义合并数组
function customMergeChildTypes(target, source, sort) {
  const destination = target.slice();
  const targetNames = target.map(item => item.name);
  source.forEach(item => {
    if (targetNames.indexOf(item.name) !== -1) {
      let oldTypeIndex = destination.findIndex(dest => dest.name === item.name);
      destination[oldTypeIndex] = customMergePropTypes(destination[oldTypeIndex], item, sort);
    } else {
      destination.push(item);
    }
  });
  // 合并进行排序
  if (sort) {
    destination.sort(arrayUtils.sortByKey());
  }
  return destination;
}

// 合并两个PropType对象
function customMergePropTypes(target, source, sort) {
  let result = merge(target, source, {
    arrayMerge: (a, b) => customMergeChildTypes(a, b, sort)
  });

  if (result && !Array.isArray(result)) {
    if (Array.isArray(result)) {
      // do nothing
    } else {
      // 修改合并后的对象的原型链
      result.__proto__ = PropTypes.prototype;
    }
  }
  return result;
}

exports.updatePropTypeByNode = updatePropTypeByNode;
exports.customMergePropTypes = customMergePropTypes;
