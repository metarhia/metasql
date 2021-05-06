'use strict';

const path = require('path');
const metatests = require('metatests');
const metasql = require('..');

metatests.test('Migrations: generate', async (test) => {
  const schemaPath = path.join(process.cwd(), 'application/schemas');
  try {
    await metasql.generate(schemaPath);
  } catch (err) {
    test.error(err);
  }
  test.end();
});
