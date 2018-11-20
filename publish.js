let envKeys = Object.keys(process.env);
if (envKeys.some(item => item.indexOf("VSCODE") >= 0)) {
  console.log('suming-log', 'prepare install');
  require('vscode/bin/install');
}