'use strict';

const metatests = require('metatests');
const { Database, Query } = require('..');
const metadomain = require('metadomain');

(async () => {
  const model = await metadomain.load();

  const options = {
    host: process.env.POSTGRES_HOST || '127.0.0.1',
    port: 5432,
    database: 'metasql',
    user: 'marcus',
    password: 'marcus',
    console: { debug: () => {} },
    model,
  };

  const db = new Database(options);

  metatests.test('Open database', async (test) => {
    test.strictEqual(db.constructor.name, 'Database');
    test.strictEqual(db.pool.constructor.name, 'BoundPool');
    test.end();
  });

  metatests.test('Database.query', async (test) => {
    const res = await db.query('SELECT * FROM "City" WHERE "cityId" = $1', [3]);
    test.strictEqual(res.constructor.name, 'Result');
    test.strictEqual(res.rows.constructor.name, 'Array');
    test.strictEqual(res.rows.length, 1);
    test.strictEqual(res.rows[0].name, 'Kiev');
    test.end();
  });

  metatests.test('Database.select', async (test) => {
    const res1 = await db.select('City', ['*'], { cityId: 3 });
    test.strictEqual(res1.length, 1);
    test.strictEqual(res1[0], { cityId: '3', name: 'Kiev', countryId: '1' });
    const res2 = await db.select('City', { cityId: 3 });
    test.strictEqual(res2.length, 1);
    test.strictEqual(res2[0], { cityId: '3', name: 'Kiev', countryId: '1' });
    const res3 = await db.select('City');
    const { cityId, name } = res3[0];
    test.strictEqual(cityId, '1');
    test.strictEqual(name, 'Beijing');
    test.end();
  });

  metatests.test('Database.select and/or', async (test) => {
    const res = await db.select('City', ['*'], { cityId: 1 }, { name: 'Kiev' });
    test.strictEqual(res.length, 2);
    test.strictEqual(res[0], { cityId: '1', name: 'Beijing', countryId: '2' });
    test.strictEqual(res[1], { cityId: '3', name: 'Kiev', countryId: '1' });
    test.end();
  });

  metatests.test('Query.limit/offset', async (test) => {
    const res1 = await db.select('City').limit(3);
    test.strictEqual(res1.length, 3);
    test.strictEqual(res1[0].name, 'Beijing');
    const res2 = await db.select('City').offset(2).limit(4);
    test.strictEqual(res2.length, 4);
    test.strictEqual(res2[0].name, 'Kiev');
    const res3 = await db.select('City').limit(4).offset(1);
    test.strictEqual(res3.length, 4);
    test.strictEqual(res3[0].name, 'Wuhan');
    test.end();
  });

  metatests.test('Query.order/desc', async (test) => {
    const res1 = await db.select('City').order('name');
    test.strictEqual(res1[0].name, 'Beijing');
    const res2 = await db.select('City').desc('name');
    test.strictEqual(res2[0].name, 'Wuhan');
    const res3 = await db.select('City').order('name').desc('name');
    test.strictEqual(res3[0].name, 'Wuhan');
    const res4 = await db.select('City').desc('name').order('name');
    test.strictEqual(res4[0].name, 'Beijing');
    test.end();
  });

  metatests.test('Query.toObject/from', async (test) => {
    const query1 = db
      .select('City', ['*'], { cityId: 1 }, { name: 'Kiev' })
      .limit(3)
      .offset(1)
      .order('name');
    const metadata = query1.toObject();
    const expected = {
      table: 'City',
      fields: ['*'],
      where: [{ cityId: 1 }, { name: 'Kiev' }],
      options: { limit: 3, offset: 1, order: ['name'] },
    };
    test.strictEqual(metadata, expected);
    const res = await Query.from(db, metadata);
    test.strictEqual(res, [{ cityId: '3', name: 'Kiev', countryId: '1' }]);
    test.end();
  });

  metatests.test('Database.insert/update/delete', async (test) => {
    const res1 = await db.insert('City', { name: 'Odessa', countryId: 1 });
    test.strictEqual(res1.rowCount, 1);
    const res2 = await db.update(
      'City',
      { name: 'ODESSA' },
      { name: 'Odessa' }
    );
    test.strictEqual(res2.rowCount, 1);
    const res3 = await db.delete('City', { name: 'ODESSA' });
    test.strictEqual(res3.rowCount, 1);
    test.end();
  });

  metatests.test('Database.insert into registry', async (test) => {
    const res1 = await db.insert('Unit', { name: 'Quality control' });
    test.strictEqual(typeof res1.rows[0].lastval, 'string');
    test.strictEqual(res1.rowCount, 1);
    test.end();
  });

  metatests.test('Database.row', async (test) => {
    const res = await db.row('City', ['*'], { name: 'Kiev' });
    test.strictEqual(res, { cityId: '3', name: 'Kiev', countryId: '1' });
    test.end();
  });

  metatests.test('Database.scalar', async (test) => {
    const res = await db.scalar('City', ['name'], { name: 'Kiev' });
    test.strictEqual(res, 'Kiev');
    test.end();
  });

  metatests.test('Database.col', async (test) => {
    const res = await db.col('City', ['name']);
    test.strictEqual(res.constructor.name, 'Array');
    test.end();
  });

  metatests.test('Database.dict', async (test) => {
    const res = await db.dict('City', ['name', 'countryId']);
    test.strictEqual(typeof res, 'object');
    const key = 'Kiev';
    test.strictEqual(res[key], '1');
    test.end();
  });
})();
