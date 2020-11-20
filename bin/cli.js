#!/usr/bin/env node
'use strict';

const path = require('path');
const metasql = require('..');

const [, , command, version] = process.argv;

const dir = __dirname.includes('node_modules')
  ? process.cwd()
  : path.join(__dirname, '..');
const schemaPath = path.join(dir, 'application/schemas');

if (command === 'c') {
  metasql.create(schemaPath, schemaPath);
} else if (command === 'g') {
  metasql.generate(schemaPath);
} else if (command === 'm') {
  const v = version ? parseInt(version, 10) : undefined;
  metasql.migrate(schemaPath, v);
} else {
  console.log('Commands for metasql:');
  console.log('  metasql c             Create database schema');
  console.log('  metasql g             Generate migration');
  console.log('  metasql m             Migrate to the latest version');
  console.log('  metasql m [version]   Migrate to the specified version');
}
