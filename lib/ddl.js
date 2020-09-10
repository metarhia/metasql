'use strict';

const { DatabaseSchema } = require('./schema-db.js');

const toLowerCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
const toUpperCamel = s => s.charAt(0).toUpperCase() + s.slice(1);
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
  bigint: 'bigint',
  real: 'real',
  double: 'double precision',
  money: 'numeric(12, 2)',
  date: 'date',
  time: 'time',
  datetime: 'timestamp',
  uuid: 'uuid',
  url: 'varchar',
  inet: 'inet',
  text: 'text',
  json: 'jsonb',
  blob: 'bytea',
  point: 'point',
};

class PgSchema extends DatabaseSchema {
  async preprocessEntity(name, entity) {
    const fields = Object.keys(entity);
    for (const fieldName of fields) {
      const field = entity[fieldName];
      const short = typeof field === 'string';
      const fieldDef = short ? { type: field } : field;
      const def = { name: fieldName, ...FIELD_DEF, ...fieldDef };
      entity[fieldName] = def;
    }
  }

  async generateEntity(name, entity) {
    const sql = [];
    const idx = [];
    sql.push(`CREATE TABLE "${name}" (`);
    const pk = toLowerCamel(name) + 'Id';
    sql.push(`  "${pk}" bigint unsigned generated always as identity,`);
    const fields = Object.keys(entity);
    for (const fieldName of fields) {
      const def = entity[fieldName];
      const nullable = def.required ? ' NOT NULL' : '';
      if (def.type) {
        const kind = isUpperCamel(def.type) ? DB_RELATION : DB_FIELD;
        const pgType = kind === DB_FIELD ? PG_TYPES[def.type] : 'bigint';
        if (!pgType) throw new Error(`Unknown type: ${def.type}`);
        const pgField = def.name + (kind === DB_FIELD ? '' : 'Id');
        if (def.unique || def.index) {
          const unique = def.unique ? 'UNIQUE ' : '';
          const idxName = `"ak${name}${toUpperCamel(def.name)}"`;
          const idxOn = `"${name}" ("${def.name}"`;
          idx.push(`CREATE ${unique}INDEX ${idxName} ON ${idxOn});`);
        }
        sql.push(`  "${pgField}" ${pgType}${nullable},`);
      }
    }
    sql[sql.length - 1] = sql[sql.length - 1].slice(0, -1);
    sql.push(');');
    return sql.join('\n') + '\n\n' + idx.join('\n');
  }
}

const generate = async (schemaPath, outputPath) => {
  const schema = await new PgSchema(schemaPath);
  await schema.preprocess();
  await schema.validate();
  await schema.generate(outputPath);
};

module.exports = {
  generate,
};
