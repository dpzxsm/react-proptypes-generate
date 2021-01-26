# Change Log
All notable changes to the "react-proptypes" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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

### [v1.6.0]
- Support TypeScript
- Support HOC Component
- Support Batch generation of PropTypes, Now, only supports Command Line
- Fix a bug when `arrayOf` type nest in `shape` type

### [v1.6.1]
- Add Setting for PropTypes's  isRequired, named `isRequired`

### [v1.6.2]
- Support for destructured `shape` type

### [v1.6.3]
- Add `semicolon` settings for code style;
- Command Line Support `rpg.config.json` for `project` command; 

### [v1.6.7]
- Add `lint-stage` Full Support

### [v1.7.0]
- Support keep PropTypes's comments
- Add `include` and `exclude` settings for `rpg.config.json`
- Fix a bug that can't merge old PropTypes

### [v1.7.1]
- Fix a bug that glob path match in the `command line`

### [v1.7.2]
- Fix `include` and `exclude` path match bug in the `lint-stage`

