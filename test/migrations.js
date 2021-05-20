'use strict';

const path = require('path');
const metatests = require('metatests');
const metasql = require('..');

metatests.test('Migrations: generate', async (test) => {
  const dir = process.cwd();
  const schemaPath = path.join(dir, 'node_modules/metadomain/schemas');
  try {
    await metasql.generate(schemaPath);
  } catch (err) {
    test.error(err);
  }
  test.end();
});
