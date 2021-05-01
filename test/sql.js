'use strict';

const metatests = require('metatests');
const { Database } = require('..');

const config = {
  host: '127.0.0.1',
  port: 5432,
  database: 'application',
  user: 'marcus',
  password: 'marcus',
  logger: { db: console.log, debug: () => {} },
};

const db = new Database(config);

metatests.test('Open database', async (test) => {
  test.strictEqual(db.constructor.name, 'Database');
  test.strictEqual(db.pool.constructor.name, 'BoundPool');
});

metatests.test('Database.query', async (test) => {
  const res = await db.query('SELECT * FROM "City" WHERE "cityId" = $1', [3]);
  test.strictEqual(res.constructor.name, 'Result');
  test.strictEqual(res.rows.constructor.name, 'Array');
  test.strictEqual(res.rows.length, 1);
  test.strictEqual(res.rows[0].name, 'Kiev');
});

metatests.test('Database.select', async (test) => {
  const res = await db.select('City', ['*'], { cityId: 3 });
  test.strictEqual(res.length, 1);
  test.strictEqual(res[0], { cityId: '3', name: 'Kiev', countryId: '1' });
});

metatests.test('Database.insert/update/delete', async (test) => {
  const res1 = await db.insert('City', { name: 'Odessa', countryId: 1 });
  test.strictEqual(res1.rowCount, 1);
  const res2 = await db.update('City', { name: 'ODESSA' }, { name: 'Odessa' });
  test.strictEqual(res2.rowCount, 1);
  const res3 = await db.delete('City', { name: 'ODESSA' });
  test.strictEqual(res3.rowCount, 1);
});

metatests.test('Database.row', async (test) => {
  const res = await db.row('City', ['*'], { name: 'Kiev' });
  test.strictEqual(res, { cityId: '3', name: 'Kiev', countryId: '1' });
});

metatests.test('Database.scalar', async (test) => {
  const res = await db.scalar('City', ['name'], { name: 'Kiev' });
  test.strictEqual(res, 'Kiev');
});

metatests.test('Database.col', async (test) => {
  const res = await db.col('City', ['name']);
  test.strictEqual(res.constructor.name, 'Array');
});

metatests.test('Database.dict', async (test) => {
  const res = await db.dict('City', ['name', 'countryId']);
  test.strictEqual(typeof res, 'object');
  const key = 'Kiev';
  test.strictEqual(res[key], '1');
});
