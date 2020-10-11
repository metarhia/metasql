'use strict';

const vm = require('vm');
const { toLowerCamel, isUpperCamel } = require('./utils.js');

const SCRIPT_OPTIONS = { timeout: 5000 };

const FIELD_DEF = { required: true };
const ES_TYPES = ['number', 'string', 'boolean'];

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
  const fields = Object.keys(schema);
  for (const fieldName of fields) {
    const def = schema[fieldName];
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
  const fields = Object.keys(entity);
  for (const fieldName of fields) {
    const field = entity[fieldName];
    const short = typeof field === 'string';
    const fieldDef = short ? { type: field } : field;
    const def = { name: fieldName, ...FIELD_DEF, ...fieldDef };
    if (def.type) {
      const kind = isUpperCamel(def.type) ? 'entity' : 'type';
      const notFound = kind === 'entity'
        ? !model.entities.has(def.type)
        : !model.types[def.type];
      if (notFound) {
        console.error(`  Error: ${kind} is not found ${def.type} at ${name}`);
        delete entity[fieldName];
        continue;
      }
    }
    entity[fieldName] = def;
  }
};

const reorderEntity = (model, name, base = name) => {
  const entity = model.entities.get(name);
  const fields = Object.keys(entity);
  for (const field of fields) {
    const { type } = entity[field];
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
    const entity = model.entities.get(name);
    const fields = Object.keys(entity);
    if (entity) console.log(`  ${name}: ${fields.length} fields`);
  }
};

class DomainModel {
  constructor(entities) {
    this.entities = entities;
    this.database = entities.get('.database');
    this.types = entities.get('.types');
    this.order = new Set();
    preprocessModel(this);
  }
}

module.exports = {
  createSchema,
  toInterface,
  preprocessModel,
  validateModel,
  DomainModel,
  implementations: {},
};
