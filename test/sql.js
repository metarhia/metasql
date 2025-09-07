'use strict';

const { test } = require('node:test');
const assert = require('node:assert');
const { Database, Query } = require('..');
const metadomain = require('metadomain');

const run = async () => {
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

  test('open database', async () => {
    assert.strictEqual(db.constructor.name, 'Database');
    assert.strictEqual(db.pool.constructor.name, 'BoundPool');
  });

  test('database.query', async () => {
    const res = await db.query('SELECT * FROM "City" WHERE "cityId" = $1', [1]);
    assert.strictEqual(res.constructor.name, 'Result');
    assert.strictEqual(res.rows.constructor.name, 'Array');
    assert.strictEqual(res.rows.length, 1);
    assert.strictEqual(res.rows[0].name, 'Paris');
  });

  test('database.sql', async () => {
    const id = 1;

    const query1 = db.sql`
      SELECT * FROM "City"
      WHERE "cityId" = ${id}
    `;
    const res1 = await query1.rows();
    assert.strictEqual(res1.constructor.name, 'Array');
    assert.strictEqual(res1.length, 1);
    assert.deepStrictEqual(res1[0], {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });

    const query2 = db.sql`
      SELECT * FROM "City"
      WHERE "cityId" = ${'id'}
    `;
    const res2 = await query2.row({ id });
    assert.deepStrictEqual(res2, {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });

    const query3 = db.sql`
      SELECT name FROM "City"
      WHERE "cityId" = ${id}
    `;
    const res3 = await query3.scalar();
    assert.strictEqual(res3, 'Paris');

    const query4 = db.sql`
      SELECT name FROM "City"
      WHERE "cityId" > ${5} AND "cityId" < ${10}
      ORDER BY name
    `;
    const res4 = await query4.col('name');
    assert.deepStrictEqual(res4, ['Cairo', 'Kiev', 'Kufa', 'Leningrad']);

    const query5 = db.sql`
      SELECT count(*) FROM "City"
      WHERE "cityId" > ${5} AND "cityId" < ${10}
    `;
    const res5 = await query5.count();
    assert.strictEqual(res5, 4);

    const query6 = db.sql`
      SELECT * FROM "City"
      WHERE "cityId" < ${5} AND "name" <> 'La Haye-en-Touraine'
      ORDER BY name
      LIMIT 3
    `;
    const res6 = await query6.dict('name', 'cityId');
    assert.deepStrictEqual(
      { ...res6 },
      {
        Alexandria: '3',
        Athens: '4',
        Paris: '1',
      },
    );
  });

  test('database.query error', async () => {
    try {
      await db.query('INVALID SQL');
      assert.fail('Invalid query should throw an error');
    } catch (error) {
      const msg = 'Error stack should have query invocation file in it';
      assert.ok(error.stack.includes('test/sql.js'), msg);
      assert.ok(error.dbStack, 'Original error stack should be preserved');
    }
  });

  test('database.select', async () => {
    const res1 = await db.select('City', ['*'], { cityId: 1 });
    assert.strictEqual(res1.length, 1);
    assert.deepStrictEqual(res1[0], {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });
    const res2 = await db.select('City', { cityId: 1 });
    assert.strictEqual(res2.length, 1);
    assert.deepStrictEqual(res2[0], {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });
    const res3 = await db.select('City');
    const { cityId, name } = res3[0];
    assert.strictEqual(cityId, '1');
    assert.strictEqual(name, 'Paris');
    const res4 = await db.select('City', { cityId: '1', name: undefined });
    assert.deepStrictEqual(res4[0], {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });
  });

  test('database.select.then', async () => {
    await db
      .select('City', ['*'], { cityId: 1 })
      .then((cities) => cities[0])
      .then((city) => {
        assert.deepStrictEqual(city, {
          cityId: '1',
          name: 'Paris',
          countryId: '1',
        });
      });
  });

  test('database.select and/or', async () => {
    const res = await db.select('City', ['*'], { cityId: 1 }, { name: 'Kiev' });
    assert.strictEqual(res.length, 2);
    assert.deepStrictEqual(res[0], {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });
    assert.deepStrictEqual(res[1], {
      cityId: '8',
      name: 'Kiev',
      countryId: '4',
    });
  });

  test('database.select in []', async () => {
    const res = await db.select('City', ['*'], { cityId: [1, 8] });
    assert.strictEqual(res.length, 2);
    assert.deepStrictEqual(res[0], {
      cityId: '1',
      name: 'Paris',
      countryId: '1',
    });
    assert.deepStrictEqual(res[1], {
      cityId: '8',
      name: 'Kiev',
      countryId: '4',
    });
  });

  test('query.limit/offset', async () => {
    const res1 = await db.select('City').limit(3);
    assert.strictEqual(res1.length, 3);
    assert.strictEqual(res1[0].name, 'Paris');
    const res2 = await db.select('City').offset(2).limit(4);
    assert.strictEqual(res2.length, 4);
    assert.strictEqual(res2[0].name, 'Alexandria');
    const res3 = await db.select('City').limit(4).offset(1);
    assert.strictEqual(res3.length, 4);
    assert.strictEqual(res3[0].name, 'La Haye-en-Touraine');
  });

  test('query.order/desc', async () => {
    const res1 = await db.select('City').order('name');
    assert.strictEqual(res1[0].name, 'Alexandria');
    const res2 = await db.select('City').desc('name');
    assert.strictEqual(res2[0].name, 'Wuhan');
    const res3 = await db.select('City').order('name').desc('name');
    assert.strictEqual(res3[0].name, 'Wuhan');
    const res4 = await db.select('City').desc('name').order('name');
    assert.strictEqual(res4[0].name, 'Alexandria');
  });

  test('query.toObject/from', async () => {
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
    assert.deepStrictEqual(metadata, expected);
    const res = await Query.from(db, metadata);
    assert.deepStrictEqual(res, [
      { cityId: '1', name: 'Paris', countryId: '1' },
    ]);
  });

  test('query.toString', async () => {
    const query1 = db.select('City', ['*'], { name: 'Paris' });
    const sql1 = query1.toString();
    const expected1 = 'SELECT * FROM "City" WHERE "name" = "Paris"';
    assert.strictEqual(sql1, expected1);

    const query2 = db.insert('City', { name: 'Odessa', countryId: 4 });
    const sql2 = query2.toString();
    const expected2 =
      'INSERT ' +
      'INTO "City" ("name", "countryId") ' +
      'VALUES ("Odessa", "4") ' +
      'RETURNING *';
    assert.strictEqual(sql2, expected2);
  });

  test('insert/update/delete: normal and falsy', async () => {
    const res1 = await db
      .insert('City', { name: 'Odessa', countryId: 4 })
      .returning('cityId');
    assert.strictEqual(res1.length, 1);
    assert.strictEqual(parseInt(res1[0].cityId) > 1, true);

    const res2 = await db
      .update(
        'City',
        { name: 'ODESSA', countryId: undefined },
        { name: 'Odessa', cityId: undefined },
      )
      .returning(['cityId']);
    assert.strictEqual(res2.length, 1);

    const res3 = await db.select('City', { name: 'ODESSA' });
    assert.deepStrictEqual(res3[0], {
      name: 'ODESSA',
      countryId: '4',
      cityId: res3[0].cityId,
    });

    const res4 = await db.delete('City', { name: 'ODESSA' }).returning('*');
    assert.strictEqual(res4.length, 1);

    const res5 = await db
      .update('City', { name: null }, { name: 'ODESSA' })
      .returning('cityId');
    assert.strictEqual(res5.length, 0);

    const [{ cityId }] = await db
      .insert('City', { name: 'Mediolanum', countryId: 6 })
      .returning('cityId');

    await db.update('City', { name: 'Milano' }, { cityId }).returning(['name']);

    await db.delete('City', { cityId }).returning('*');
  });

  test('insert/update/delete: auto-returning', async () => {
    const res1 = await db.insert('City', { name: 'Toulouse', countryId: 1 });
    assert.strictEqual(res1.length, 1);
    assert.strictEqual(parseInt(res1[0].cityId) > 1, true);

    const res2 = await db.update(
      'City',
      { name: 'TOULOUSE', countryId: undefined },
      { name: 'Toulouse', cityId: undefined },
    );
    assert.strictEqual(res2.length, 1);

    const res3 = await db.select('City', { name: 'TOULOUSE' });
    assert.deepStrictEqual(res3[0], {
      name: 'TOULOUSE',
      countryId: '1',
      cityId: res3[0].cityId,
    });

    const res4 = await db.delete('City', { name: 'TOULOUSE' }).returning('*');
    assert.strictEqual(res4.length, 1);

    const res5 = await db.update('City', { name: null }, { name: 'TOULOUSE' });
    assert.strictEqual(res5.length, 0);

    const [{ cityId }] = await db.insert('City', {
      name: 'Mediolanum',
      countryId: 6,
    });

    const res7 = await db
      .update('City', { name: '' }, { cityId })
      .returning(['name']);
    assert.strictEqual(res7[0].name, '');

    await db.delete('City', { cityId }).returning('*');
  });

  test('database.insert into registry', async () => {
    const res1 = await db
      .insert('Division', { name: 'Quality control' })
      .returning('id');
    assert.strictEqual(typeof res1[0].id, 'string');
    assert.strictEqual(res1.length, 1);
  });

  test('database.row', async () => {
    const res = await db.row('City', ['*'], { name: 'Paris' });
    assert.deepStrictEqual(res, { cityId: '1', name: 'Paris', countryId: '1' });
  });

  test('database.scalar', async () => {
    const res = await db.scalar('City', ['name'], { name: 'Paris' });
    assert.strictEqual(res, 'Paris');
  });

  test('database.col', async () => {
    const res = await db.col('City', ['name']);
    assert.strictEqual(res.constructor.name, 'Array');
  });

  test('database.dict', async () => {
    const res = await db.dict('City', ['name', 'countryId']);
    assert.strictEqual(typeof res, 'object');
    const key = 'Paris';
    assert.strictEqual(res[key], '1');
  });

  test('database.count', async () => {
    const res1 = await db.count('Country');
    assert.strictEqual(res1, 9);
    const res2 = await db.count('City', { name: 'Paris' });
    assert.strictEqual(res2, 1);
  });

  test('update/select/delete with 0 value', async () => {
    const res1 = await db
      .insert('Counter', { value: 1 })
      .returning('counterId');
    const { counterId } = res1[0];

    const res2 = await db
      .update('Counter', { value: 0 }, { counterId })
      .returning('value');
    const { value } = res2[0];
    assert.strictEqual(value, '0');

    const [row] = await db.select('Counter', ['value'], { counterId });
    assert.strictEqual(row.value, value);

    await db.delete('Counter', { counterId });
  });
};

run();
