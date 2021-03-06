'use strict';

const path = require('path');
const fs = require('fs').promises;

const metavm = require('metavm');
const { Schema } = require('metaschema');

const { toLowerCamel, isUpperCamel } = require('./utils.js');

const ES_TYPES = ['number', 'string', 'boolean'];

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

const readDirectory = async (dirPath) => {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  const structs = new Map();
  for (const file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith('.js')) continue;
    const absPath = path.join(dirPath, file.name);
    const { name, exports } = await metavm.readScript(absPath);
    structs.set(name, exports);
  }
  return structs;
};

module.exports = {
  DomainModel,
  createSchema,
  toInterface,
  preprocessModel,
  validateModel,
  readDirectory,
};
