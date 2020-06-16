#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const Promise = require("bluebird");
const { program } = require('commander')
const astHelper = require("../src/astHelper");
const actions = require("../src/actions");
const codeBuilder = require("../src/utils/codeBuilder");
const manifest = require("../package.json");

const styles = {
  'black': '\x1B[30m%s\x1B[39m', 'blue': '\x1B[34m%s\x1B[39m', 'green': '\x1B[32m%s\x1B[39m',
  'red': '\x1B[31m%s\x1B[39m', 'yellow': '\x1B[33m%s\x1B[39m'
}

program.version(manifest.version)
  .arguments('<filePath> <componentName>')
  .action(function(filePath, componentName){
    try {
      let normalizePath = path.normalize(filePath);
      fs.readFile(normalizePath, "utf-8", function (err, data) {
        if (!data) {
          console.error('can\'t resolve filePath: ' + normalizePath);
          return;
        }
        let ast = astHelper.flowAst(data);
        let params = {
          name: componentName
        };
        // merge config to options
        let options = Object.assign({}, readConfig(), params);
        Promise.all([
          actions.findComponentNode(ast, options),
          actions.findPropTypesNode(ast, options),
          actions.findPropTypesNode(ast, Object.assign({}, options, {
            alias: 'defaultProps'
          }))
        ], options).then((nodes) => {
          let componentNode = nodes[0];
          let propTypesNode = nodes[1];
          let defaultPropsNode = nodes[2];
          return actions.findPropTypes({
            componentNode,
            propTypesNode,
            defaultPropsNode
          }, options).then((propTypes) => {
            if (propTypes.length === 0) {
              throw new Error("Not find any props");
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
            if (propTypesNode) {
              return replaceCode(filePath, propTypesNode.range, code);
            } else {
              let insertPosition;
              if (options.codeStyle === 'class') {
                if (componentNode.body) {
                  insertPosition = componentNode.body.range[0] + 1;
                  return insertCode(filePath, insertPosition, "\n  " + code + "\n");
                }
              } else {
                insertPosition = componentNode.range[1];
                return insertCode(filePath, insertPosition, "\n\n" + code);
              }
            }
          });
        }).then(result => {
          if (options.autoImport !== 'disable') {
            let { importNode, requireNode } = actions.findImportOrRequireModuleNode(ast, options);
            let firstBody = ast.body[0];
            let importCode = codeBuilder.buildImportCode(options);
            if (!importNode && !requireNode && firstBody && importCode) {
              let insertPosition = firstBody.range[0];
              return insertCode(filePath, insertPosition, importCode + "\n");
            }
          }
          return result;
        }).then((result) => {
          if (result) {
            console.log('Generated Success!');
          }
        }).catch(error => {
          console.error(error);
        });
      });
    } catch (e) {
      console.error(e);
    }
  })

program.command('config')
  .arguments('<filePath>')
  .action(function(filePath){
    let configPath = path.normalize(filePath);
    try {
      let json = fs.readFileSync(configPath, "utf-8") || {};
      let config = Object.assign(readConfig(), JSON.parse(json));
      if (config && saveConfig(JSON.stringify(config, null, 2))) {
        console.log(styles.red, "Write Config Success");
      } else {
        console.log(styles.red, "JSON parse Fail !");
      }
    } catch (e) {
      console.error(e);
    }
  })

program.parse(process.argv)

function readConfig() {
  try {
    let json = fs.readFileSync(path.join(__dirname, "setting.json"), "utf-8");
    return JSON.parse(json);
  } catch (e) {
    return {};
  }
}

function saveConfig(json) {
  try {
    fs.writeFileSync(path.join(__dirname, "setting.json"), json, "utf-8");
    return true;
  } catch (e) {
    return false;
  }
}

function replaceCode(file, range, code) {
  return new Promise((resolve, reject) => {
    try {
      let document = fs.readFileSync(file, 'utf-8');
      let newDocument = document.slice(0, range[0]) + code + document.slice(range[1], document.length);
      fs.writeFileSync(file, newDocument, 'utf-8');
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}

function insertCode(file, position, code) {
  return new Promise((resolve, reject) => {
    try {
      let document = fs.readFileSync(file, 'utf-8');
      let newDocument = document.slice(0, position) + code + document.slice(position, document.length);
      fs.writeFileSync(file, newDocument, 'utf-8');
      resolve(true);
    } catch (e) {
      reject(e);
    }
  });
}
