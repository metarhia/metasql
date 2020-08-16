'use strict';

const { QueryBuilder } = require('./lib/query-builder');
const { SelectBuilder } = require('./lib/select-builder');
const { RawBuilder } = require('./lib/raw-builder');
const { ParamsBuilder } = require('./lib/params-builder');
const { PostgresParamsBuilder } = require('./lib/pg-params-builder');

const pg = handler => {
  const params = new PostgresParamsBuilder();
  const builder = new SelectBuilder(params);
  if (handler) handler(builder, params);
  return { builder, params };
};

module.exports = {
  QueryBuilder,
  SelectBuilder,
  RawBuilder,
  ParamsBuilder,
  PostgresParamsBuilder,
  pg,
};
