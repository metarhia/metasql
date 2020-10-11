'use strict';

const vm = require('vm');
const { toLowerCamel, isUpperCamel, shorten } = require('./utils.js');

const SCRIPT_OPTIONS = { timeout: 5000 };

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

const preprocessModel = model => {
  console.log(`Preprocess metaschema: ${shorten(model.path)}`);
  for (const name of model.entities.keys()) {
    if (!name.startsWith('.')) {
      model.preprocessEntity(name);
    }
  }
  for (const name of model.entities.keys()) {
    if (!name.startsWith('.') && !model.order.has(name)) {
      model.reorderEntity(name);
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

module.exports = { createSchema, toInterface, preprocessModel, validateModel };
