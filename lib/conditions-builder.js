'use strict';

const { makeParamValue } = require('./query-builder');
const { mapJoinIterable } = require('./utils');
const { QueryBuilder } = require('./query-builder');

const allowedConditions = new Set([
  '=',
  '<>',
  '<',
  '<=',
  '>',
  '>=',
  'LIKE',
  'EXISTS',
  'IS',
  'IS DISTINCT',
  'IN',
  'NOT IN',
  'BETWEEN',
  'BETWEEN SYMMETRIC',
  'NOT BETWEEN',
  'NOT BETWEEN SYMMETRIC',
]);

const parseCondition = cond => {
  cond = cond.toUpperCase();
  if (cond === '!=') return '<>';
  if (!allowedConditions.has(cond)) {
    throw new Error(`The operator "${cond}" is not permitted`);
  }
  return cond;
};

const makeWhereValue = (cond, value, params) => {
  if (value instanceof QueryBuilder) {
    return '(' + value.build() + ')';
  } else if (cond === 'IN' || cond === 'NOT IN') {
    const conditions = mapJoinIterable(value, v => params.add(v), ', ');
    return '(' + conditions + ')';
  } else if (cond && cond.endsWith('ANY')) {
    return '(' + params.add(value) + ')';
  } else if (cond && cond.includes('BETWEEN')) {
    const startParam = makeParamValue(value[0], params);
    const endParam = makeParamValue(value[1], params);
    return `${startParam} AND ${endParam}`;
  } else {
    return params.add(value);
  }
};

const handleConditionsOrFn = (conditions, builder) => {
  if (typeof conditions === 'function') {
    // eslint-disable-next-line no-use-before-define
    return conditions(new ConditionsBuilder(builder.params, builder.options));
  } else if (conditions instanceof QueryBuilder) {
    return conditions;
  } else {
    throw new TypeError(
      `The 'conditions' must be a QueryBuilder or a function returning one`
    );
  }
};

const kCond = Symbol('kCond');

class ConditionsBuilder extends QueryBuilder {
  constructor(params, options) {
    super(params, options);
    this.clauses = [];
  }

  [kCond](key, cond, value, mod = '', or = false) {
    if (key) key = this.escapeKey(key);
    this.clauses.push({ key, value, cond, mod, or });
    return this;
  }

  and(key, cond, value) {
    if (
      typeof key !== 'string' &&
      typeof key !== 'function' &&
      !(key instanceof QueryBuilder)
    ) {
      throw new TypeError(`The 'key' must be a string key or a QueryBuilder ' +
         'or a function returning QueryBuilder`);
    }
    return typeof key !== 'string'
      ? this.andConds(key)
      : this[kCond](key, parseCondition(cond), value);
  }

  andConds(conditions) {
    return this[kCond]('', '', handleConditionsOrFn(conditions, this));
  }

  or(key, cond, value) {
    if (
      typeof key !== 'string' &&
      typeof key !== 'function' &&
      !(key instanceof QueryBuilder)
    ) {
      throw new TypeError(`The 'key' must be a string key or a QueryBuilder ' +
         'or a function returning QueryBuilder`);
    }
    return typeof key !== 'string'
      ? this.orConds(key)
      : this[kCond](key, parseCondition(cond), value, undefined, true);
  }

  orConds(conditions) {
    const conds = handleConditionsOrFn(conditions, this);
    return this[kCond]('', '', conds, '', true);
  }

  not(key, cond, value) {
    return this[kCond](key, cond, value, 'NOT');
  }

  orNot(key, cond, value) {
    return this[kCond](key, cond, value, 'NOT', true);
  }

  null(key) {
    return this[kCond](key, 'IS NULL');
  }

  orNull(key) {
    return this[kCond](key, 'IS NULL', undefined, '', true);
  }

  notNull(key) {
    return this[kCond](key, 'IS NOT NULL');
  }

  orNotNull(key) {
    return this[kCond](key, 'IS NOT NULL', undefined, '', true);
  }

  between(key, from, to, symmetric = false) {
    const cond = symmetric ? 'BETWEEN SYMMETRIC' : 'BETWEEN';
    return this[kCond](key, cond, [from, to]);
  }

  orBetween(key, from, to, symmetric = false) {
    const cond = symmetric ? 'BETWEEN SYMMETRIC' : 'BETWEEN';
    return this[kCond](key, cond, [from, to], '', true);
  }

  notBetween(key, from, to, symmetric = false) {
    const cond = symmetric ? 'NOT BETWEEN SYMMETRIC' : 'NOT BETWEEN';
    return this[kCond](key, cond, [from, to]);
  }

  orNotBetween(key, from, to, symmetric = false) {
    const cond = symmetric ? 'NOT BETWEEN SYMMETRIC' : 'NOT BETWEEN';
    return this[kCond](key, cond, [from, to], '', true);
  }

  in(key, conds) {
    return this[kCond](key, 'IN', conds);
  }

  orIn(key, conds) {
    return this[kCond](key, 'IN', conds, '', true);
  }

  notIn(key, conds) {
    return this[kCond](key, 'NOT IN', conds);
  }

  orNotIn(key, conds) {
    return this[kCond](key, 'NOT IN', conds, '', true);
  }

  any(key, value) {
    return this[kCond](key, '= ANY', value);
  }

  orAny(key, value) {
    return this[kCond](key, '= ANY', value, '', true);
  }

  exists(subquery) {
    return this[kCond]('', 'EXISTS', subquery);
  }

  orExists(subquery) {
    return this[kCond]('', 'EXISTS', subquery, '', true);
  }

  build() {
    const { clauses } = this;
    let res = '';
    for (let i = 0; i < clauses.length; ++i) {
      const clause = clauses[i];
      if (i !== 0) res += clause.or ? ' OR ' : ' AND ';
      if (clause.mod) res += `${clause.mod} `;
      if (clause.key) res += `${clause.key} `;
      if (clause.cond) res += clause.cond;
      if (clause.value !== undefined) {
        if (clause.cond) res += ' ';
        res += makeWhereValue(clause.cond, clause.value, this.params);
      }
    }
    return res;
  }
}

module.exports = {
  ConditionsBuilder,
};
