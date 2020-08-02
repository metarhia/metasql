'use strict';

const { iter } = require('@metarhia/common');

const { QueryBuilder } = require('./query-builder');
const { joinIterable, mapJoinIterable } = require('./utils');

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
      fns: [],
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
    this.operations.fns.push({ type: 'count', field });
    return this;
  }

  avg(field) {
    this.operations.fns.push({ type: 'avg', field: this.escapeKey(field) });
    return this;
  }

  min(field) {
    this.operations.fns.push({ type: 'min', field: this.escapeKey(field) });
    return this;
  }

  max(field) {
    this.operations.fns.push({ type: 'max', field: this.escapeKey(field) });
    return this;
  }

  sum(field) {
    this.operations.fns.push({ type: 'sum', field: this.escapeKey(field) });
    return this;
  }

  processSelectAndFns(select, fns) {
    if (select.size === 0 && fns.length === 0) return '*';
    const selects = joinIterable(select, ', ');
    if (fns.length === 0) return selects;
    const functions = mapJoinIterable(
      fns,
      op => functionHandlers[op.type](op),
      ', '
    );
    return selects === '' ? functions : selects + ', ' + functions;
  }

  processWhere(clauses) {
    // TODO(lundibundi): support braces
    let res = 'WHERE';
    for (let i = 0; i < clauses.length; ++i) {
      const clause = clauses[i];
      if (i !== 0) {
        if (clause.or) res += ' OR';
        else res += ' AND';
      }
      if (clause.mod) res += ` ${clause.mod}`;
      if (clause.key) res += ` ${clause.key}`;
      res +=
        ` ${clause.cond} ` +
        makeParamValue(clause.cond, clause.value, this.params);
    }
    return res;
  }

  processOrder(clauses) {
    return (
      'ORDER BY ' + mapJoinIterable(clauses, o => `${o.field} ${o.dir}`, ', ')
    );
  }

  build() {
    let query = 'SELECT';

    if (this.operations.selectDistinct) query += ' DISTINCT';

    const select = this.operations.select;
    const fns = this.operations.fns;
    query += ' ' + this.processSelectAndFns(select, fns);

    const tableNames = this.operations.from;
    if (tableNames.size === 0) {
      throw new Error('Cannot generate SQL, tableName is not defined');
    }
    query += ' FROM ' + joinIterable(tableNames, ', ');

    for (const { table, leftKey, rightKey } of this.operations.innerJoin) {
      query += ` INNER JOIN ${table} ON ${leftKey} = ${rightKey}`;
    }

    const whereClauses = this.operations.where;
    if (whereClauses.length > 0) {
      query += ' ' + this.processWhere(whereClauses, this.params);
    }

    const groupClauses = this.operations.groupBy;
    if (groupClauses.size > 0) {
      query += ' GROUP BY ' + iter(groupClauses).join(', ');
    }

    const orderClauses = this.operations.orderBy;
    if (orderClauses.length > 0) {
      query += ' ' + this.processOrder(orderClauses);
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
