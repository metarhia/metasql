'use strict';

const { iter } = require('@metarhia/common');

const { QueryBuilder, makeParamValue } = require('./query-builder');
const { ConditionsBuilder } = require('./conditions-builder');
const { mapJoinIterable } = require('./utils');

const functionHandlers = {
  count: op => `count(${op.field})`,
  avg: op => `avg(${op.field})`,
  min: op => `min(${op.field})`,
  max: op => `max(${op.field})`,
  sum: op => `sum(${op.field})`,
};

const checkTypeOrQuery = (value, name, type) => {
  if (!(value instanceof QueryBuilder) && typeof value !== type) {
    throw new TypeError(
      `Invalid '${name}' value type, expected type ${type} or QueryBuilder. ` +
        `Received: ${value}`
    );
  }
};

class SelectBuilder extends QueryBuilder {
  constructor(params, options) {
    super(params, options);
    this.whereConditions = new ConditionsBuilder(params, options);
    this.operations = {
      select: new Set(),
      selectDistinct: false,
      innerJoin: [],
      groupBy: new Set(),
      orderBy: [],
      from: new Set(),
      limit: null,
      offset: null,
    };
  }

  from(tableName, alias) {
    const { from } = this.operations;
    const table = this.escapeIdentifier(tableName);
    if (!alias) {
      from.add(table);
    } else {
      from.add({ table, alias: this.escapeKey(alias) });
    }
    return this;
  }

  select(...fields) {
    const select = this.operations.select;
    for (const f of fields) {
      select.add(this.escapeKey(f));
    }
    return this;
  }

  selectAs(field, alias) {
    return this._addSelectClause(undefined, field, alias);
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

  where(key, cond, value) {
    this.whereConditions.and(key, cond, handleSubQueryOrFn(value, this));
    return this;
  }

  orWhere(key, cond, value) {
    this.whereConditions.or(key, cond, handleSubQueryOrFn(value, this));
    return this;
  }

  whereNot(key, cond, value) {
    this.whereConditions.not(key, cond, handleSubQueryOrFn(value, this));
    return this;
  }

  orWhereNot(key, cond, value) {
    this.whereConditions.orNot(key, cond, handleSubQueryOrFn(value, this));
    return this;
  }

  whereNull(key) {
    this.whereConditions.null(key);
    return this;
  }

  orWhereNull(key) {
    this.whereConditions.orNull(key);
    return this;
  }

  whereNotNull(key) {
    this.whereConditions.notNull(key);
    return this;
  }

  orWhereNotNull(key) {
    this.whereConditions.orNotNull(key);
    return this;
  }

  whereBetween(key, from, to, symmetric) {
    this.whereConditions.between(
      key,
      handleSubQueryOrFn(from, this),
      handleSubQueryOrFn(to, this),
      symmetric
    );
    return this;
  }

  orWhereBetween(key, from, to, symmetric) {
    this.whereConditions.orBetween(
      key,
      handleSubQueryOrFn(from, this),
      handleSubQueryOrFn(to, this),
      symmetric
    );
    return this;
  }

  whereNotBetween(key, from, to, symmetric) {
    this.whereConditions.notBetween(
      key,
      handleSubQueryOrFn(from, this),
      handleSubQueryOrFn(to, this),
      symmetric
    );
    return this;
  }

  orWhereNotBetween(key, from, to, symmetric) {
    this.whereConditions.orNotBetween(
      key,
      handleSubQueryOrFn(from, this),
      handleSubQueryOrFn(to, this),
      symmetric
    );
    return this;
  }

  whereIn(key, conds) {
    this.whereConditions.in(key, handleSubQueryOrFn(conds, this));
    return this;
  }

  orWhereIn(key, conds) {
    this.whereConditions.orIn(key, handleSubQueryOrFn(conds, this));
    return this;
  }

  whereNotIn(key, conds) {
    this.whereConditions.notIn(key, handleSubQueryOrFn(conds, this));
    return this;
  }

  orWhereNotIn(key, conds) {
    this.whereConditions.orNotIn(key, handleSubQueryOrFn(conds, this));
    return this;
  }

  whereAny(key, value) {
    this.whereConditions.any(key, handleSubQueryOrFn(value, this));
    return this;
  }

  orWhereAny(key, value) {
    this.whereConditions.orAny(key, handleSubQueryOrFn(value, this));
    return this;
  }

  whereExists(subquery) {
    this.whereConditions.exists(handleSubQueryOrFn(subquery, this));
    return this;
  }

  orWhereExists(subquery) {
    this.whereConditions.orExists(handleSubQueryOrFn(subquery, this));
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
    checkTypeOrQuery(limit, 'limit', 'number');
    this.operations.limit = limit;
    return this;
  }

  offset(offset) {
    checkTypeOrQuery(offset, 'offset', 'number');
    this.operations.offset = offset;
    return this;
  }

  _addSelectClause(type, field, alias) {
    if (alias) alias = this.escapeKey(alias);
    this.operations.select.add({
      type,
      field: this.escapeKey(field),
      alias,
    });
    return this;
  }

  count(field = '*', alias) {
    return this._addSelectClause('count', field, alias);
  }

  avg(field, alias) {
    return this._addSelectClause('avg', field, alias);
  }

  min(field, alias) {
    return this._addSelectClause('min', field, alias);
  }

  max(field, alias) {
    return this._addSelectClause('max', field, alias);
  }

  sum(field, alias) {
    return this._addSelectClause('sum', field, alias);
  }

  processFrom(from) {
    return mapJoinIterable(
      from,
      f => (typeof f === 'string' ? f : `${f.table} AS ${f.alias}`),
      ', '
    );
  }

  processSelect(select) {
    if (select.size === 0) return '*';
    return mapJoinIterable(
      select,
      op => {
        if (typeof op === 'string') return op;
        let clause =
          op.type === undefined ? op.field : functionHandlers[op.type](op);
        if (op.alias) clause += ` AS ${op.alias}`;
        return clause;
      },
      ', '
    );
  }

  processOrder(clauses) {
    return mapJoinIterable(clauses, o => `${o.field} ${o.dir}`, ', ');
  }

  build() {
    let query = 'SELECT';

    if (this.operations.selectDistinct) query += ' DISTINCT';

    query += ' ' + this.processSelect(this.operations.select);

    const tableNames = this.operations.from;
    if (tableNames.size === 0) {
      throw new Error('Cannot generate SQL, tableName is not defined');
    }
    query += ' FROM ' + this.processFrom(tableNames);

    for (const { table, leftKey, rightKey } of this.operations.innerJoin) {
      query += ` INNER JOIN ${table} ON ${leftKey} = ${rightKey}`;
    }

    const whereClauses = this.whereConditions.build();
    if (whereClauses.length > 0) {
      query += ' WHERE ' + whereClauses;
    }

    const groupClauses = this.operations.groupBy;
    if (groupClauses.size > 0) {
      query += ' GROUP BY ' + iter(groupClauses).join(', ');
    }

    const orderClauses = this.operations.orderBy;
    if (orderClauses.length > 0) {
      query += ' ORDER BY ' + this.processOrder(orderClauses);
    }

    const limit = this.operations.limit;
    if (limit) {
      query += ` LIMIT ${makeParamValue(limit, this.params)}`;
    }

    const offset = this.operations.offset;
    if (offset) {
      query += ` OFFSET ${makeParamValue(offset, this.params)}`;
    }

    return query;
  }
}

function handleSubQueryOrFn(subquery, builder) {
  return typeof subquery === 'function'
    ? subquery(new SelectBuilder(builder.params, builder.options))
    : subquery;
}

module.exports = { SelectBuilder };
