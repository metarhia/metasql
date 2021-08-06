'use strict';

const { Pool } = require('pg');

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

const buildWhere = (conditions, firstArgIndex = 1) => {
  const disjunction = [];
  const args = [];
  let i = firstArgIndex;
  for (const where of conditions) {
    const conjunction = [];
    const keys = Object.keys(where);
    for (const key of keys) {
      const [operator, value] = whereValue(where[key]);
      conjunction.push(`"${key}" ${operator} $${i++}`);
      args.push(value);
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
    const value = delta[key].toString();
    clause.push(`"${key}" = $${i++}`);
    args.push(value);
  }
  return { clause: clause.join(', '), args };
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

  returning(fields) {
    this.options.returning = fields;
    return this;
  }

  then(resolve, reject) {
    const args = [];
    const { table, fields, where, options } = this;
    const names = fields[0] === '*' ? '*' : `"${fields.join('", "')}"`;
    const sql = [`SELECT ${names} FROM "${table}"`];
    if (where.length !== 0) {
      const cond = buildWhere(where);
      sql.push('WHERE ' + cond.clause);
      args.push(...cond.args);
    }
    const { order, desc, limit, offset, returning } = options;
    if (order) sql.push('ORDER BY "' + order.join('", "') + '"');
    if (desc) sql.push('ORDER BY "' + desc.join('", "') + '" DESC');
    if (limit) sql.push('LIMIT ' + limit);
    if (offset) sql.push('OFFSET ' + offset);
    if (returning) {
      if (returning[0] === '*') sql.push('RETURNING *');
      else sql.push('RETURNING "' + returning.join('", "') + '"');
    }
    this.db.query(sql.join(' '), args).then((result) => {
      resolve(result.rows);
    }, reject);
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

class Database {
  constructor(options) {
    this.pool = new Pool(options);
    this.console = options.console || options.logger || console;
    this.model = options.model || null;
  }

  query(sql, values) {
    const data = values ? values.join(',') : '';
    this.console.debug(`${sql}\t[${data}]`);
    return this.pool.query(sql, values);
  }

  async id(name) {
    const cat = `SELECT "id" FROM "Category" WHERE "name" = '${name}'`;
    const sql = `INSERT INTO "Identifier" ("categoryId") VALUES ((${cat}))`;
    const res = await this.query(sql + ' RETURNING lastval()');
    const values = Object.values(res.rows[0]);
    if (values.length < 1) throw new Error(`Can't generate id for ${name}`);
    return values[0];
  }

  async insert(table, record) {
    let row = record;
    const entity = this.model ? this.model.entities.get(table) : null;
    if (entity && entity.kind === 'registry') {
      const id = await this.id(table);
      row = { id, ...record };
    }
    const keys = Object.keys(row);
    const nums = new Array(keys.length);
    const data = new Array(keys.length);
    let i = 0;
    for (const key of keys) {
      data[i] = row[key];
      nums[i] = `$${++i}`;
    }
    const fields = '"' + keys.join('", "') + '"';
    const params = nums.join(', ');
    const sql = `INSERT INTO "${table}" (${fields}) VALUES (${params})`;
    return this.query(sql + ' RETURNING lastval()', data);
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
    if (values.length < 1) return undefined;
    return values[0];
  }

  async col(table, field, ...conditions) {
    const column = [];
    const rows = await this.select(table, [field], ...conditions);
    for (const row of rows) column.push(row[field]);
    return column;
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
    return this.query(sql, args);
  }

  update(table, delta = null, ...conditions) {
    const upd = updates(delta);
    const cond = buildWhere(conditions, upd.args.length + 1);
    const sql = `UPDATE "${table}" SET ${upd.clause} WHERE ${cond.clause}`;
    const args = [...upd.args, ...cond.args];
    return this.query(sql, args);
  }

  close() {
    this.pool.end();
  }
}

module.exports = { Database, Query };
