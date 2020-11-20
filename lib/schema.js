'use strict';

const metavm = require('metavm');
const { toLowerCamel, isUpperCamel } = require('./utils.js');

const ES_TYPES = ['number', 'string', 'boolean'];

const DIR_SCOPE = ['global', 'system', 'local', 'memory'];

const DIR_TABLE = ['dictionary', 'registry', 'entity', 'details', 'relation'];
const DIR_DATA = ['form', 'view', 'projection'];
const DIR_SYSTEM = [...DIR_TABLE, ...DIR_DATA];
const DIR_AUX = ['log', 'struct'];
const DIR_KIND = [...DIR_SYSTEM, ...DIR_AUX];

const parseDirective = (value) => {
  const short = typeof value === 'string';
  if (short) {
    const [kind, scope] = value.split(' ').reverse();
    value = { scope, kind };
  }
  if (!DIR_KIND.includes(value.kind)) {
    throw new Error(`Unknown kind directive: ${value.kind}`);
  }
  if (!value.scope) {
    if (value.kind === 'struct') value.scope = 'memory';
    else if (value.kind === 'log') value.scope = 'local';
    else value.scope = 'system';
  }
  if (!DIR_SCOPE.includes(value.scope)) {
    throw new Error(`Unknown scope directive: ${value.scope}`);
  }
  return value;
};

class Schema {
  constructor(name, raw) {
    this.name = name;
    this.scope = 'system';
    this.kind = 'entity';
    this.fields = {};
    this.indexes = {};
    this.validate = raw.validate || null;
    this.format = raw.format || null;
    this.parse = raw.parse || null;
    this.serialize = raw.serialize || null;
    this.preprocess(raw);
  }

  preprocess(raw) {
    const keys = Object.keys(raw);
    let first = true;
    for (const key of keys) {
      const value = raw[key];
      if (first && isUpperCamel(key)) {
        const { scope, kind } = parseDirective(value);
        this.scope = scope;
        this.kind = kind;
        continue;
      }
      first = false;
      const short = typeof value === 'string';
      const def = short ? { type: value } : value;
      if (!def.type) {
        this.indexes[key] = def;
        continue;
      }
      if (!Reflect.has(def, 'required')) def.required = true;
      if (def.length) {
        if (typeof def.length === 'number') {
          def.length = { max: def.length };
        } else if (Array.isArray(def.length)) {
          const [min, max] = def.length;
          def.length = { min, max };
        }
      }
      this.fields[key] = def;
    }
  }
}

const createSchema = (name, src) => {
  const { exports } = new metavm.MetaScript(name, src);
  const entity = new Schema(name, exports);
  return entity;
};

const toInterface = (name, schema) => {
  const types = [];
  types.push(`interface ${name} {`);
  const pk = toLowerCamel(name) + 'Id';
  types.push(`  ${pk}: number;`);
  const fields = Object.keys(schema.fields);
  for (const field of fields) {
    const def = schema.fields[field];
    if (def.type) {
      const q = def.required ? '' : '?';
      const isEntity = isUpperCamel(def.type);
      const isType = ES_TYPES.includes(def.type);
      const fieldName = field + (isEntity ? 'Id' : '');
      let { type } = def;
      if (isEntity) type = 'number';
      else if (!isType) type = 'string';
      types.push(`  ${fieldName}${q}: ${type};`);
    }
  }
  types.push('}');
  return types.join('\n');
};

const preprocessEntity = (model, name) => {
  const entity = model.entities.get(name);
  const fields = Object.keys(entity.fields);
  for (const field of fields) {
    const def = entity.fields[field];
    const kind = isUpperCamel(def.type) ? 'entity' : 'type';
    const notFound =
      kind === 'entity'
        ? !model.entities.has(def.type)
        : !model.types[def.type];
    if (notFound) {
      console.error(`  Error: ${kind} is not found ${def.type} in ${field}`);
      delete entity.fields[field];
      continue;
    }
  }
  return fields;
};

const reorderEntity = (model, name, base = name) => {
  const entity = model.entities.get(name);
  const fields = Object.keys(entity.fields);
  for (const field of fields) {
    const { type } = entity.fields[field];
    if (type === base) {
      console.log(`Recursive dependency: ${name}.${base}`);
      continue;
    }
    if (isUpperCamel(type) && !model.order.has(type)) {
      reorderEntity(model, type, base);
    }
  }
  model.order.add(name);
};

const preprocessModel = (model) => {
  for (const name of model.entities.keys()) {
    if (!name.startsWith('.')) {
      preprocessEntity(model, name);
    }
  }
  for (const name of model.entities.keys()) {
    if (!name.startsWith('.') && !model.order.has(name)) {
      reorderEntity(model, name);
    }
  }
};

const validateModel = (model) => {
  console.log('Validating metaschema');
  for (const name of model.order) {
    const { fields } = model.entities.get(name);
    const keys = Object.keys(fields);
    if (keys.length) console.log(`  ${name}: ${keys.length} fields`);
  }
};

class DomainModel {
  constructor(database, types, structs) {
    this.database = database;
    this.types = types;
    this.entities = new Map();
    this.order = new Set();
    for (const [name, struct] of structs) {
      const entity = new Schema(name, struct);
      this.entities.set(name, entity);
    }
    preprocessModel(this);
  }
}

module.exports = {
  Schema,
  DomainModel,
  createSchema,
  toInterface,
  preprocessModel,
  validateModel,
};
