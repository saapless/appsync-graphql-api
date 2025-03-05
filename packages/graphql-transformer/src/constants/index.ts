export const ConnectionDirective = Object.freeze({
  HAS_ONE: "hasOne",
  HAS_MANY: "hasMany",
});

export const ModelDirective = Object.freeze({
  MODEL: "model",
});

export const UtilityDirective = Object.freeze({
  SERVER_ONLY: "serverOnly",
  CLIENT_ONLY: "clientOnly",
  READ_ONLY: "readOnly",
  WRITE_ONLY: "writeOnly",
  FILTER_ONLY: "filterOnly",
  INTERNAL: "internal",
});

export const ScalarType = Object.freeze({
  STRING: "String",
  INT: "Int",
  FLOAT: "Float",
  BOOLEAN: "Boolean",
  ID: "ID",
  LONG: "Long",
});

export const RelationType = Object.freeze({
  ONE_TO_ONE: "oneToOne",
  ONE_TO_MANY: "oneToMany",
  MANY_TO_MANY: "manyToMany",
});
