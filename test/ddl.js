'use strict';

const path = require('path');
const { generate } = require('../lib/ddl.js');

const cwd = process.cwd();
const schemaPath = path.join(cwd, 'test/schema');
const outputPath = path.join(cwd, 'test/sql');

generate(schemaPath, outputPath);
