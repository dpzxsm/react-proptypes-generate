function PropTypes(name, type, isRequired, childTypes) {
  this.name = name;
  if (type) {
    this._type = type;
  }
  if (isRequired) {
    this._isRequired = isRequired
  }
  if (childTypes) {
    this._childTypes = childTypes;
  }
}

PropTypes.prototype = {
  get type() {
    return this._type || 'any'
  },
  set type(value) {
    this._type = value
  },
  get isRequired() {
    return this._isRequired || false;
  },
  set isRequired(value) {
    this._isRequired = value
  },
  get childTypes() {
    return this._childTypes || [];
  },
  set childTypes(value) {
    this._childTypes = value
  },
};

PropTypes.prototype.setDefaultValue = function (value) {
  this.defaultValue = value
};

PropTypes.prototype.setJsonData = function (value) {
  this.jsonData = value
};

PropTypes.prototype.setId = function (value) {
  this.id = value
};

module.exports = PropTypes;
