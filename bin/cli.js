#!/usr/bin/env node
'use strict';

const path = require('path');
const metasql = require('..');

const [,, command, version] = process.argv;

if (command === 'g') {
  const schemaPath = path.join(__dirname, '../application/schemas');
  metasql.migrate(schemaPath);
} else if (command === 'm') {
  console.log(`Migrate to version ${version}`);
}
