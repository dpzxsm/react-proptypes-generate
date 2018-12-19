const propTypes = require('./propTypes');
const autoImport = require('./autoImport');

module.exports = {
  findPropTypes: propTypes.findPropTypes,
  findPropTypesNode: propTypes.findPropTypesNode,
  findClassNode: propTypes.findClassNode,
  findImportOrRequireModuleNode: autoImport.findImportOrRequireModuleNode
};
