function isBool(value) {
  return !!value.match(/true|false/);
}

function isNumeric(value) {
  return !!value.match(/-?[0-9]+.?[0-9]*/);
}

function getPropTypeByNode(node) {
  if (node.type === 'CallExpression' || node.type === "ArrowFunctionExpression") {
    return "func";
  } else if (node.type === "ObjectExpression") {
    return "object";
  } else if (node.type === "ArrayExpression") {
    return "array";
  } else if (node.type === "Literal") {
    return getPropTypeByValue(node.raw);
  } else {
    return "any";
  }
}

function getPropTypeByValue(value = "") {
  let type = 'any';
  if (value.startsWith("\"") && value.endsWith("\"")) {
    type = "string";
  } else if (value.startsWith("\'") && value.endsWith("\'")) {
    type = "string";
  } else if (value.startsWith("{") && value.endsWith("}")) {
    type = "object";
  } else if (value.startsWith("[") && value.endsWith("]")) {
    type = "array";
  } else if (isBool(value)) {
    type = "bool";
  } else if (isNumeric(value)) {
    type = "number";
  }
  return type;
}

function updatePropTypeFromCode(bean, code) {
  code = code.replace(/[\r\n]/g, "");
  let regex = new RegExp("(React)?\\s*\\.?\\s*PropTypes\\s*\\." +
    "\\s*(any|string|object|bool|func|number|array|symbol|node|exact|element|arrayOf|objectOf|oneOf|instanceOf|oneOfType|shape)" +
    "\\s*(\\((.*)\\))?" +
    "\\s*\\.?\\s*(isRequired)?$");
  let m = regex.exec(code);
  if (m) {
    bean.type = m[2] || "any";
    if (m[3]) {
      bean.setJsonData(m[4] || "")
    }
    bean.isRequired = !!m[5];
  }
  return bean;
}

// let result = updatePropTypeFromCode({}, "PropTypes.object([gegeeg: PropTypes.string.isRequired]).isRequired");
// console.log('suming-log', result);

exports.getPropTypeByNode = getPropTypeByNode;
exports.getPropTypeByValue = getPropTypeByValue;
exports.updatePropTypeFromCode = updatePropTypeFromCode;
