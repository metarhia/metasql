'use strict';

const { Client } = require('pg');

const { isFirstUpper, toLowerCamel, toUpperCamel } = require('metautil');
const { Schema } = require('metaschema');

const { dbms } = require('./dbms.js');

const DB_RELATION = 1;
const DB_FIELD = 2;

const PG_TYPES = {
  string: { metadata: { pg: 'varchar' } },
  number: { metadata: { pg: 'integer' } },
  boolean: { metadata: { pg: 'boolean' } },
  bigint: { metadata: { pg: 'bigint' } },
  enum: { metadata: { pg: 'varchar' } },
  json: { metadata: { pg: 'jsonb' } },

  real: { js: 'number', metadata: { pg: 'real' } },
  double: { js: 'number', metadata: { pg: 'double precision' } },
  money: { js: 'string', metadata: { pg: 'numeric(12, 2)' } },
  date: { js: 'string', metadata: { pg: 'date' } },
  time: { js: 'string', metadata: { pg: 'time' } },
  datetime: { js: 'string', metadata: { pg: 'timestamp with time zone' } },
  interval: { js: 'string', metadata: { pg: 'interval' } },
  uuid: { js: 'string', metadata: { pg: 'uuid' } },
  url: { js: 'string', metadata: { pg: 'varchar' } },
  inet: { js: 'string', metadata: { pg: 'inet' } },
  text: { js: 'string', metadata: { pg: 'text' } },
  blob: { js: 'string', metadata: { pg: 'bytea' } },
  point: { js: 'string', metadata: { pg: 'point' } },
};

const PG_REF_ACTIONS = [
  'NO ACTION',
  'RESTRICT',
  'CASCADE',
  'SET NULL',
  'SET DEFAULT',
];

const createIndex = (entityName, indexName, def, entity) => {
  const { unique, index } = def;
  const uni = unique ? 'UNIQUE ' : '';
  const prefix = unique ? 'ak' : 'idx';
  const fieldNames = [];
  const fieldList = unique || index;
  const indexFields = typeof fieldList === 'boolean' ? [indexName] : fieldList;
  fieldNames.push(...indexFields);
  const names = [];
  for (const name of fieldNames) {
    const field = entity.fields[name];
    if (!field) throw new Error(`Field not found: ${entityName}.${name}`);
    names.push(isFirstUpper(field.type) ? name + 'Id' : name);
  }
  const fields = '("' + names.join('", "') + '")';
  const idxName = `"${prefix}${entityName}${toUpperCamel(indexName)}"`;
  return `CREATE ${uni}INDEX ${idxName} ON "${entityName}" ${fields};`;
};

const createMany = (entityName, { many }, model) => {
  const from = toLowerCamel(entityName);
  const to = toLowerCamel(many);
  const crossName = entityName + many;
  const crossReference = {
    [from]: { name: from, type: entityName, delete: 'cascade', required: true },
    [to]: { name: to, type: many, delete: 'cascade', required: true },
    [crossName]: { name: crossName, primary: [from, to] },
  };
  const entity = new Schema(crossName, crossReference);
  model.entities.set(crossName, entity);
  const { createEntity } = dbms[model.database.driver];
  return createEntity(model, crossName);
};

const refAction = (name) => {
  const actionName = name.toUpperCase();
  if (!PG_REF_ACTIONS.includes(actionName)) {
    throw new Error('Entity reference action is not expected: ' + name);
  }
  return actionName;
};

const foreignKey = (entityName, indexName, def, refId = false) => {
  const fk = 'fk' + entityName + toUpperCamel(indexName);
  const identifier = def.type === 'Identifier';
  const from = indexName === 'id' ? 'id' : indexName + 'Id';
  const to = identifier || refId ? 'id' : toLowerCamel(def.type) + 'Id';
  const onDelete = def.delete ? ` ON DELETE ${refAction(def.delete)}` : '';
  const onUpdate = def.update ? ` ON UPDATE ${refAction(def.update)}` : '';
  return (
    `ALTER TABLE "${entityName}" ADD CONSTRAINT "${fk}" ` +
    `FOREIGN KEY ("${from}") ` +
    `REFERENCES "${def.type}" ("${to}")${onDelete}${onUpdate};`
  );
};

const primaryCustom = (entityName, fields, entity) => {
  const idx = [...fields];
  if (entity) {
    for (let i = 0; i < idx.length; i++) {
      const field = idx[i];
      const def = entity.fields[field];
      if (!def) continue;
      const { type } = def;
      if (!type) continue;
      const ref = isFirstUpper(type);
      idx[i] = ref ? field + 'Id' : field;
    }
  }
  const fieldNames = `"${idx.join('", "')}"`;
  const constraint = `"pk${entityName}" PRIMARY KEY (${fieldNames})`;
  return `ALTER TABLE "${entityName}" ADD CONSTRAINT ${constraint};`;
};

const ignoreField = (entityName, key, def) =>
  key === `${toLowerCamel(entityName)}Id` ||
  def.many ||
  typeof def === 'function';

