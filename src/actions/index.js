const propTypes = require('./propTypes');
const autoImport = require('./autoImport');
const component = require('./component');

module.exports = {
  findPropTypes: propTypes.findPropTypes,
  findPropTypesNode: propTypes.findPropTypesNode,
  findImportOrRequireModuleNode: autoImport.findImportOrRequireModuleNode,
  findComponentNode: component.findComponentNode,
  findComponentNames: component.findComponentNames,
  findComponentParentRange: component.findComponentParentRange,
};
