const vscode = require('vscode');
const Promise = require('bluebird');
const constants = require("../constants");

function replaceCodeToSnippet(code, index, current) {
  return code.slice(0, current[0]) + "${" + (index + 1) + ":any}" + code.slice(current[1]);
}

function startComplementPropTypes(ranges, scrollRange, code) {
  let snippetStr = ranges.length > 0 ? "" : code;
  for (let i = 0; i < ranges.length; i++) {
    let current = ranges[i];
    let p1 = i > 0 ? ranges[i - 1][1] : 0;
    let p2 = i < ranges;
    snippetStr += code.slice(p1, current[0]) + "${" + (i + 1) + ":any}";
    if (i === ranges.length - 1) {
      snippetStr += code.slice(current[1]);
    }
  }
  let snippet = new vscode.SnippetString(snippetStr);
  let activeEditor = vscode.window.activeTextEditor;
  activeEditor && activeEditor.insertSnippet(snippet, scrollRange);
}

exports.startComplementPropTypes = startComplementPropTypes;