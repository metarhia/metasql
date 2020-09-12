'use strict';

const path = require('path');
const { generate, migrate } = require('..');

const cwd = process.cwd();
const schemaPath = path.join(cwd, 'test/schema');
const outputPath = path.join(cwd, 'test/sql');

generate(schemaPath, outputPath);
migrate(schemaPath);
