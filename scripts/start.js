const childProcess = require('child_process')
const path = require('path')
const os = require('os')
const rootPath = path.resolve(__dirname, '../')

function killVscode(callback) {
  if (os.type() === 'Windows_NT') {
    childProcess.exec('taskkill /f /im Code.exe', callback)
  } else {
    callback(null, null, null)
  }
}

killVscode(() => {
  childProcess.exec('code --extensionDevelopmentPath=' + rootPath, function (err, stdout, stderr) {
    if (err !== null) {
      console.log('Launch Vscode failed');
    }
  })
})

