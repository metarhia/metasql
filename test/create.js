'use strict';

const path = require('path');
const metatests = require('metatests');
const metasql = require('..');

metatests.test('Create structure', async (test) => {
  const schemaPath = path.join(process.cwd(), 'application/schemas');
  try {
    await metasql.create(schemaPath);
  } catch (err) {
    test.error(err);
  }
  test.end();
});
