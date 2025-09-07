'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const fsp = require('node:fs').promises;
const path = require('node:path');
const metasql = require('..');

test('Create structure', async () => {
  const dir = process.cwd();
  const schemaPath = path.join(dir, 'node_modules/metadomain/schemas');
  try {
    await metasql.create(schemaPath, './');
    await fsp.unlink('./database.d.ts');
    const expect = await fsp.readFile('test/sql/expect.sql', 'utf8');
    const database = await fsp.readFile('./database.sql', 'utf8');
    assert.strictEqual(database, expect);
    await fsp.unlink('./database.sql');
  } catch (err) {
    assert.fail(`Test failed with error: ${err.message}`);
  }
});
