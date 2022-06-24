'use strict';

const fsp = require('fs').promises;
const path = require('path');
const metatests = require('metatests');
const metasql = require('..');

metatests.test('Create structure', async (test) => {
  const dir = process.cwd();
  const schemaPath = path.join(dir, 'node_modules/metadomain/schemas');
  try {
    await metasql.create(schemaPath, 'test/sql');
    const expect = await fsp.readFile('test/sql/expect.sql', {
      encoding: 'utf8',
    });
    const database = await fsp.readFile('test/sql/database.sql', {
      encoding: 'utf8',
    });
    test.strictEqual(database, expect);
  } catch (err) {
    test.error(err);
  }
  test.end();
});
