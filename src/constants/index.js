const types = [
  'any',
  'string',
  'object',
  'bool',
  'func',
  'number',
  'array',
  'symbol',
  'node',
  'exact',
  'element',
  'arrayOf',
  'objectOf',
  'oneOf',
  'instanceOf',
  'oneOfType',
  'shape'
];

const specialTypes = [
  'shape', //对象
  'exact', //对象
  'arrayOf', //单类型
  'objectOf',//单类型
  'instanceOf',//单类型
  'oneOf', //数组
  'oneOfType'//数组
];

exports.types = types;
exports.specialTypes = specialTypes;
