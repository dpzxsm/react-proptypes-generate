#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const Promise = require("bluebird");
const astHelper = require("../src/astHelper");
const actions = require("../src/actions");
const codeBuilder = require("../src/utils/codeBuilder");
const manifest = require("../package.json");

function run(argv) {
  if (argv[0] === '-v' || argv[0] === '--version') {
    console.log("v" + manifest.version);
  } else if (argv[0] === '-h' || argv[0] === '--help') {
    console.log("\n   Usage: rpg-cli [filePath] [componentName]\n\n" +
      "   Options:\n" +
      "     -h, --help    output usage information\n" +
      "     -v, --version    output the version number\n" +
      "     -c, --config    config the Code Style, more info you can look at https://github.com/dpzxsm/react-proptypes-generate\n");
  } else if ((argv[0] === '-c' || argv[0] === '--config')) {
    if (argv[1]) {
      let configPath = path.normalize(argv[1]);
      try {
        let json = fs.readFileSync(configPath, "utf-8");
        let config = JSON.parse(json);
        if (config && saveConfig(JSON.stringify(config, null, 2))) {
          console.log("Write Config Success");
        } else {
          console.log("JSON parse Fail !");
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      console.error('Please input a json file path');
    }
  } else {
    if (argv[0] && argv[1]) {
      try {
        let filePath = path.normalize(argv[0]);
        let name = argv[1];
        fs.readFile(filePath, "utf-8", function (err, data) {
          if (!data) {
            console.error('can\'t resolve filePath: ' + filePath);
            return;
          }
          let ast = astHelper.flowAst(data);
          let options = {
            name,
          };
          // merge config to options
          Object.assign(options, readConfig());
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
              if (propTypesNode) {
                if (propTypesNode.type === 'AssignmentExpression') {
                  // override old code style
                  options.codeStyle = 'default';
                } else if (propTypesNode.type === 'ClassProperty') {
                  options.codeStyle = 'class';
                }
              }
              let code = codeBuilder.buildPropTypes(propTypes, options);
              if (propTypesNode) {
                return replaceCode(filePath, propTypesNode.range, code);
              } else {
                let insertPosition;
                if (options.codeStyle === 'class') {
                  if (classNode.body) {
                    insertPosition = classNode.body.range[0] + 1;
                    return insertCode(filePath, insertPosition, "\n  " + code + "\n");
                  }
                } else {
                  insertPosition = classNode.range[1];
                  return insertCode(filePath, insertPosition, "\n\n" + code + "\n");
                }
              }
            });
          }).then(result => {
            if (options.autoImport !== 'disable') {
              let { importNode, requireNode } = actions.findImportOrRequireModuleNode(ast);
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
    } else {
      console.log("Please input a file path and component's Name");
    }

  }
}

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


run(process.argv.slice(2));