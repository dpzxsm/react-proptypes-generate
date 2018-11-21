const vscode = require('vscode');
const actions = require("./actions");
const Promise = require("bluebird");
const astHelper = require("./astHelper");
const rangeUtils = require("./utils/rangeUtils");
const codeBuilder = require("./utils/codeBuilder");
const vscodeHelper = require("./utils/vscodeHelper");

function generate() {
  const editor = vscode.window.activeTextEditor;
  const { document, selection } = editor;
  const componentName = document.getText(selection);
  if (!componentName) {
    vscode.window.showErrorMessage("You must select the text as a Component's name !");
    return;
  }
  const ast = astHelper.flowAst(document.getText());
  if (!ast) {
    vscode.window.showErrorMessage("Parse JS file error !");
    return;
  }
  const options = {
    name: componentName
  };
  Promise.all([
    actions.findClassNode(ast, options),
    actions.findPropTypesNode(ast, options),
    actions.findPropTypesNode(ast, Object.assign({}, options, {
      alias: 'defaultProps'
    }))
  ]).then((nodes) => {
    let classNode = nodes[0];
    let propTypesNode = nodes[1];
    let defaultPropsNode = nodes[2];
    return actions.findPropTypes({
      classNode,
      propTypesNode,
      defaultPropsNode
    }).then((propTypes) => {
      if (propTypes.length === 0) {
        throw new Error("Not find any props");
      }
      return editor.edit(editBuilder => {
        let code = codeBuilder.buildPropTypes(propTypes, options);
        if (propTypesNode) {
          // replace old object
          let range = rangeUtils.getVsCodeRangeByLoc(propTypesNode.loc);
        } else {
          // add new object
          code = "\n" + code + "\n";
        }
        return codeBuilder.getEditRanges(code, options).then(({ ranges, node }) => {
          return vscodeHelper.startComplementPropTypes(ranges, propTypesNode ?
            rangeUtils.getVsCodeRangeByLoc(propTypesNode.loc) : new vscode.Position(classNode.loc.end.line, 0),
            code);
        });
      });
    });
  }).then((result) => {
    // result && vscode.window.showInformationMessage("perfect !");
  }).catch(error => {
    vscode.window.showErrorMessage(error.toString());
  });

}

exports.generate = generate;