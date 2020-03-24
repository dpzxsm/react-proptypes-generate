# react-proptypes-generate [![npm version](https://badge.fury.io/js/react-proptypes-generate.svg)](https://badge.fury.io/js/react-proptypes-generate)
  This is the VS Code's extension that automatically generates PropTypes code for React components, like [ReactPropTypes](https://github.com/dpzxsm/ReactPropTypes-Plugin) in the Jetbrains's Platform


## Installation
### VS Code
  Search react-proptypes-generate in Marketplace and install it

### Command Line
```
npm install react-proptypes-generate -g
```

## Usage
### VS Code
1. Select your Component's name
2. Press <kbd>command</kbd> + <kbd>.</kbd> (Windows is <kbd>Ctrl</kbd> + <kbd>.</kbd>) show Code Actions and select PropTypesGenerate, or press <kbd>shift</kbd> + <kbd>command</kbd> + <kbd>alt</kbd> + <kbd>P</kbd> (Windows is <kbd>shift</kbd> + <kbd>ctrl</kbd> + <kbd>alt</kbd> + <kbd>P</kbd>) in the macOS
3. Input propType to replace default type

![img](./ScreenShot.gif)

### Command Line
1. `rpg-cli -h` show Help
2. `rpg-cli <JsFilePath> <ComponentName>` to generate PropTypes
3. `rpg-cli -c <JsonFilePath>` to config Command Line Settings


## Extension Settings

This extension contributes the following settings:

* `propTypes.autoImport`: set auto import or require PropTypes module(disabled|commonJS|ES6)
* `propTypes.codeStyle`: set the PropTypes Generate Style(default|class)

## Command Line Settings

Command Line can config the following settings:

* `autoImport`: set auto import or require PropTypes module(disabled|commonJS|ES6)
* `codeStyle`: set the PropTypes Generate Style(default|class)

## Release Notes

### [v1.0]
- Support VS Code and Command Line
- Support Auto Generate Code

### [v1.1]
- Support Config Code Style
- Support Config Auto Import
- Fixed a bug about Windows OS CRLF

### [v1.2]
- Support Pure Function Component
- Support ObjectPattern in the Pure Function Component
- Fixed a bug that have are multiple component in a file

### [v1.3]
- Support Pure ArrowFunction Component

### [v1.3.1]
- Auto Import is defaults to ES6
- Update the vscode dependencies

### [v1.3.2]
- Auto Import is defaults to ES6
- Update the vscode dependencies

### [v1.4.0]
- Changed the Component'name select way. Use cursor highlighting to select Component's name. Now you can make select Component's name' easier !!!
- Add more Code Style to configurations.
- Add configurations to automatically trigger vscode's formatting.
