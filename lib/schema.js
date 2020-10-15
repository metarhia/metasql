'use strict';

const vm = require('vm');
const { toLowerCamel, isUpperCamel } = require('./utils.js');

const SCRIPT_OPTIONS = { timeout: 5000 };

const FIELD_DEF = { required: true };
const ES_TYPES = ['number', 'string', 'boolean'];

const DIR_SCOPE = ['global', 'system', 'local', 'memory'];

const DIR_TABLE = ['dictionary', 'registry', 'entity', 'details', 'relation'];
const DIR_DATA = ['form', 'view', 'projection'];
const DIR_SYSTEM = [...DIR_TABLE, ...DIR_DATA];
const DIR_AUX = ['log', 'struct'];
const DIR_KIND = [...DIR_SYSTEM, ...DIR_AUX];

class Schema {
  constructor(name, raw) {
    this.name = name;
    this.scope = 'system';
    this.kind = 'entity';
    this.fields = new Map();
    this.indexes = new Map();
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
      let value = raw[key];
      const short = typeof value === 'string';
      if (first && isUpperCamel(key)) {
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
        this.scope = value.scope;
        this.kind = value.kind;
        continue;
      }
      first = false;
      const fieldDef = short ? { type: value } : value;
      const def = { name: key };
      if (fieldDef.type) Object.assign(def, FIELD_DEF);
      Object.assign(def, fieldDef);
      if (def.length) {
        if (typeof def.length === 'number') {
          def.length = { max: def.length };
        } else if (Array.isArray(def.length)) {
          const [min, max] = def.length;
          def.length = { min, max };
        }
      }
      if (def.type) this.fields.set(key, def);
      else this.indexes.set(key, def);
    }
  }
}

const createSchema = (name, src) => {
  try {
    const script = new vm.Script(src, { filename: name });
    const entity = script.runInThisContext(SCRIPT_OPTIONS);
    return entity;
  } catch {
    return null;
  }
};

const toInterface = (name, schema) => {
  const types = [];
  types.push(`interface ${name} {`);
  const pk = toLowerCamel(name) + 'Id';
  types.push(`  ${pk}: number;`);
  for (const def of schema.fields.values()) {
    if (def.type) {
      const q = def.required ? '' : '?';
      const isEntity = isUpperCamel(def.type);
      const isType = ES_TYPES.includes(def.type);
      const field = def.name + (isEntity ? 'Id' : '');
      let { type } = def;
      if (isEntity) type = 'number';
      else if (!isType) type = 'string';
      types.push(`  ${field}${q}: ${type};`);
    }
  }
  types.push('}');
  return types.join('\n');
};

const preprocessEntity = (model, name) => {
  const entity = model.entities.get(name);
  for (const [name, def] of entity.fields) {
    const kind = isUpperCamel(def.type) ? 'entity' : 'type';
    const notFound = kind === 'entity'
      ? !model.entities.has(def.type)
      : !model.types[def.type];
    if (notFound) {
      console.error(`  Error: ${kind} is not found ${def.type} in ${name}`);
      entity.fields.delete(name);
      continue;
    }
  }
};

const reorderEntity = (model, name, base = name) => {
  const entity = model.entities.get(name);
  for (const { type } of entity.fields.values()) {
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

const preprocessModel = model => {
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

const validateModel = model => {
  console.log('Validating metaschema');
  for (const name of model.order) {
    const { fields } = model.entities.get(name);
    if (fields.size) console.log(`  ${name}: ${fields.size} fields`);
  }
};

class DomainModel {
  constructor(entities) {
    this.entities = entities;
    this.database = entities.get('.database');
    entities.delete('.database');
    this.types = entities.get('.types');
    entities.delete('.types');
    this.order = new Set();
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
  implementations: {},
};
