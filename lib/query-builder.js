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
  constructor(params, { escapeIdentifier = defaultEscapeIdentifier } = {}) {
    this.params = params;
    this.escapeIdentifier = escapeIdentifier;
    this.escapeKey = key => escapeKey(key, this.escapeIdentifier);
  }

  // Generic building method that must return the resulting SQL
  // Returns: <string>
  build() {
    throw new Error('Not implemented');
  }
}

module.exports = { QueryBuilder };
