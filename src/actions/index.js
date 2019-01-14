const propTypes = require('./propTypes');
const autoImport = require('./autoImport');

module.exports = {
  findPropTypes: propTypes.findPropTypes,
  findPropTypesNode: propTypes.findPropTypesNode,
  findComponentNode: propTypes.findComponentNode,
  findImportOrRequireModuleNode: autoImport.findImportOrRequireModuleNode
};
