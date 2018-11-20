#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const Promise = require("bluebird");
const astHelper = require("../src/astHelper");
const actions = require("../src/actions");
const codeBuilder = require("../src/utils/codeBuilder");

function run(argv) {
  if (argv[0] === '-v' || argv[0] === '--version') {
    return "1.0.0";
  } else if (argv[0] === '-h' || argv[0] === '--help') {
    console.log("\n   Usage: rpg-cli [filePath] [componentName]\n\n" +
      "   Options:\n" +
      "     -h, --help    output usage information\n" +
      "     -v, --version    output the version number\n");
  } else {
    if (argv[0] && argv[1]) {
      try {
        let filePath = path.normalize(argv[0]);
        let name = argv[1];
        fs.readFile(filePath, "utf-8", function (err, data) {
          if (!data) {
            console.error('can\'t resolve filePath: ' + filePath);
            return
          }
          let ast = astHelper.flowAst(data);
          let options = {
            name,
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
              let code = codeBuilder.buildPropTypes(propTypes, options);
              if (propTypesNode) {
                return replaceCode(filePath, propTypesNode.range, code);
              } else {
                return insertCode(filePath, classNode.range, "\n\n" + code + "\n");
              }
            });
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

function replaceCode(file, range, code) {
  return new Promise((resolve, reject) => {
    try {
      let document = fs.readFileSync(file, 'utf-8');
      let newDocument = document.slice(0, range[0]) + code + document.slice(range[1], document.length);
      fs.writeFileSync(file, newDocument, 'utf-8');
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function insertCode(file, range, code) {
  return new Promise((resolve, reject) => {
    try {
      let document = fs.readFileSync(file, 'utf-8');
      let newDocument = document.slice(0, range[1]) + code + document.slice(range[1], document.length);
      fs.writeFileSync(file, newDocument, 'utf-8');
      resolve();
    } catch (e) {
      reject(e);
    }
  });
}

run(process.argv.slice(2));