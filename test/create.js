'use strict';

const path = require('path');
const metatests = require('metatests');
const metasql = require('..');

metatests.test('Create structure', async (test) => {
  const dir = process.cwd();
  const schemaPath = path.join(dir, 'node_modules/matadomain/schemas');
  try {
    await metasql.create(schemaPath);
  } catch (err) {
    test.error(err);
  }
  test.end();
});
