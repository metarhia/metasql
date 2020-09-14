#!/usr/bin/env node
'use strict';

const path = require('path');
const metasql = require('..');

const [,, arg] = process.argv;

if (arg === 'g') {
  const schemaPath = path.join(__dirname, '../application/schemas');
  metasql.migrate(schemaPath);
}
