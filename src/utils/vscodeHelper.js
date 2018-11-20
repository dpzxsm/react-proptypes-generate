const vscode = require('vscode');
const Promise = require('bluebird');
const constants = require("../constants");

const smallNumberDecorationType = vscode.window.createTextEditorDecorationType({
  borderWidth: '1px',
  borderStyle: 'solid',
  overviewRulerColor: 'blue',
  overviewRulerLane: vscode.OverviewRulerLane.Right,
  light: {
    // this color will be used in light color themes
    borderColor: '#8000FF'
  },
  dark: {
    // this color will be used in dark color themes
    borderColor: '#DA70D6'
  }
});

function startComplementPropTypes(ranges, scrollRange) {
  let activeEditor = vscode.window.activeTextEditor;
  if (activeEditor && scrollRange) {
    activeEditor.revealRange(scrollRange, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }
  return Promise.reduce(ranges, (total, current) => {
    activeEditor && activeEditor.setDecorations(smallNumberDecorationType, [current]);
    return vscode.window.showQuickPick(constants.types, {}).then((result) => {
      activeEditor && activeEditor.setDecorations(smallNumberDecorationType, []);
      if (!result) {
        throw new Error("Stop complement !");
      } else {
        total.push(current);
        activeEditor && activeEditor.edit(editBuilder => {
          editBuilder.replace(current, result);
        });
        return total;
      }
    });
  }, []).then(() => {
    vscode.window.showInformationMessage('Completion');
  }).catch((error) => {
    vscode.window.showInformationMessage(error.message);
  });
}

exports.startComplementPropTypes = startComplementPropTypes;