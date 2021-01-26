#!/usr/bin/env node
const path = require("path");
const fs = require("fs");
const Promise = require("bluebird");
const glob = require("glob");
const minimatch = require("minimatch");
const { program } = require('commander');
const astHelper = require("../src/astHelper");
const actions = require("../src/actions");
const codeBuilder = require("../src/utils/codeBuilder");
const actionHelper = require("../src/utils/actionHelper");
const manifest = require("../package.json");

const styles = {
	'black': '\x1B[30m%s\x1B[39m', 'blue': '\x1B[34m%s\x1B[39m', 'green': '\x1B[32m%s\x1B[39m',
	'red': '\x1B[31m%s\x1B[39m', 'yellow': '\x1B[33m%s\x1B[39m'
};
// 基础命令，为指定文件生成
program.version(manifest.version)
	.arguments('<filePath> [componentName]')
	.action(function (filePath, componentName) {
		filePath = path.normalize(filePath || "");
		parseAndGenerate({
			filePath,
			componentName
		});
	});

// lint-stage 自动化生成
program.command('fix')
	.arguments('<files...>')
	.action(function (files) {
		const config = readConfig();
		for (let i = 0; i < files.length; i++) {
			let filePath = path.normalize(files[i] || "");
			parseAndGenerate({
				filePath,
				config
			});
		}
	});

// 全局配置
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
	});

// 项目批量生成
program.command('project')
	.arguments('[dirPath]')
	.action(function (dirPath) {
		dirPath = path.join(process.cwd(), dirPath || "");
		const config = readConfig();
		getProjectFiles({
			dirPath,
			config
		}).then(files => {
			for (let i = 0; i < files.length; i++) {
				parseAndGenerate({
					filePath: files[i],
					config
				});
			}
		});
	});

// 递归获取项目下的所有文件
function getProjectFiles(builder) {
	const { dirPath, config } = builder;
	let include = config.include || [];
	let exclude = config.exclude || [];
	const globPattern = include.length > 0 ?
		(include.length === 1 ? include[0] : `{${include.join(",")}}`)
		: '**/*.{js,jsx,ts,tsx}';
	return new Promise((resolve, reject) => {
		glob(globPattern, {
			cwd: dirPath,
			ignore: exclude,
			nodir: true
		}, (err, files) => {
			if (err) {
				console.error(err);
				reject(err);
			} else {
				resolve(files);
			}
		});
	});
}

// 生成PropTypes
function parseAndGenerate(builder) {
	const { filePath, componentName, config } = builder;
	let normalizePath = path.normalize(filePath);
	// glob匹配必须是相对路径
	normalizePath = path.relative(process.cwd(), normalizePath)
	if (config) {
		let include = config.include || [];
		let exclude = config.exclude || [];
		let includeMatch = include.length > 0 ? include.some(glob => minimatch(normalizePath, glob)) : true;
		let excludeMatch = include.length > 0 ? exclude.some(glob => minimatch(normalizePath, glob)) : false;
		if (!includeMatch || excludeMatch) {
			console.log(filePath + ' is be excluded !');
			return Promise.resolve(0);
		}
	}
	let names = [];
	if (componentName) {
		names.push(componentName);
	} else {
		let data = fs.readFileSync(normalizePath, "utf-8");
		if (data) {
			let ast = astHelper.flowAst(data);
			actions.findComponentNames(ast).forEach(item => {
				names.push(item.name);
			});
		}
	}
	return Promise.reduce(names, function (total, name) {
		return generatePropTypes({
			filePath: normalizePath,
			componentName: name,
		}).then(() => {
			console.log(filePath + ' ' + name + ' Generated Success!');
			return total + 1;
		}).catch(error => {
			console.log(styles.red, filePath + ' ' + name + ' ' + error.message)
			return total;
		});
	}, 0);
}

function generatePropTypes(builder) {
	const { filePath, componentName } = builder;
	let data = fs.readFileSync(filePath, "utf-8");
	if (!data) {
		return Promise.reject(new Error('can\'t resolve filePath: ' + filePath));
	}
	let ast = astHelper.flowAst(data);
	if (!ast) {
		return Promise.reject(new Error('Parse JS file error !'));
	}
	let options = Object.assign({}, readConfig(), { name: componentName });
	return actionHelper.generatePropTypesCode(ast, options)
		.then(({ code, propTypesNode, componentNode }) => {
			if (propTypesNode) {
				return replaceCode(filePath, propTypesNode.range, code);
			} else {
				if (options.codeStyle === 'class') {
					if (componentNode.body) {
						return insertCode(filePath, componentNode.body.range[0] + 1, "\n  " + code + "\n");
					}
				} else {
					let range = actions.findComponentParentRange(ast, componentName);
					if (range) {
						return insertCode(filePath, range[1], "\n\n" + code);
					}
				}
			}
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
		let userConfigPath = path.join(process.cwd(), 'rpg.config.json');
		let userConfig = fs.existsSync(userConfigPath) ?
			JSON.parse(fs.readFileSync(userConfigPath, "utf-8")) : {};
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

program.parse(process.argv);
