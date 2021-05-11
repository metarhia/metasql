'use strict';

const { Pool } = require('pg');

const OPERATORS = ['>=', '<=', '<>', '>', '<'];

const buildWhere = (conditions, firstArgIndex = 1) => {
  const clause = [];
  const args = [];
  let i = firstArgIndex;
  const keys = Object.keys(conditions);
  for (const key of keys) {
    let operator = '=';
    let value = conditions[key];
    if (typeof value === 'string') {
      for (const op of OPERATORS) {
        const len = op.length;
        if (value.startsWith(op)) {
          operator = op;
          value = value.substring(len);
        }
      }
      if (value.includes('*') || value.includes('?')) {
        operator = 'LIKE';
        value = value.replace(/\*/g, '%').replace(/\?/g, '_');
      }
    }
    clause.push(`"${key}" ${operator} $${i++}`);
    args.push(value);
  }
  return { clause: clause.join(' AND '), args };
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
  constructor(db, table, fields, where) {
    this.db = db;
    this.table = table;
    this.fields = fields;
    this.where = where;
    this.options = {};
  }

  order(field) {
    this.options.order = typeof field === 'string' ? [field] : field;
    return this;
  }

  limit(count) {
    this.options.limit = count;
    return this;
  }

  then(resolve, reject) {
    const args = [];
    const { table, fields, where, options } = this;
    const names = fields[0] === '*' ? '*' : `"${fields.join('", "')}"`;
    const sql = [`SELECT ${names} FROM "${table}"`];
    if (where) {
      const cond = buildWhere(where);
      sql.push('WHERE ' + cond.clause);
      args.push(...cond.args);
    }
    const { order, limit } = options;
    if (order) sql.push('ORDER BY "' + order.join('", "') + '"');
    if (limit) sql.push('LIMIT ' + limit);
    this.db.query(sql.join(' '), args).then((result) => {
      resolve(result.rows);
    }, reject);
  }
}

class Database {
  constructor(config) {
    this.pool = new Pool(config);
    this.logger = config.logger;
  }

  query(sql, values) {
    const data = values ? values.join(',') : '';
    this.logger.debug(`${sql}\t[${data}]`);
    return this.pool.query(sql, values);
  }

  insert(table, record) {
    const keys = Object.keys(record);
    const nums = new Array(keys.length);
    const data = new Array(keys.length);
    let i = 0;
    for (const key of keys) {
      data[i] = record[key];
      nums[i] = `$${++i}`;
    }
    const fields = '"' + keys.join('", "') + '"';
    const params = nums.join(', ');
    const sql = `INSERT INTO "${table}" (${fields}) VALUES (${params})`;
    return this.query(sql, data);
  }

  select(table, fields = ['*'], conditions = null) {
    if (!Array.isArray(fields)) {
      return new Query(this, table, ['*'], fields);
    }
    return new Query(this, table, fields, conditions);
  }

  async row(table, fields, conditions) {
    const rows = await this.select(table, fields, conditions);
    if (rows.length < 1) return null;
    return rows[0];
  }

  async scalar(table, field, conditions) {
    const row = await this.row(table, [field], conditions);
    const values = Object.values(row);
    if (values.length < 1) return undefined;
    return values[0];
  }

  async col(table, field, conditions) {
    const column = [];
    const rows = await this.select(table, [field], conditions);
    for (const row of rows) column.push(row[field]);
    return column;
  }

  async dict(table, fields, conditions) {
    const [keyField, valField] = fields;
    const obj = Object.create(null);
    const rows = await this.select(table, fields, conditions);
    for (const row of rows) obj[row[keyField]] = row[valField];
    return obj;
  }

  delete(table, conditions = null) {
    const { clause, args } = buildWhere(conditions);
    const sql = `DELETE FROM "${table}" WHERE ${clause}`;
    return this.query(sql, args);
  }

  update(table, delta = null, conditions = null) {
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

module.exports = { Database };
