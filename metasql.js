'use strict';

const database = require('./lib/database.js');
const dbms = require('./lib/dbms.js');
const crud = require('./lib/plugins/crud.js');

require('./lib/pg.js');

module.exports = { ...database, ...dbms, plugins: { crud } };
