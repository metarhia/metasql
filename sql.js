'use strict';

const { QueryBuilder } = require('./lib/query-builder.js');
const { SelectBuilder } = require('./lib/select-builder.js');
const { RawBuilder } = require('./lib/raw-builder.js');
const { ParamsBuilder } = require('./lib/params-builder.js');
const { PostgresParamsBuilder } = require('./lib/pg-params-builder.js');
const model = require('./lib/model-db.js');
const schema = require('./lib/schema-fs.js');

require('./lib/model-pg.js');

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
  ...model,
  ...schema,
};
