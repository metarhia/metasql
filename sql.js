'use strict';

const database = require('./lib/database.js');
const model = require('./lib/model-db.js');
const schema = require('./lib/schema-fs.js');

require('./lib/model-pg.js');

module.exports = {
  ...database,
  ...model,
  ...schema,
};
