#!/usr/bin/env node
'use strict';

const path = require('path');
const metasql = require('..');

const [,, command, version] = process.argv;

const dir = __dirname.includes('node_modules')
  ? process.cwd()
  : path.join(__dirname, '..');
const schemaPath = path.join(dir, 'application/schemas');

if (command === 'c') {
  metasql.create(schemaPath, schemaPath);
} else if (command === 'g') {
  metasql.generate(schemaPath);
} else if (command === 'm') {
  metasql.migrate(schemaPath, parseInt(version, 10));
}
