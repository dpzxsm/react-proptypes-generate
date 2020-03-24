const vscode = require('vscode');
const Promise = require('bluebird');
const constants = require('../constants');
const rangeUtils = require('./rangeUtils');

function replaceCodeToSnippet(code, index, current) {
  return code.slice(0, current[0]) + '${' + (index + 1) + ':any}' + code.slice(current[1]);
}

function startComplementPropTypes(ranges, node, code) {
  let nodeRange = rangeUtils.getVsCodeRangeByLoc(node.loc);
  let snippetStr = ranges.length > 0 ? '' : code;
  for (let i = 0; i < ranges.length; i++) {
    let current = ranges[i];
    let p1 = i > 0 ? ranges[i - 1][1] : 0;
    let p2 = i < ranges;
    snippetStr += code.slice(p1, current[0]) + '${' + (i + 1) + ':any}';
    if (i === ranges.length - 1) {
      snippetStr += code.slice(current[1]);
    }
  }
  if (node.type === 'ClassProperty') {
    snippetStr = snippetStr.replace(/(\r\n|[\n|\r])\s{2}/g, '$1')
  }
  let snippet = new vscode.SnippetString(snippetStr);
  let activeEditor = vscode.window.activeTextEditor;
  return activeEditor && activeEditor.insertSnippet(snippet, nodeRange);
}

exports.startComplementPropTypes = startComplementPropTypes;
