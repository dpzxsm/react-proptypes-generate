const vscode = require('vscode');
const actions = require('./actions');
const Promise = require('bluebird');
const astHelper = require('./astHelper');
const rangeUtils = require('./utils/rangeUtils');
const codeBuilder = require('./utils/codeBuilder');
const vscodeHelper = require('./utils/vscodeHelper');
const setting = require('./setting');

function generate() {
  const editor = vscode.window.activeTextEditor;
  const { document, selection } = editor;
  const wordRange = document.getWordRangeAtPosition(selection.start);
  const componentName = editor.document.getText(wordRange);
  if (!componentName) {
    vscode.window.showErrorMessage('You must select the text as a Component\'s name !');
    return;
  }
  const ast = astHelper.flowAst(document.getText());
  if (!ast) {
    vscode.window.showErrorMessage('Parse JS file error !');
    return;
  }
  const options = {
    name: componentName
  };
  // merge config to options
  Object.assign(options, setting.getConfig());
  Promise.all([
    actions.findComponentNode(ast, options),
    actions.findPropTypesNode(ast, options),
    actions.findPropTypesNode(ast, Object.assign({}, options, {
      alias: 'defaultProps'
    }))
  ]).then((nodes) => {
    let componentNode = nodes[0];
    let propTypesNode = nodes[1];
    let defaultPropsNode = nodes[2];
    return actions.findPropTypes({
      componentNode,
      propTypesNode,
      defaultPropsNode
    }).then((propTypes) => {
      if (propTypes.length === 0) {
        throw new Error('Not find any props');
      }
      if (propTypesNode) {
        if (propTypesNode.type === 'AssignmentExpression') {
          // override old code style
          options.codeStyle = 'default';
        } else if (propTypesNode.type === 'ClassProperty') {
          options.codeStyle = 'class';
        }
      } else if (componentNode.type === 'FunctionDeclaration' || componentNode.type === 'ArrowFunctionExpression') {
        options.codeStyle = 'default';
      }
      let code = codeBuilder.buildPropTypes(propTypes, options);
      return editor.edit(editBuilder => {
        if (propTypesNode) {
          // replace old object
          let range = rangeUtils.getVsCodeRangeByLoc(propTypesNode.loc);
          editBuilder.replace(range, code);
        } else {
          // add new object
          let insertPosition;
          if (options.codeStyle === 'class') {
            insertPosition = new vscode.Position(componentNode.loc.start.line, 0);
            editBuilder.insert(insertPosition, '  ' + code + '\n');
          } else {
            insertPosition = new vscode.Position(componentNode.loc.end.line, 0);
            editBuilder.insert(insertPosition, '\n' + code + '\n');
          }
        }
      }).then((result) => {
        if (result) {
          return {
            componentNode,
            propTypesNode,
            defaultPropsNode
          };
        } else {
          throw new Error('Refactor Code Error !');
        }
      });
    });
  }).then((lastResult) => {
    if (options.codeStyle !== 'disable') {
      let { importNode, requireNode } = actions.findImportOrRequireModuleNode(ast);
      let firstBody = ast.body[0];
      let importCode = codeBuilder.buildImportCode(options);
      if (!importNode && !requireNode && firstBody && importCode) {
        if (options.autoImport && options.autoImport !== 'disabled') {
          return editor.edit(editBuilder => {
            let insertPosition = new vscode.Position(firstBody.loc.start.line - 1, 0);
            editBuilder.insert(insertPosition, importCode + '\n');
          }).then(() => {
            return lastResult;
          });
        }
      }
    }
    return lastResult;
  }).then(({ propTypesNode, componentNode }) => {
    return codeBuilder.getEditRanges(document.getText(), options).then(({ ranges, node }) => {
      if (node && ranges.length > 0) {
        if (setting.getConfig('afterFormat')) {
          let nodeRange = rangeUtils.getVsCodeRangeByLoc(node.loc);
          editor.selection = new vscode.Selection(nodeRange.start, nodeRange.end);
          return vscode.commands.executeCommand('editor.action.formatSelection')
        } else {
          return true;
        }
      } else {
        throw new Error('Can\'t find node!')
      }
    });
  }).then(() => {
    return codeBuilder.getEditRanges(document.getText(), options).then(({ ranges, node }) => {
      let nodeRange = node.range;
      let code = document.getText().slice(nodeRange[0], nodeRange[1]);
      let newRanges = ranges.map(item => {
        return [
          item[0] - nodeRange[0],
          item[1] - nodeRange[0]
        ];
      });
      return vscodeHelper.startComplementPropTypes(newRanges, node, code);
    });
  }).catch(error => {
    vscode.window.showErrorMessage(error.toString());
  });

}

exports.generate = generate;
