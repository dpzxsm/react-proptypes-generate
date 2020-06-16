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
  let { school: schoolAlias = "schoolName", info = { name: 2 }, year = 33 , onClick } = props;
  return <div onClick={() => onClick()} />
}
//will generate 
Test.propTypes = {
  info: PropTypes.shape({
    name: PropTypes.number
  }),
  onClick: PropTypes.func,
  school: PropTypes.string,
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

* `propTypes.autoImport`: Auto import or require PropTypes module(disabled|commonJS|ES6)
* `propTypes.codeStyle`: PropTypes Generate Style(default|class)
* `propTypes.tabWidth`: Number of spaces the pretty-printer should use per tab for indentation (number)
* `propTypes.quote`: Override the quotes used in string literals(single|double|auto|null)
* `propTypes.trailingComma`: Controls the printing of trailing commas in object literals, array expressions and function parameters(boolean)
* `propTypes.afterFormat`: If true, after generate propTypes, trigger vscode's formatting for PropTypes(boolean)
* `propTypes.noMergeOld`: Defaults is merge old PropTypes, if true, will generate new PropTypes(boolean)
* `propTypes.noShape`: Defaults is generate shape type, if true, will generate object type(boolean)
* `propTypes.arrayLike`: If true, some shape type which is similar to Array will be set array type instead(boolean)

## Command Line Settings

Command Line can config the following settings:

* `autoImport`: Auto import or require PropTypes module(disabled|commonJS|ES6)
* `codeStyle`: PropTypes Generate Style(default|class)
* `tabWidth`: Number of spaces the pretty-printer should use per tab for indentation (number)
* `quote`: Override the quotes used in string literals(single|double|auto|null)
* `trailingComma`: Controls the printing of trailing commas in object literals, array expressions and function parameters(boolean)
* `noMergeOld`: Defaults is merge old PropTypes, if true, will generate new PropTypes(boolean)
* `noShape`: Defaults is generate shape type, if true, will generate object type(boolean)
* `arrayLike`: If true, some shape type which is similar to Array will be set array type instead(boolean)

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

### [v1.3.2]
- Auto Import is defaults to ES6
- Update the vscode dependencies

### [v1.4.0]
- Changed the Component'name select way. Use cursor highlighting to select Component's name. Now you can make select Component's name' easier !!!
- Add more Code Style to configurations.
- Add configurations to automatically trigger vscode's formatting.

### [v1.5.0]
- Refactor PropTypes Generate's code,  more stable search PropTypes.
- Full Support `shape` and `func` automatically PropTypes Generate🎉🎉🎉.

### [v1.5.2]
- Fix `shape` type Generated bug !!!

### [v1.5.3]
- Support `bool` and `number` type automatically PropTypes Generate🎉🎉🎉.
- Fix a bug that in rare cases, `shape` will cause `Max call stack exceeded`
- Support config disable `shape` type generated, instead of `object` type.
- Support config not merge old PropTypes.
- Support config automatically generated `array` type instead of `shape` type that similar to Array Type

### [v1.5.6]
- Fix `noMergeOld` settings that get inverse value
- Support `Null Propagation`
