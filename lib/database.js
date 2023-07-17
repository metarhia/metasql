'use strict';

const { Pool } = require('pg');

const removePadding = (s) => {
  const chunks = s.split('\n').map((d) => d.trim());
  return chunks.join('\n');
};

const OPERATORS = ['>=', '<=', '<>', '>', '<'];

const whereValue = (value) => {
  if (typeof value === 'string') {
    for (const op of OPERATORS) {
      const len = op.length;
      if (value.startsWith(op)) {
        return [op, value.substring(len)];
      }
    }
    if (value.includes('*') || value.includes('?')) {
      const mask = value.replace(/\*/g, '%').replace(/\?/g, '_');
      return ['LIKE', mask];
    }
  }
  return ['=', value];
};

const buildFields = (fields) => {
  if (fields[0] === '*') return '*';
  const list = [];
  for (const field of fields) {
    list.push(field.includes('(') ? field : `"${field}"`);
  }
  return list.join(', ');
};

const buildWhere = (conditions, firstArgIndex = 1) => {
  const disjunction = [];
  const args = [];
  let i = firstArgIndex;
  for (const where of conditions) {
    const conjunction = [];
    const keys = Object.keys(where);
    for (const key of keys) {
      const [operator, value] = whereValue(where[key]);
      if (value !== undefined) {
        conjunction.push(`"${key}" ${operator} $${i++}`);
        args.push(value);
      }
    }
    disjunction.push(conjunction.join(' AND '));
  }
  return { clause: disjunction.join(' OR '), args };
};

const updates = (delta, firstArgIndex = 1) => {
  const clause = [];
  const args = [];
  let i = firstArgIndex;
  const keys = Object.keys(delta);
  for (const key of keys) {
    const value = delta[key];
    if (value !== undefined) {
      clause.push(`"${key}" = $${i++}`);
      const data = value === null ? null : value.toString();
      args.push(data);
    }
  }
  return { clause: clause.join(', '), args };
};

const queryToString = (prepared) => {
  let { sql } = prepared;
  let i = 1;
  for (const arg of prepared.args) {
    sql = sql.replace('$' + i.toString(), `"${arg}"`);
    i++;
  }
  return sql;
};

class Query {
  constructor(db, table, fields, ...where) {
    this.db = db;
    this.table = table;
    this.fields = fields;
    this.where = where;
    this.options = {};
  }

  order(field) {
    if (this.options.desc) Reflect.deleteProperty(this.options, 'desc');
    this.options.order = typeof field === 'string' ? [field] : field;
    return this;
  }

  desc(field) {
    if (this.options.order) Reflect.deleteProperty(this.options, 'order');
    this.options.desc = typeof field === 'string' ? [field] : field;
    return this;
  }

  limit(count) {
    this.options.limit = count;
    return this;
  }

  offset(count) {
    this.options.offset = count;
    return this;
  }

  prepare() {
    const args = [];
    const { table, fields, where, options } = this;
    const names = buildFields(fields);
    const sql = [`SELECT ${names} FROM "${table}"`];
    if (where.length !== 0) {
      const cond = buildWhere(where);
      sql.push('WHERE ' + cond.clause);
      args.push(...cond.args);
    }
    const { order, desc, limit, offset } = options;
    if (order) sql.push('ORDER BY "' + order.join('", "') + '"');
    if (desc) sql.push('ORDER BY "' + desc.join('", "') + '" DESC');
    if (limit) sql.push('LIMIT ' + limit);
    if (offset) sql.push('OFFSET ' + offset);
    return { sql: sql.join(' '), args };
  }

  then(resolve, reject) {
    const { sql, args } = this.prepare();
    return this.db
      .query(sql, args)
      .then(({ rows }) => (resolve ? resolve(rows) : rows), reject);
  }

  catch(onReject) {
    return this.then(null, onReject);
  }

  toString() {
    return queryToString(this.prepare());
  }

  toObject() {
    return {
      table: this.table,
      fields: [...this.fields],
      where: this.where.map((cond) => ({ ...cond })),
      options: this.options,
    };
  }

  static from(db, metadata) {
    const { table, fields, where, options } = metadata;
    const conditions = where.map((cond) => ({ ...cond }));
    const query = new Query(db, table, fields, ...conditions);
    Object.assign(query.options, options);
    return query;
  }
}

class Modify {
  constructor(db, sql, args) {
    this.db = db;
    this.sql = sql;
    this.args = args;
    this.options = {};
  }

  returning(field) {
    const fields = typeof field === 'string' ? [field] : field;
    this.options.returning = fields;
    return this;
  }

  prepare() {
    const sql = [this.sql];
    const { returning = ['*'] } = this.options;
    if (returning[0] === '*') sql.push('RETURNING *');
    else sql.push('RETURNING "' + returning.join('", "') + '"');
    return { sql: sql.join(' '), args: this.args };
  }

  then(resolve, reject) {
    const { sql, args } = this.prepare();
    return this.db
      .query(sql, args)
      .then(({ rows }) => (resolve ? resolve(rows) : rows), reject);
  }

  toString() {
    return queryToString(this.prepare());
  }

