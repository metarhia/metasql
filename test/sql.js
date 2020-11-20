'use strict';

const metatests = require('metatests');
const { Database } = require('..');

const config = {
  host: '127.0.0.1',
  port: 5432,
  database: 'application',
  user: 'marcus',
  password: 'marcus',
  logger: { db: console.log },
};

metatests.test('Database instance', async (test) => {
  const db = new Database(config);
  test.strictEqual(typeof db, 'object');
});
