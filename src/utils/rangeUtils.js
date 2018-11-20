const vscode = require('vscode');

function getVsCodeRangeByLoc(loc) {
  let start = new vscode.Position(loc.start.line - 1, loc.start.column);
  let end = new vscode.Position(loc.end.line - 1, loc.end.column);
  return new vscode.Range(start, end);
}

exports.getVsCodeRangeByLoc = getVsCodeRangeByLoc;