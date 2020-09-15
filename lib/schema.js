'use strict';

const vm = require('vm');
const path = require('path');
const fs = require('fs').promises;
const { toLowerCamel, isUpperCamel } = require('./utils.js');

const SCRIPT_OPTIONS = { timeout: 5000 };

const ES_TYPES = ['number', 'string', 'boolean'];

class Schema {
  constructor(schemaPath) {
    this.path = schemaPath;
    this.name = path.basename(schemaPath, '.js');
    this.entity = null;
    return this.load();
  }

  async load() {
    try {
      const src = await fs.readFile(this.path, 'utf8');
      if (!src) return null;
      const script = new vm.Script(src, { filename: this.path });
      this.entity = script.runInThisContext(SCRIPT_OPTIONS);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(err.stack);
      }
      return null;
    }
    return this;
  }

  toInterface() {
    const { name, entity } = this;
    const types = [];
    types.push(`interface ${name} {`);
    const pk = toLowerCamel(name) + 'Id';
    types.push(`  ${pk}: number;`);
    const fields = Object.keys(entity);
    for (const fieldName of fields) {
      const def = entity[fieldName];
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
  }
}

module.exports = { Schema };
