const vscode = require("vscode");
const otherKeys = ["has", "get", "update", "inspect"];

function getConfig(key) {
  if (key) {
    return vscode.workspace.getConfiguration('propTypes').get(key);
  } else {
    let config = {};
    let propTypesConfig = vscode.workspace.getConfiguration('propTypes');
    for (let key in propTypesConfig) {
      if (otherKeys.indexOf(key) === -1) {
        config[key] = propTypesConfig.get(key);
      }
    }
    return config;
  }
}

function getCodeStyle() {
  return {
    tabWidth: 2
  }
}

exports.getConfig = getConfig;
exports.getCodeStyle = getCodeStyle;