try {
  require('vscode')
  require('vscode/bin/install')
}catch(e){
  console.log("It is command line environment, no need to install vscode")
}