  toObject() {
    return {
      sql: this.sql,
      args: [...this.args],
      options: this.options,
    };
  }

  static from(db, metadata) {
    const { sql, args, options } = metadata;
    const modify = new Modify(db, sql, args);
    Object.assign(modify.options, options);
    return modify;
  }
}

class Statement {
  constructor(db, sql, keys) {
    this.db = db;
    this.sql = sql;
    this.keys = keys;
  }

  async rows(params = {}) {
    const names = Object.getOwnPropertyNames(params);
    const args = [];
    for (const key of this.keys) {
      const value = names.includes(key) ? Reflect.get(params, key) : key;
      args.push(value);
    }
    const { rows } = await this.db.query(this.sql, args);
    return rows;
  }

  async row(params = {}) {
    const rows = await this.rows(params);
    if (rows.length < 1) return null;
    return rows[0];
  }

  async scalar(params = {}) {
    const row = await this.row(params);
    const values = Object.values(row);
    return values[0];
  }

  async col(field, params = {}) {
    const column = [];
    const rows = await this.rows(params);
    for (const row of rows) column.push(row[field]);
    return column;
  }

  async count(params = {}) {
    const count = await this.scalar(params);
    return parseInt(count, 10);
  }

  async dict(keyField, valField, params = {}) {
    const dictionary = {};
    const rows = await this.rows(params);
    for (const row of rows) {
      const key = row[keyField];
      const val = row[valField];
      dictionary[key] = val;
    }
    return dictionary;
  }
}

class Database {
  constructor(options) {
    this.pool = new Pool(options);
    this.console = options.console || options.logger || console;
    this.model = options.model || null;
  }

  query(sql, values) {
    const data = values ? values.join(',') : '';
    this.console.debug(`${sql}\t[${data}]`);

    return this.pool.query(sql, values).catch((error) => {
      error.dbStack = error.stack;
      Error.captureStackTrace(error);
      throw error;
    });
  }

  register(name, fields, params, data) {
    const sql = [
      'WITH "Reg" AS (',
      '  INSERT INTO "Identifier" ("entityId")',
      `  VALUES ((SELECT "id" FROM "Entity" WHERE "name" = '${name}'))`,
      '  RETURNING lastval() AS "id"',
      ')',
      `INSERT INTO "${name}" ("id", ${fields})`,
      `SELECT "Reg"."id", ${params}`,
      'FROM "Reg"',
    ];
    return new Modify(this, sql.join('\n'), data);
  }

  sql(strings, ...keys) {
    const chunks = [removePadding(strings[0].trim())];
    for (let i = 1; i <= keys.length; i++) {
      chunks.push('$' + i.toString(), removePadding(strings[i]));
    }
    const expression = chunks.join(' ');
    return new Statement(this, expression, keys);
  }

  insert(table, record) {
    const keys = [];
    const data = [];
    const nums = [];
    let i = 0;
    for (const key of Object.keys(record)) {
      const value = record[key];
      if (value !== undefined) {
        keys.push(key);
        data.push(value);
        nums.push(`$${++i}`);
      }
    }
    const fields = '"' + keys.join('", "') + '"';
    const params = nums.join(', ');

    const entity = this.model ? this.model.entities.get(table) : null;
    if (entity?.kind === 'registry') {
      return this.register(table, fields, params, data);
    }

    const sql = `INSERT INTO "${table}" (${fields}) VALUES (${params})`;
    return new Modify(this, sql, data);
  }

  select(table, fields = ['*'], ...conditions) {
    if (Array.isArray(fields)) {
      return new Query(this, table, fields, ...conditions);
    }
    return new Query(this, table, ['*'], fields, ...conditions);
  }

  async row(table, fields, ...conditions) {
    const rows = await this.select(table, fields, ...conditions);
    if (rows.length < 1) return null;
    return rows[0];
  }

  async scalar(table, field, ...conditions) {
    const row = await this.row(table, [field], ...conditions);
    const values = Object.values(row);
    return values[0];
  }

  async col(table, field, ...conditions) {
    const column = [];
    const rows = await this.select(table, [field], ...conditions);
    for (const row of rows) column.push(row[field]);
    return column;
  }

  async count(table, ...conditions) {
    const count = await this.scalar(table, 'count(*)', ...conditions);
    return parseInt(count, 10);
  }

  async dict(table, fields, ...conditions) {
    const [keyField, valField] = fields;
    const obj = Object.create(null);
    const rows = await this.select(table, fields, ...conditions);
    for (const row of rows) obj[row[keyField]] = row[valField];
    return obj;
  }

  delete(table, ...conditions) {
    const { clause, args } = buildWhere(conditions);
    const sql = `DELETE FROM "${table}" WHERE ${clause}`;
    return new Modify(this, sql, args);
  }

  update(table, delta = null, ...conditions) {
    const upd = updates(delta);
    const cond = buildWhere(conditions, upd.args.length + 1);
    const sql = `UPDATE "${table}" SET ${upd.clause} WHERE ${cond.clause}`;
    const args = [...upd.args, ...cond.args];
    return new Modify(this, sql, args);
  }

  close() {
    this.pool.end();
  }
}

module.exports = { Database, Query };
