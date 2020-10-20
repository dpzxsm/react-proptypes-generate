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
  .arguments('<filePath> [componentName]')
  .action(function (filePath, componentName) {
    filePath = path.normalize( filePath || "")
    parseAndGenerate({
      filePath,
      componentName
    })
  })

program.command('config')
  .arguments('<filePath>')
  .action(function (filePath) {
    filePath = path.normalize(filePath || "");
    try {
      let json = fs.readFileSync(filePath, "utf-8") || {};
      let config = Object.assign(readConfig(), JSON.parse(json));
      if (config && saveConfig(JSON.stringify(config, null, 2))) {
        console.log(styles.red, "Write Config Success");
      } else {
        console.log(styles.red, "JSON parse Fail !");
      }
    } catch (e) {
      console.error(e.toString());
    }
  })

program.command('project')
  .arguments('[dirPath]')
  .option('-c --config <type>', 'config json path')
  .action(function (dirPath) {
    dirPath = path.join(dirPath || "");
    let files = getProjectJavascriptFiles(dirPath);
    for (let i = 0; i < files.length; i++) {
      parseAndGenerate({
        filePath: files[i]
      })
    }
  })

program.parse(process.argv)

function getProjectJavascriptFiles(filePath) {
  const files = []
  const fileStat = fs.statSync(filePath)
  if (fileStat.isDirectory()) {
    const dirFiles = fs.readdirSync(filePath)
    for (let i = 0; i < dirFiles.length; i++) {
      files.push(...getProjectJavascriptFiles(path.join(filePath, dirFiles[i])))
    }
  } else {
    if (filePath.match(/\.(js|jsx|ts|tsx)$/)) {
      files.push(filePath)
    }
  }
  return files;
}

function parseAndGenerate(builder) {
  const {filePath, componentName} = builder;
  let normalizePath = path.normalize(filePath);
  let names = [];
  if (componentName) {
    names.push(componentName)
  } else {
    let data = fs.readFileSync(normalizePath, "utf-8");
    if (data) {
      let ast = astHelper.flowAst(data);
      actions.findComponentNames(ast).forEach(item => {
        names.push(item.name);
      })
    }
  }
  return Promise.reduce(names, function (total, name) {
    return generatePropTypes({
      filePath: normalizePath,
      componentName: name,
    }).then(() => {
      console.log(filePath + ' ' + name + ' Generated Success!');
      return total + 1
    }).catch(error => {
      console.error(error)
      return total
    })
  }, 0)
}

function generatePropTypes(builder) {
  const {filePath, componentName} = builder;
  let data = fs.readFileSync(filePath, "utf-8");
  if (!data) {
    return Promise.reject(new Error('can\'t resolve filePath: ' + filePath));
  }
  let ast = astHelper.flowAst(data);
  let params = {
    name: componentName
  };
  // merge config to options
  let options = Object.assign({}, readConfig(), params);
  return Promise.all([
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
        if (propTypesNode.type === 'ExpressionStatement') {
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
        if (options.codeStyle === 'class') {
          if (componentNode.body) {
            return insertCode(filePath, componentNode.body.range[0] + 1, "\n  " + code + "\n");
          }
        } else {
          let range = actions.findComponentParentRange(ast, componentName)
          if (range) {
            return insertCode(filePath, range[1], "\n\n" + code);
          }
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
  })
}

function readConfig() {
  try {
    let defaultConfig = JSON.parse(fs.readFileSync(path.join(__dirname, "setting.json"), "utf-8"));
    let userConfigPath = path.join(process.cwd(), 'rpg.config.json')
    let userConfig = fs.existsSync(userConfigPath) ?
      JSON.parse(fs.readFileSync(userConfigPath, "utf-8")) :{};
    return Object.assign(defaultConfig, userConfig);
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
