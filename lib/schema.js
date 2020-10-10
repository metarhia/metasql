'use strict';

const vm = require('vm');
const { toLowerCamel, isUpperCamel } = require('./utils.js');

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

module.exports = { createSchema, toInterface };
