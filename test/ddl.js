'use strict';

const path = require('path');
const { generate, migrate } = require('..');

const cwd = process.cwd();
const schemaPath = path.join(cwd, 'application/schemas');
const outputPath = path.join(cwd, 'application/schemas/.migrations');

generate(schemaPath, outputPath);
migrate(schemaPath);
