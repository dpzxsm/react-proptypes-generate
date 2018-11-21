# react-proptypes-generate
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

### Command Line
1. `rpg-cli -h` show Help
2. `rpg-cli <filePath> <componentName>` to generate PropTypes


## Extension Settings

This extension contributes the following settings:

* `propTypes.autoImport`: set auto import or require PropTypes module
* `propTypes.codeStyle`: set the PropTypes Generate Style


## Release Notes

### V1.0
1. Support VS Code and Command Line
2. Support Auto Generate Code
