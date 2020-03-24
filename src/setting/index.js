const otherKeys = ['has', 'get', 'update', 'inspect'];

function getConfig(key) {
  const vscode = require('vscode');
  if (key) {
    return vscode.workspace.getConfiguration('propTypes').get(key);
  } else {
    let config = {};
    let propTypesConfig = vscode.workspace.getConfiguration('propTypes');
    for (let key in propTypesConfig) {
      if (propTypesConfig.hasOwnProperty(key) && otherKeys.indexOf(key) === -1) {
        config[key] = propTypesConfig.get(key);
      }
    }
    return config;
  }
}

function getCodeStyle() {
  return {
    tabWidth: getConfig('tabWidth') || 2,
    quote: getConfig('quote') || null,
    trailingComma: getConfig('trailingComma') || false
  }
}

exports.getConfig = getConfig;
exports.getCodeStyle = getCodeStyle;
