'use strict';

const database = require('./lib/database.js');
const model = require('./lib/model-db.js');

require('./lib/model-pg.js');

module.exports = { ...database, ...model };
