#!/usr/bin/env node
'use strict';

const path = require('path');
const metasql = require('..');

const [,, command, version] = process.argv;

const schemaPath = path.join(__dirname, '../application/schemas');

if (command === 'c') {
  metasql.create(schemaPath, schemaPath);
} else if (command === 'g') {
  metasql.generate(schemaPath);
} else if (command === 'm') {
  metasql.migrate(schemaPath, parseInt(version, 10));
}
