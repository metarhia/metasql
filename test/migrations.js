'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const metasql = require('..');

test('Migrations: generate', async () => {
  const dir = process.cwd();
  const schemaPath = path.join(dir, 'node_modules/metadomain/schemas');
  try {
    await metasql.generate(schemaPath);
  } catch (err) {
    assert.fail(`Test failed with error: ${err.message}`);
  }
});
