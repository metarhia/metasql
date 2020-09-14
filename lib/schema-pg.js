'use strict';

const { DatabaseSchema } = require('./schema-db.js');
const { toLowerCamel, toUpperCamel, isUpperCamel } = require('./utils.js');

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
  datetime: 'timestamp with time zone',
  uuid: 'uuid',
  url: 'varchar',
  inet: 'inet',
  text: 'text',
  json: 'jsonb',
  blob: 'bytea',
  point: 'point',
};

const createIndex = (entityName, { name, unique, index }) => {
  const uni = unique ? 'UNIQUE ' : '';
  const prefix = unique ? 'ak' : 'idx';
  let fields = unique || index;
  const type = typeof fields;
  if (type === 'boolean') fields = `("${name}")`;
  else if (type !== 'string') fields = `("${fields.join('", "')}")`;
  else if (fields.includes('(')) fields = `USING ${fields}`;
  else fields = `("${fields}")`;
  const idxName = `"${prefix}${entityName}${toUpperCamel(name)}"`;
  return `CREATE ${uni}INDEX ${idxName} ON "${entityName}" ${fields};`;
};

const foreignKey = (entityName, { name, type }) => {
  const fk = 'fk' + entityName + toUpperCamel(name);
  const toField = toLowerCamel(type) + 'Id';
  return (
    `ALTER TABLE "${entityName}" ADD CONSTRAINT "${fk}" ` +
    `FOREIGN KEY ("${name}Id") ` +
    `REFERENCES "${type}" ("${toField}") ON DELETE CASCADE;`
  );
};

const primaryKey = entityName => {
  const fieldName = toLowerCamel(entityName) + 'Id';
  const constraint = `"pk${entityName}" PRIMARY KEY ("${fieldName}")`;
  return `ALTER TABLE "${entityName}" ADD CONSTRAINT ${constraint};`;
};

class PgSchema extends DatabaseSchema {
  async preprocessEntity(name) {
    const entity = this.entities.get(name);
    const fields = Object.keys(entity);
    for (const fieldName of fields) {
      const field = entity[fieldName];
      const short = typeof field === 'string';
      const fieldDef = short ? { type: field } : field;
      const def = { name: fieldName, ...FIELD_DEF, ...fieldDef };
      if (def.type) {
        const kind = isUpperCamel(def.type) ? 'entity' : 'type';
        const notFound = kind === 'entity'
          ? !this.entities.has(def.type)
          : !PG_TYPES[def.type];
        if (notFound) {
          console.error(`  Error: ${kind} is not found ${def.type} at ${name}`);
          delete entity[fieldName];
          continue;
        }
      }
      entity[fieldName] = def;
    }
  }

  async createEntity(name) {
    const entity = this.entities.get(name);
    const sql = [];
    const idx = [];
    sql.push(`CREATE TABLE "${name}" (`);
    const pk = toLowerCamel(name) + 'Id';
    sql.push(`  "${pk}" bigint generated always as identity,`);
    idx.push(primaryKey(name));
    const fields = Object.keys(entity);
    for (const fieldName of fields) {
      const def = entity[fieldName];
      const nullable = def.required ? ' NOT NULL' : '';
      if (def.type) {
        const kind = isUpperCamel(def.type) ? DB_RELATION : DB_FIELD;
        const pgType = kind === DB_FIELD ? PG_TYPES[def.type] : 'bigint';
        if (!pgType) throw new Error(`Unknown type: ${def.type}`);
        const pgField = def.name + (kind === DB_FIELD ? '' : 'Id');
        sql.push(`  "${pgField}" ${pgType}${nullable},`);
        if (kind === DB_RELATION) idx.push(foreignKey(name, def));
      }
      if (def.unique || def.index) idx.push(createIndex(name, def));
    }
    sql[sql.length - 1] = sql[sql.length - 1].slice(0, -1);
    sql.push(');');
    return sql.join('\n') + '\n\n' + idx.join('\n');
  }
}

DatabaseSchema.implementations.pg = PgSchema;
