'use strict';

const database = require('./lib/database.js');
const dbms = require('./lib/dbms.js');

require('./lib/pg.js');

module.exports = { ...database, ...dbms };
