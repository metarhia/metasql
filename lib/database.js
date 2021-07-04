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

const buildWhere = (conditions, firstArgIndex = 1, withQuotes = true) => {
  const disjunction = [];
  const args = [];
  let i = firstArgIndex;
  for (const where of conditions) {
    const conjunction = [];
    const keys = Object.keys(where);
    for (const key of keys) {
      const [operator, value] = whereValue(where[key]);
      const columnName = withQuotes ? `"${key}"` : key;
      conjunction.push(`${columnName} ${operator} $${i++}`);
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

const buildSystemQuery = (type, fields, ...conditions) => {
  const names = fields[0] === '*' ? '*' : `"${fields.join('", "')}"`;

  const args = [];
  const sql = [`SELECT ${names} FROM INFORMATION_SCHEMA.${type}`];

  if (conditions.length !== 0) {
    const cond = buildWhere(conditions, 1, false);
    sql.push('WHERE ' + cond.clause);
    args.push(...cond.args);
  }

  return { sql: sql.join(' '), args };
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
    const { order, desc, limit, offset } = options;
    if (order) sql.push('ORDER BY "' + order.join('", "') + '"');
    if (desc) sql.push('ORDER BY "' + desc.join('", "') + '" DESC');
    if (limit) sql.push('LIMIT ' + limit);
    if (offset) sql.push('OFFSET ' + offset);
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

  async count(table, ...conditions) {
    const { clause, args } = buildWhere(conditions);
    const sql = [
      `SELECT count(*) FROM "${table}"`,
      clause ? `WHERE ${clause}` : '',
    ];

    const {
      rows: [{ count }],
    } = await this.query(sql.join(' '), args);

    return parseInt(count);
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

  async upsert(table, record, constraint) {
    const count = await this.count(table, constraint);
    if (count) return this.update(table, record, constraint);
    return this.insert(table, record);
  }

  async fields(table) {
    const { sql, args } = buildSystemQuery('COLUMNS', ['column_name'], {
      'columns.table_name': table,
    });
    const result = await this.query(sql, args);
    return result.rows.map(({ column_name: name }) => name);
  }

  async tables() {
    const { sql, args } = buildSystemQuery('TABLES', ['table_name'], {
      'tables.table_schema': `public`,
    });
    const result = await this.query(sql, args);
    return result.rows.map(({ table_name: name }) => name);
  }

  close() {
    this.pool.end();
  }
}

module.exports = { Database, Query };
