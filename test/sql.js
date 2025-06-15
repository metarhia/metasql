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

  metatests.test('open database', async (test) => {
    test.strictEqual(db.constructor.name, 'Database');
    test.strictEqual(db.pool.constructor.name, 'BoundPool');
    test.end();
  });

  metatests.test('database.query', async (test) => {
    const res = await db.query('SELECT * FROM "City" WHERE "cityId" = $1', [1]);
    test.strictEqual(res.constructor.name, 'Result');
    test.strictEqual(res.rows.constructor.name, 'Array');
    test.strictEqual(res.rows.length, 1);
    test.strictEqual(res.rows[0].name, 'Paris');
    test.end();
  });

  metatests.test('database.sql', async (test) => {
    const id = 1;

    const query1 = db.sql`
      SELECT * FROM "City"
      WHERE "cityId" = ${id}
    `;
    const res1 = await query1.rows();
    test.strictEqual(res1.constructor.name, 'Array');
    test.strictEqual(res1.length, 1);
    test.strictEqual(res1[0], { cityId: '1', name: 'Paris', countryId: '1' });

    const query2 = db.sql`
      SELECT * FROM "City"
      WHERE "cityId" = ${'id'}
    `;
    const res2 = await query2.row({ id });
    test.strictEqual(res2, { cityId: '1', name: 'Paris', countryId: '1' });

    const query3 = db.sql`
      SELECT name FROM "City"
      WHERE "cityId" = ${id}
    `;
    const res3 = await query3.scalar();
    test.strictEqual(res3, 'Paris');

    const query4 = db.sql`
      SELECT name FROM "City"
      WHERE "cityId" > ${5} AND "cityId" < ${10}
      ORDER BY name
    `;
    const res4 = await query4.col('name');
    test.strictEqual(res4, ['Cairo', 'Kiev', 'Kufa', 'Leningrad']);

    const query5 = db.sql`
      SELECT count(*) FROM "City"
      WHERE "cityId" > ${5} AND "cityId" < ${10}
    `;
    const res5 = await query5.count();
    test.strictEqual(res5, 4);

    const query6 = db.sql`
      SELECT * FROM "City"
      WHERE "cityId" < ${5} AND "name" <> 'La Haye-en-Touraine'
      ORDER BY name
      LIMIT 3
    `;
    const res6 = await query6.dict('name', 'cityId');
    test.strictEqual(
      { ...res6 },
      {
        Alexandria: '3',
        Athens: '4',
        Paris: '1',
      },
    );

    test.end();
  });

  metatests.test('database.query error', async (test) => {
    try {
      await db.query('INVALID SQL');
      test.fail('Invalid query should throw an error');
    } catch (error) {
      const msg = 'Error stack should have query invocation file in it';
      test.assert(error.stack.includes('test/sql.js'), msg);
      test.assert(error.dbStack, 'Original error stack should be preserved');
    } finally {
      test.end();
    }
  });

  metatests.test('database.select', async (test) => {
    const res1 = await db.select('City', ['*'], { cityId: 1 });
    test.strictEqual(res1.length, 1);
    test.strictEqual(res1[0], { cityId: '1', name: 'Paris', countryId: '1' });
    const res2 = await db.select('City', { cityId: 1 });
    test.strictEqual(res2.length, 1);
    test.strictEqual(res2[0], { cityId: '1', name: 'Paris', countryId: '1' });
    const res3 = await db.select('City');
    const { cityId, name } = res3[0];
    test.strictEqual(cityId, '1');
    test.strictEqual(name, 'Paris');
    const res4 = await db.select('City', { cityId: '1', name: undefined });
    test.strictEqual(res4[0], { cityId: '1', name: 'Paris', countryId: '1' });
    test.end();
  });

  metatests.test('database.select.then', async (test) => {
    await db
      .select('City', ['*'], { cityId: 1 })
      .then((cities) => cities[0])
      .then((city) => {
        test.pass('Sequential then is called properly');
        test.strictEqual(city, { cityId: '1', name: 'Paris', countryId: '1' });
      });

    test.end();
  });

  metatests.test('database.select and/or', async (test) => {
    const res = await db.select('City', ['*'], { cityId: 1 }, { name: 'Kiev' });
    test.strictEqual(res.length, 2);
    test.strictEqual(res[0], { cityId: '1', name: 'Paris', countryId: '1' });
    test.strictEqual(res[1], { cityId: '8', name: 'Kiev', countryId: '4' });
    test.end();
  });

  metatests.test('database.select in []', async (test) => {
    const res = await db.select('City', ['*'], { cityId: [1, 8] });
    test.strictEqual(res.length, 2);
    test.strictEqual(res[0], { cityId: '1', name: 'Paris', countryId: '1' });
    test.strictEqual(res[1], { cityId: '8', name: 'Kiev', countryId: '4' });
    test.end();
  });

  metatests.test('query.limit/offset', async (test) => {
    const res1 = await db.select('City').limit(3);
    test.strictEqual(res1.length, 3);
    test.strictEqual(res1[0].name, 'Paris');
    const res2 = await db.select('City').offset(2).limit(4);
    test.strictEqual(res2.length, 4);
    test.strictEqual(res2[0].name, 'Alexandria');
    const res3 = await db.select('City').limit(4).offset(1);
    test.strictEqual(res3.length, 4);
    test.strictEqual(res3[0].name, 'La Haye-en-Touraine');
    test.end();
  });

  metatests.test('query.order/desc', async (test) => {
    const res1 = await db.select('City').order('name');
    test.strictEqual(res1[0].name, 'Alexandria');
    const res2 = await db.select('City').desc('name');
    test.strictEqual(res2[0].name, 'Wuhan');
    const res3 = await db.select('City').order('name').desc('name');
    test.strictEqual(res3[0].name, 'Wuhan');
    const res4 = await db.select('City').desc('name').order('name');
    test.strictEqual(res4[0].name, 'Alexandria');
    test.end();
  });

  metatests.test('query.toObject/from', async (test) => {
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
    test.strictEqual(res, [{ cityId: '1', name: 'Paris', countryId: '1' }]);
    test.end();
  });

  metatests.test('query.toString', async (test) => {
    const query1 = db.select('City', ['*'], { name: 'Paris' });
    const sql1 = query1.toString();
    const expected1 = 'SELECT * FROM "City" WHERE "name" = "Paris"';
    test.strictEqual(sql1, expected1);

    const query2 = db.insert('City', { name: 'Odessa', countryId: 4 });
    const sql2 = query2.toString();
    const expected2 =
      'INSERT ' +
      'INTO "City" ("name", "countryId") ' +
      'VALUES ("Odessa", "4") ' +
      'RETURNING *';
    test.strictEqual(sql2, expected2);

    test.end();
  });

  metatests.test('insert/update/delete: normal and falsy', async (test) => {
    const res1 = await db
      .insert('City', { name: 'Odessa', countryId: 4 })
      .returning('cityId');
    test.strictEqual(res1.length, 1);
    test.strictEqual(parseInt(res1[0].cityId) > 1, true);

    const res2 = await db
      .update(
        'City',
        { name: 'ODESSA', countryId: undefined },
        { name: 'Odessa', cityId: undefined },
      )
      .returning(['cityId']);
    test.strictEqual(res2.length, 1);

    const res3 = await db.select('City', { name: 'ODESSA' });
    test.contains(res3[0], { name: 'ODESSA', countryId: '4' });

    const res4 = await db.delete('City', { name: 'ODESSA' }).returning('*');
    test.strictEqual(res4.length, 1);

    const res5 = await db
      .update('City', { name: null }, { name: 'ODESSA' })
      .returning('cityId');
    test.strictEqual(res5.length, 0);

    const [{ cityId }] = await db
      .insert('City', { name: 'Mediolanum', countryId: 6 })
      .returning('cityId');

    await db.update('City', { name: 'Milano' }, { cityId }).returning(['name']);

    await db.delete('City', { cityId }).returning('*');
    test.end();
  });

  metatests.test('insert/update/delete: auto-returning', async (test) => {
    const res1 = await db.insert('City', { name: 'Toulouse', countryId: 1 });
    test.strictEqual(res1.length, 1);
    test.strictEqual(parseInt(res1[0].cityId) > 1, true);

    const res2 = await db.update(
      'City',
      { name: 'TOULOUSE', countryId: undefined },
      { name: 'Toulouse', cityId: undefined },
    );
    test.strictEqual(res2.length, 1);

    const res3 = await db.select('City', { name: 'TOULOUSE' });
    test.contains(res3[0], { name: 'TOULOUSE', countryId: '1' });

    const res4 = await db.delete('City', { name: 'TOULOUSE' }).returning('*');
    test.strictEqual(res4.length, 1);

    const res5 = await db.update('City', { name: null }, { name: 'TOULOUSE' });
    test.strictEqual(res5.length, 0);

    const [{ cityId }] = await db.insert('City', {
      name: 'Mediolanum',
      countryId: 6,
    });

    const res7 = await db
      .update('City', { name: '' }, { cityId })
      .returning(['name']);
    test.strictEqual(res7[0].name, '');

    await db.delete('City', { cityId }).returning('*');
    test.end();
  });

  metatests.test('database.insert into registry', async (test) => {
    const res1 = await db
      .insert('Division', { name: 'Quality control' })
      .returning('id');
    test.strictEqual(typeof res1[0].id, 'string');
    test.strictEqual(res1.length, 1);
    test.end();
  });

  metatests.test('database.row', async (test) => {
    const res = await db.row('City', ['*'], { name: 'Paris' });
    test.strictEqual(res, { cityId: '1', name: 'Paris', countryId: '1' });
    test.end();
  });

  metatests.test('database.scalar', async (test) => {
    const res = await db.scalar('City', ['name'], { name: 'Paris' });
    test.strictEqual(res, 'Paris');
    test.end();
  });

  metatests.test('database.col', async (test) => {
    const res = await db.col('City', ['name']);
    test.strictEqual(res.constructor.name, 'Array');
    test.end();
  });

  metatests.test('database.dict', async (test) => {
    const res = await db.dict('City', ['name', 'countryId']);
    test.strictEqual(typeof res, 'object');
    const key = 'Paris';
    test.strictEqual(res[key], '1');
    test.end();
  });

  metatests.test('database.count', async (test) => {
    const res1 = await db.count('Country');
    test.strictEqual(res1, 9);
    const res2 = await db.count('City', { name: 'Paris' });
    test.strictEqual(res2, 1);
    test.end();
  });

  metatests.test('update/select/delete with 0 value', async (test) => {
    const res1 = await db
      .insert('Counter', { value: 1 })
      .returning('counterId');
    const { counterId } = res1[0];

    const res2 = await db
      .update('Counter', { value: 0 }, { counterId })
      .returning('value');
    const { value } = res2[0];
    test.strictEqual(value, '0');

    const [row] = await db.select('Counter', ['value'], { counterId });
    test.strictEqual(row.value, value);

    await db.delete('Counter', { counterId });
    test.end();
  });
})();
