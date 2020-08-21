'use strict';

const {
  escapeIdentifier: defaultEscapeIdentifier,
  escapeKey,
} = require('./utils');

// Base class for all QueryBuilders
class QueryBuilder {
  //   params <ParamsBuilder>
  //   options <Object>
  //     escapeIdentifier <Function>
  //       identifier <string> to escape
  //     Returns: <string> escaped string
  constructor(params, options = {}) {
    this.params = params;
    this.options = options;
    this.escapeIdentifier = options.escapeIdentifier || defaultEscapeIdentifier;
    this.escapeKey = key => escapeKey(key, this.escapeIdentifier);
  }

  // Generic building method that must return the resulting SQL
  // Returns: <string>
  build() {
    throw new Error('Not implemented');
  }
}

const makeParamValue = (value, params) =>
  value instanceof QueryBuilder ? '(' + value.build() + ')' : params.add(value);

module.exports = { QueryBuilder, makeParamValue };
