'use strict';

const fsp = require('node:fs').promises;
const path = require('node:path');
const metatests = require('metatests');
const metasql = require('..');

metatests.test('Create structure', async (test) => {
  const dir = process.cwd();
  const schemaPath = path.join(dir, 'node_modules/metadomain/schemas');
  try {
    await metasql.create(schemaPath, './');
    await fsp.unlink('./database.d.ts');
    const expect = await fsp.readFile('test/sql/expect.sql', 'utf8');
    const database = await fsp.readFile('./database.sql', 'utf8');
    test.strictEqual(database, expect);
    await fsp.unlink('./database.sql');
  } catch (err) {
    test.error(err);
  }
  test.end();
});
