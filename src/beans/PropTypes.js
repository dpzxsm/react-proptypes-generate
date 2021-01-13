function PropTypes(name, type, isRequired, childTypes, comment) {
  if (name) {
    this._name = name;
  }
  if (type) {
    this._type = type;
  }
  if (isRequired) {
    this._isRequired = isRequired;
  }
  if (childTypes) {
    this._childTypes = childTypes;
  }
  if (comment){
    this._comment = comment;
  }
}

PropTypes.prototype = {
  get name() {
    return this._name
  },
  set name(value) {
    this._name = value;
  },
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
  get comment(){
    return this._comment
  },
  set comment(value) {
    this._comment = value
  }
};

module.exports = PropTypes;
