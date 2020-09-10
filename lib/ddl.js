'use strict';

const path = require('path');
const vm = require('vm');
const fs = require('fs').promises;

const SCRIPT_OPTIONS = { timeout: 5000 };

class Schema {
  constructor(schemaPath) {
    this.path = schemaPath;
    this.entity = null;
    return this.load();
  }

  async load() {
    try {
      const src = await fs.readFile(this.path, 'utf8');
      if (!src) return null;
      const script = new vm.Script(src, { filename: this.path });
      return script.runInThisContext(SCRIPT_OPTIONS);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.error(err.stack);
      }
    }
    return this;
  }
}

class DatabaseSchema {
  constructor(schemaPath) {
    this.path = schemaPath;
    this.entities = new Map();
    return this.load();
  }

  async load() {
    const files = await fs.readdir(this.path, { withFileTypes: true });
    for (const file of files) {
      if (file.isDirectory()) continue;
      if (!file.name.endsWith('.js')) continue;
      const absPath = path.join(this.path, file.name);
      const schema = await new Schema(absPath);
      if (!schema) continue;
      const schemaName = path.basename(file.name, '.js');
      this.entities.set(schemaName, schema);
    }
    return this;
  }

  async validate() {
    console.log('Validationg metaschema:');
    for (const [name, entity] of this.entities) {
      const fields = Object.keys(entity);
      if (entity) console.log(`  ${name}: ${fields.length} fields`);
    }
  }

  async generate(outputPath) {
    console.log('Generating SQL DDL script ' + outputPath);
    const script = [];
    for (const [name, entity] of this.entities) {
      const sql = await this.generateEntity(name, entity);
      script.push(sql);
    }
    const dbPath = path.join(outputPath, 'database.sql');
    await fs.writeFile(dbPath, script.join('\n\n') + '\n');
  }

  async generateEntity(name, entity) {
    const args = `${name}, ${JSON.stringify(entity)}`;
    throw new Error(`Method is not implemented: generateEntity(${args})`);
  }
}

const toLowerCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
const isUpperCamel = s => s[0] === s[0].toUpperCase();

const DB_RELATION = 1;
const DB_FIELD = 2;

const FIELD_DEF = {
  required: true
};

const PG_TYPES = {
  string: 'varchar',
  number: 'integer',
  boolean: 'boolean',
  double: 'double precision',
  datetime: 'timestamp',
  json: 'jsonb',
  money: 'numeric(12, 2)',
  uuid: 'uuid',
};

class PgSchema extends DatabaseSchema {
  async generateEntity(name, entity) {
    const sql = [];
    sql.push(`CREATE TABLE "${name}" (`);
    const pk = toLowerCamel(name) + 'Id';
    sql.push(`  "${pk}" bigint unsigned generated always as identity,`);
    const fields = Object.keys(entity);
    for (const fieldName of fields) {
      const field = entity[fieldName];
      const short = typeof field === 'string';
      const fieldDef = short ? { type: field } : field;
      const def = { name: fieldName, ...FIELD_DEF, ...fieldDef };
      const nullable = def.required ? ' NOT NULL' : '';
      const kind = isUpperCamel(def.type) ? DB_RELATION : DB_FIELD;
      const pgType = kind === DB_FIELD ? PG_TYPES[def.type] : 'bigint';
      if (!pgType) throw new Error(`Unknown type: ${def.type}`);
      const pgField = def.name + (kind === DB_FIELD ? '' : 'Id');
      sql.push(`  "${pgField}" ${pgType}${nullable},`);
    }
    sql[sql.length - 1] = sql[sql.length - 1].slice(0, -1);
    sql.push(');');
    return sql.join('\n');
  }
}

const generate = async (schemaPath, outputPath) => {
  const schema = await new PgSchema(schemaPath);
  await schema.validate();
  await schema.generate(outputPath);
};

module.exports = {
  generate,
};