const flatFields = (fields) => {
  const flat = {};
  const names = Object.keys(fields);
  for (const name of names) {
    const value = fields[name];
    if (value.type === 'schema') {
      const groupNames = Object.keys(value.schema);
      for (const field of groupNames) {
        const fieldName = name + toUpperCamel(field);
        flat[fieldName] = value.schema[field];
      }
    } else {
      flat[name] = value;
    }
  }
  return flat;
};

const createEntity = (model, name) => {
  const entity = model.entities.get(name);
  const sql = [];
  const idx = [];
  sql.push(`CREATE TABLE "${name}" (`);
  const registry = entity.kind === 'registry';
  const pkField = name === 'Identifier' ? 'id' : name + 'Id';
  const pk = registry ? 'id' : toLowerCamel(pkField);
  const gen = registry ? 'NOT NULL' : 'generated always as identity';
  sql.push(`  "${pk}" bigint ${gen},`);
  idx.push(primaryCustom(name, [pk]));
  if (registry) idx.push(foreignKey(name, pk, { type: 'Identifier' }));
  const flat = flatFields(entity.fields);
  const fields = Object.keys(flat);
  for (const field of fields) {
    const def = flat[field];
    if (ignoreField(name, field, def)) continue;
    const nullable = def.required ? ' NOT NULL' : ' NULL';
    if (def.type) {
      const kind = isFirstUpper(def.type) ? DB_RELATION : DB_FIELD;
      const { pg } = def.constructor.metadata;
      let pgType = kind === DB_FIELD ? pg : 'bigint';
      if (!pgType) {
        throw new Error(`Unknown type: ${def.type} in ${name}.${field}`);
      }
      const pgField = field + (kind === DB_FIELD ? '' : 'Id');
      let defVal = '';
      if (typeof def.default !== 'undefined') {
        defVal = ' DEFAULT ';
        if (def.type === 'datetime' && def.default === 'now') {
          defVal += `CURRENT_TIMESTAMP`;
        } else {
          const quoted = def.type === 'number' || def.type === 'boolean';
          defVal += quoted ? def.default : `'${def.default}'`;
        }
      }
      if (def.length?.max) pgType = `${pgType}(${def.length.max})`;
      if (def.index || def.unique) {
        idx.push(createIndex(name, field, def, entity));
      }
      sql.push(`  "${pgField}" ${pgType}${nullable}${defVal},`);
      if (kind === DB_RELATION) {
        const ref = model.entities.get(def.type);
        if (!ref) throw new Error(`Unknown schema: ${def.type}`);
        const refId = ref.kind === 'registry';
        idx.push(foreignKey(name, field, def, refId));
      }
    }
  }
  const indexes = Object.keys(entity.indexes);
  for (const index of indexes) {
    const def = entity.indexes[index];
    if (def.unique || def.index) {
      idx.push(createIndex(name, index, def, entity));
    }
    if (def.primary) {
      idx[0] = primaryCustom(name, def.primary, entity);
      sql.splice(1, 1);
    }
    if (def.many) idx.push('\n' + createMany(name, def, model));
  }
  sql[sql.length - 1] = sql[sql.length - 1].slice(0, -1);
  sql.push(');');
  return sql.join('\n') + '\n\n' + idx.join('\n');
};

const NEW_ID = 'INSERT INTO "Identifier" DEFAULT VALUES;';
const NEW_ENT = 'INSERT INTO "Entity" ("id", "name", "kind") ';
const NEW_FLD = 'INSERT INTO "Field" ("id", "entityId", "name") ';

const entId = (name) => `SELECT "id" FROM "Entity" WHERE "name" = '${name}'`;

const fldId = (entity, field) =>
  'SELECT "id" FROM "Field" WHERE "entityId" = (' +
  entId(entity) +
  `) AND "name" = '${field}'`;

const updateIdentifier = (entityId, id) =>
  'UPDATE "Identifier" SET "entityId" = ' +
  `(${entityId}) WHERE "id" = (${id});`;

const registerEntity = (model, name) => {
  const entity = model.entities.get(name);
  const ins = [];
  const upd = [];
  ins.push(NEW_ID);
  ins.push(NEW_ENT + `VALUES (lastval(), '${name}', '${entity.kind}');`);
  upd.push(updateIdentifier(entId('Entity'), entId(name)));
  const entityId = entId(name);
  const flat = flatFields(entity.fields);
  const fields = Object.keys(flat);
  for (const field of fields) {
    if (ignoreField(name, field, flat[field])) continue;
    ins.push(NEW_ID);
    ins.push(NEW_FLD + `VALUES (lastval(), (${entityId}), '${field}');`);
    upd.push(updateIdentifier(entId('Field'), fldId(name, field)));
  }
  return { inserts: ins.join('\n'), updates: upd.join('\n') };
};

const execute = async (database, sql) => {
  const client = new Client(database.connection);
  await client.connect();
  await client.query(sql);
  await client.end();
};

dbms.pg = {
  types: PG_TYPES,
  execute,
  createEntity,
  registerEntity,
};
