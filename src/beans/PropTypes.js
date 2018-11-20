function PropTypes(name, type, isRequired) {
  this.name = name;
  this.type = type || 'any';
  this.isRequired = isRequired || false;
}

PropTypes.prototype.setDefaultValue = function (value) {
  this.defaultValue = value
};
PropTypes.prototype.setJsonData = function (value) {
  this.jsonData = value
};

module.exports = PropTypes;