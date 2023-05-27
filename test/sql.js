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

  metatests.test('Database.query error', async (test) => {
    try {
      await db.query('INVALID SQL');
      test.fail('Invalid query should throw an error');
    } catch (error) {
      test.assert(
        error.stack.includes('test/sql.js'),
        'Error stack should have query invocation file in it',
      );
      test.assert(error.dbStack, 'Original error stack should be preserved');
    } finally {
      test.end();
    }
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
    const res4 = await db.select('City', { cityId: '3', name: undefined });
    test.strictEqual(res4[0], { cityId: '3', name: 'Kiev', countryId: '1' });
    const res5 = await db.select('Country', { name: '@@Soviet | China' });
    test.strictEqual(res5.length, 2);
    const res6 = await db.select('Country', { name: '@@People & China' });
    test.strictEqual(res6[0], {
      countryId: '2',
      name: "People's Republic of China",
    });
    test.end();
  });

  metatests.test('Database.select.then', async (test) => {
    await db
      .select('City', ['*'], { cityId: 3 })
      .then((cities) => cities[0])
      .then((city) => {
        test.pass('Sequential then is called properly');
        test.strictEqual(city, { cityId: '3', name: 'Kiev', countryId: '1' });
      });

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

  metatests.test('Query.toString', async (test) => {
    const query1 = db.select('City', ['*'], { name: 'Kiev' });
    const sql1 = query1.toString();
    const expected1 = 'SELECT * FROM "City" WHERE "name" = "Kiev"';
    test.strictEqual(sql1, expected1);

    const query2 = db.insert('City', { name: 'Odessa', countryId: 1 });
    const sql2 = query2.toString();
    const expected2 =
      'INSERT ' +
      'INTO "City" ("name", "countryId") ' +
      'VALUES ("Odessa", "1")';
    test.strictEqual(sql2, expected2);

    test.end();
  });

  metatests.test(
    'Database.insert/update/delete: Normal and falsy values',
    async (test) => {
      const res1 = await db
        .insert('City', { name: 'Odessa', countryId: 1 })
        .returning('cityId');
      test.strictEqual(res1.rowCount, 1);
      test.strictEqual(parseInt(res1.rows[0].cityId) > 1, true);

      const res2 = await db
        .update(
          'City',
          { name: 'ODESSA', countryId: undefined },
          { name: 'Odessa', cityId: undefined },
        )
        .returning(['cityId']);
      test.strictEqual(res2.rowCount, 1);

      const res3 = await db.select('City', { name: 'ODESSA' });
      test.contains(res3[0], { name: 'ODESSA', countryId: '1' });

      const res4 = await db.delete('City', { name: 'ODESSA' }).returning('*');
      test.strictEqual(res4.rowCount, 1);

      const res5 = await db
        .update('City', { name: null }, { name: 'ODESSA' })
        .returning('cityId');
      test.strictEqual(res5.rowCount, 0);

      const {
        rows: [{ cityId }],
      } = await db
        .insert('City', { name: 'Kharkiv', countryId: 1 })
        .returning('cityId');

      const {
        rows: [{ name }],
      } = await db.update('City', { name: '' }, { cityId }).returning(['name']);

      test.strictEqual(name, '');

      await db.delete('City', { cityId }).returning('*');
      test.end();
    },
  );

  metatests.test('Database.insert into registry', async (test) => {
    const res1 = await db
      .insert('Division', { name: 'Quality control' })
      .returning('id');
    test.strictEqual(typeof res1.rows[0].id, 'string');
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

  metatests.test('Database.count', async (test) => {
    const res1 = await db.count('Country');
    test.strictEqual(res1, 4);
    const res2 = await db.count('City', { name: 'Kiev' });
    test.strictEqual(res2, 1);
    test.end();
  });

  metatests.test(
    'Database.update/select/delete with 0 integer',
    async (test) => {
      const {
        rows: [{ counterId }],
      } = await db.insert('Counter', { value: 1 }).returning('counterId');

      const {
        rows: [{ value }],
      } = await db
        .update('Counter', { value: 0 }, { counterId })
        .returning('value');
      test.strictEqual(value, '0');

      const [res] = await db.select('Counter', ['value'], { counterId });
      test.strictEqual(res.value, value);

      await db.delete('Counter', { counterId });
      test.end();
    },
  );
})();
