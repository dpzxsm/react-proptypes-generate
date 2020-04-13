# react-proptypes-generate [![npm version](https://badge.fury.io/js/react-proptypes-generate.svg)](https://badge.fury.io/js/react-proptypes-generate)
  This is the VS Code's extension that automatically generates PropTypes code for React components, like [ReactPropTypes](https://github.com/dpzxsm/ReactPropTypes-Plugin) in the Jetbrains's Platform


## Installation
### VS Code
  Search react-proptypes-generate in Marketplace and install it.

### Command Line
If you want to use it directly on the command line, you can install cli by npm install.
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


## Examples case
```jsx harmony
import React from 'react'
function Test(props) {
  let { school: schoolAlias = "schoolName", info = { name: 2 }, year = 33, students = [] , onClick } = props;
  return <div onClick={() => onClick()} />
}
//will generate 
Test.propTypes = {
  info: PropTypes.shape({
    name: PropTypes.number
  }),
  onClick: PropTypes.func,
  school: PropTypes.string,
  students: PropTypes.array,
  year: PropTypes.number
} 
```

## Special case
To prevent the `array` type may be prejudged to `shape` type, you should set a default value.
```jsx harmony
import React from 'react'
function Test(props) {
  let { students = [] } = props;
  let length = students.length;
  return <div/>
}
//will generate 
Test.propTypes = {
  students: PropTypes.array
} 
```

## Extension Settings

This extension contributes the following settings:

* `propTypes.autoImport`: set auto import or require PropTypes module(disabled|commonJS|ES6)
* `propTypes.codeStyle`: set the PropTypes Generate Style(default|class)
* `propTypes.tabWidth`: set the PropTypes Indentation (number)
* `propTypes.quote`: set the PropTypes Quotes(single|double|auto|null)
* `propTypes.trailingComma`: set the PropTypes Trailing Commas(boolean)

## Command Line Settings

Command Line can config the following settings:

* `autoImport`: set auto import or require PropTypes module(disabled|commonJS|ES6)
* `codeStyle`: set the PropTypes Generate Style(default|class)
* `tabWidth`: set the PropTypes Indentation (number)
* `quote`: set the PropTypes Quotes(single|double|auto|null)
* `trailingComma`: set the PropTypes Trailing Commas(boolean)

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

### [v1.5.0]
- Refactor PropTypes Generate's code,  more stable search PropTypes.
- Full Support `shape` and `func` PropTypes Generate🎉🎉🎉.
