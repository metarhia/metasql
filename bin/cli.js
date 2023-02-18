#!/usr/bin/env node
'use strict';

const path = require('node:path');
const metasql = require('..');

const [, , command, version] = process.argv;

const schemaPath = __dirname.includes('node_modules')
  ? path.join(process.cwd(), 'application/schemas')
  : path.join(__dirname, '../node_modules/metadomain/schemas');

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
