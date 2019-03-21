'use strict';

const { ParamsBuilder } = require('./params-builder');

class PostgresParamsBuilder extends ParamsBuilder {
  constructor() {
    super();
    this.params = [];
  }

  // Add passed value to parameters
  //   value <any>
  //   options <Object> optional
  // Returns: <string> name to put in a sql query
  add(value) {
    this.params.push(value);
    return `$${this.params.length}`;
  }

  // Generic building method that must return the parameters object
  // Returns: <any>
  build() {
    return this.params;
  }
}

module.exports = { PostgresParamsBuilder };
