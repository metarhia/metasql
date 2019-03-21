'use strict';

// Base class for all ParamsBuilders
class ParamsBuilder {
  // Add passed value to parameters
  //   value <any>
  //   options <Object> optional
  // Returns: <string> name to put in an sql query
  add() {
    throw new Error('Not implemented');
  }

  // Generic building method that must return the parameters object
  // Returns: <any>
  build() {
    throw new Error('Not implemented');
  }
}

module.exports = { ParamsBuilder };
