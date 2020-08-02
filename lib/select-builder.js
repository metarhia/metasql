'use strict';

const { iter } = require('@metarhia/common');

const { QueryBuilder } = require('./query-builder');
const { joinIterable } = require('./utils');

const allowedConditions = new Set([
  '=',
  '<>',
  '<',
  '<=',
  '>',
  '>=',
  'LIKE',
  'EXISTS',
  'IN',
  'NOT IN',
]);

const functionHandlers = {
  count: op => `count(${op.field})`,
  avg: op => `avg(${op.field})`,
  min: op => `min(${op.field})`,
  max: op => `max(${op.field})`,
  sum: op => `sum(${op.field})`,
};

const parseCondition = cond => {
  if (cond === '!=') return '<>';
  if (!allowedConditions.has(cond)) {
    throw new Error(`The operator "${cond}" is not permitted`);
  }
  return cond;
};

const checkType = (value, name, type) => {
  if (!(value instanceof QueryBuilder) && typeof value !== type) {
    throw new TypeError(
      `Invalid '${name}' value (${value}) type, expected '${type}'`
    );
  }
};

const makeParamValue = (cond, value, params) => {
  if (value instanceof QueryBuilder) {
    return '(' + value.build(params) + ')';
  } else if (cond === 'IN' || cond === 'NOT IN') {
    return '(' + value.map(v => params.add(v)).join(', ') + ')';
  } else if (cond && cond.endsWith('ANY')) {
    return '(' + params.add(value) + ')';
  } else {
    return params.add(value);
  }
};

class SelectBuilder extends QueryBuilder {
  constructor(params, options) {
    super(params, options);
    this.operations = {
      select: new Set(),
      selectDistinct: false,
      innerJoin: [],
      functions: [],
      where: [],
      groupBy: new Set(),
      orderBy: [],
      avg: [],
      min: [],
      count: [],
      max: [],
      sum: [],
      from: new Set(),
      limit: null,
      offset: null,
    };
  }

  from(tableName) {
    this.operations.from.add(this.escapeIdentifier(tableName));
    return this;
  }

  select(...fields) {
    const select = this.operations.select;
    for (const f of fields) {
      select.add(this.escapeKey(f));
    }
    return this;
  }

  innerJoin(tableName, leftKey, rightKey) {
    this.operations.innerJoin.push({
      table: this.escapeIdentifier(tableName),
      leftKey: this.escapeKey(leftKey),
      rightKey: this.escapeKey(rightKey),
    });
    return this;
  }

  distinct() {
    this.operations.selectDistinct = true;
    return this;
  }

  _where(key, cond, value, mod) {
    this.operations.where.push({
      key: this.escapeKey(key),
      value,
      cond: parseCondition(cond.toUpperCase()),
      mod,
    });
    return this;
  }

  where(key, cond, value) {
    return this._where(key, cond, value);
  }

  whereNot(key, cond, value) {
    return this._where(key, cond, value, 'NOT');
  }

  whereNull(key) {
    return this._where(key, 'IS', 'null');
  }

  whereNotNull(key) {
    return this._where(key, 'IS', 'null', 'NOT');
  }

  whereIn(key, conds) {
    return this._where(key, 'IN', conds);
  }

  whereNotIn(key, conds) {
    return this._where(key, 'NOT IN', conds);
  }

  whereAny(key, value) {
    this.operations.where.push({
      key: this.escapeKey(key),
      cond: '= ANY',
      value,
    });
    return this;
  }

  whereExists(subquery) {
    this.operations.where.push({
      cond: 'EXISTS',
      value: subquery,
    });
    return this;
  }

  orderBy(field, dir = 'ASC') {
    this.operations.orderBy.push({
      field: this.escapeKey(field),
      dir: dir.toUpperCase(),
    });
    return this;
  }

  groupBy(...fields) {
    const groupBy = this.operations.groupBy;
    for (const f of fields) {
      groupBy.add(this.escapeKey(f));
    }
    return this;
  }

  limit(limit) {
    checkType(limit, 'limit', 'number');
    this.operations.limit = limit;
    return this;
  }

  offset(offset) {
    checkType(offset, 'offset', 'number');
    this.operations.offset = offset;
    return this;
  }

  count(field = '*') {
    if (field !== '*') field = this.escapeKey(field);
    this.operations.count.push({ field });
    return this;
  }

  avg(field) {
    this.operations.avg.push({ field: this.escapeKey(field) });
    return this;
  }

  min(field) {
    this.operations.min.push({ field: this.escapeKey(field) });
    return this;
  }

  max(field) {
    this.operations.max.push({ field: this.escapeKey(field) });
    return this;
  }

  sum(field) {
    this.operations.sum.push({ field: this.escapeKey(field) });
    return this;
  }

  processSelect(query, clauses) {
    if (clauses.size === 0) return query + ' *';
    return query + ' ' + joinIterable(clauses, ', ');
  }

  processOperations(query, operations, functionHandlers) {
    for (const fn of Object.keys(functionHandlers)) {
      const ops = operations[fn];
      if (ops.length === 0) continue;
      else if (query.endsWith(' *')) query = query.slice(0, -2);
      else query += ',';
      const handler = functionHandlers[fn];
      query += ops
        // eslint-disable-next-line no-loop-func
        .reduce((acc, op) => acc + handler(op, query) + ',', ' ')
        .slice(0, -1);
    }
    return query;
  }

  processWhere(query, clauses) {
    // TODO(lundibundi): support braces
    query += ' WHERE';
    for (let i = 0; i < clauses.length; ++i) {
      const clause = clauses[i];
      if (i !== 0) {
        if (clause.or) query += ' OR';
        else query += ' AND';
      }
      if (clause.mod) query += ` ${clause.mod}`;
      if (clause.key) query += ` ${clause.key}`;
      query +=
        ` ${clause.cond} ` +
        makeParamValue(clause.cond, clause.value, this.params);
    }
    return query;
  }

  processOrder(query, clauses) {
    const it = iter(clauses);
    const firstClause = it.next().value;
    query += ` ORDER BY ${firstClause.field} ${firstClause.dir}`;
    for (const order of it) {
      query += `, ${order.field} ${order.dir}`;
    }
    return query;
  }

  build() {
    let query = 'SELECT';

    if (this.operations.selectDistinct) query += ' DISTINCT';

    query = this.processSelect(query, this.operations.select);

    query = this.processOperations(query, this.operations, functionHandlers);

    const tableNames = this.operations.from;
    if (tableNames.size === 0) {
      throw new Error('Cannot generate SQL, tableName is not defined');
    }
    query += ' FROM ' + iter(tableNames).join(', ');

    this.operations.innerJoin.forEach(({ table, leftKey, rightKey }) => {
      query += ` INNER JOIN ${table} ON ${leftKey} = ${rightKey}`;
    });

    const whereClauses = this.operations.where;
    if (whereClauses.length > 0) {
      query = this.processWhere(query, whereClauses, this.params);
    }

    const groupClauses = this.operations.groupBy;
    if (groupClauses.size > 0) {
      query += ' GROUP BY ' + iter(groupClauses).join(', ');
    }

    const orderClauses = this.operations.orderBy;
    if (orderClauses.length > 0) {
      query = this.processOrder(query, orderClauses);
    }

    const limit = this.operations.limit;
    if (limit) {
      query += ` LIMIT ${makeParamValue(null, limit, this.params)}`;
    }

    const offset = this.operations.offset;
    if (offset) {
      query += ` OFFSET ${makeParamValue(null, offset, this.params)}`;
    }

    return query;
  }
}

module.exports = { SelectBuilder };
