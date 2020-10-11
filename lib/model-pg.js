'use strict';

const { Client } = require('pg');
const { DatabaseModel } = require('./model-db.js');
const { toLowerCamel, toUpperCamel, isUpperCamel } = require('./utils.js');

const DB_RELATION = 1;
const DB_FIELD = 2;

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

const PG_REF_ACTIONS = [
  'NO ACTION',
  'RESTRICT',
  'CASCADE',
  'SET NULL',
  'SET DEFAULT',
];

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

const createMany = (entityName, { many }, schema) => {
  const fromEntity = toLowerCamel(entityName);
  const toEntity = toLowerCamel(many);
  const crossName = entityName + many;
  const crossReference = {
    [fromEntity]: { name: fromEntity, type: entityName, required: true },
    [toEntity]: { name: toEntity, type: many, required: true },
    [crossName]: { name: crossName, primary: [fromEntity, toEntity] },
  };
  schema.entities.set(crossName, { entity: crossReference });
  return schema.createEntity(crossName);
};

const refAction = name => {
  const actionName = name.toUpperCase();
  if (!PG_REF_ACTIONS.includes(actionName)) {
    throw new Error('Entity reference action is not expected: ' + name);
  }
  return actionName;
};

const foreignKey = (entityName, def) => {
  const fk = 'fk' + entityName + toUpperCamel(def.name);
  const toField = toLowerCamel(def.type) + 'Id';
  const onDelete = def.delete ? ` ON DELETE ${refAction(def.delete)}` : '';
  const onUpdate = def.update ? ` ON UPDATE ${refAction(def.update)}` : '';
  return (
    `ALTER TABLE "${entityName}" ADD CONSTRAINT "${fk}" ` +
    `FOREIGN KEY ("${def.name}Id") ` +
    `REFERENCES "${def.type}" ("${toField}")${onDelete}${onUpdate};`
  );
};

const primaryCustom = (entityName, fields, entity) => {
  const idx = [...fields];
  if (entity) {
    for (let i = 0; i < idx.length; i++) {
      const field = idx[i];
      const def = entity[field];
      if (!def) continue;
      const { type } = def;
      if (!type) continue;
      const ref = isUpperCamel(type);
      idx[i] = ref ? field + 'Id' : field;
    }
  }
  const fieldNames = `"${idx.join('", "')}"`;
  const constraint = `"pk${entityName}" PRIMARY KEY (${fieldNames})`;
  return `ALTER TABLE "${entityName}" ADD CONSTRAINT ${constraint};`;
};

const primaryKey = entityName => {
  const fieldName = toLowerCamel(entityName);
  return primaryCustom(entityName, [fieldName]);
};

class PgModel extends DatabaseModel {
  constructor(modelPath, database, types = {}) {
    super(modelPath, database, { ...PG_TYPES, ...types });
  }

  createEntity(name) {
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
        const pgType = kind === DB_FIELD ? this.types[def.type] : 'bigint';
        if (!pgType) throw new Error(`Unknown type: ${def.type}`);
        const pgField = def.name + (kind === DB_FIELD ? '' : 'Id');
        let defVal = '';
        if (typeof def.default !== 'undefined') {
          defVal = ' DEFAULT ';
          defVal += def.type === 'string' ? `"${def.default}"` : def.default;
        }
        sql.push(`  "${pgField}" ${pgType}${nullable}${defVal},`);
        if (kind === DB_RELATION) idx.push(foreignKey(name, def));
      }
      if (def.unique || def.index) idx.push(createIndex(name, def));
      if (def.primary) {
        idx[0] = primaryCustom(name, def.primary, entity);
        sql.splice(1, 1);
      }
      if (def.many) idx.push('\n' + createMany(name, def, this));
    }
    sql[sql.length - 1] = sql[sql.length - 1].slice(0, -1);
    sql.push(');');
    return sql.join('\n') + '\n\n' + idx.join('\n');
  }

  async execute(sql) {
    const client = new Client(this.database.connection);
    await client.connect();
    await client.query(sql);
    await client.end();
  }
}

DatabaseModel.implementations.pg = PgModel;
