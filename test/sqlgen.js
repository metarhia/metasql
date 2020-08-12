'use strict';

const { testSync } = require('metatests');
const { SelectBuilder } = require('../lib/select-builder');
const { RawBuilder } = require('../lib/raw-builder');
const { PostgresParamsBuilder } = require('../lib/pg-params-builder');

const test = testSync('Select tests', null, { parallelSubtests: true });
test.beforeEach((test, callback) => {
  const params = new PostgresParamsBuilder();
  callback({ builder: new SelectBuilder(params), params });
});

test.testSync('Simple all', (test, { builder, params }) => {
  builder.from('table');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table"');
  test.strictSame(params.build(), []);
});

test.testSync('Simple distinct select all', (test, { builder, params }) => {
  builder.from('table').distinct();
  const query = builder.build();
  test.strictSame(query, 'SELECT DISTINCT * FROM "table"');
  test.strictSame(params.build(), []);
});

test.testSync('Simple field', (test, { builder, params }) => {
  builder.select('a').from('table');
  const query = builder.build();
  test.strictSame(query, 'SELECT "a" FROM "table"');
  test.strictSame(params.build(), []);
});

test.testSync('Simple multiple field', (test, { builder, params }) => {
  builder.select('a', 'b').from('table');
  const query = builder.build();
  test.strictSame(query, 'SELECT "a", "b" FROM "table"');
  test.strictSame(params.build(), []);
});

test.testSync('Simple distinct multiple field', (test, { builder, params }) => {
  builder
    .select('a', 'b')
    .from('table')
    .distinct();
  const query = builder.build();
  test.strictSame(query, 'SELECT DISTINCT "a", "b" FROM "table"');
  test.strictSame(params.build(), []);
});

test.testSync('Select all single where', (test, { builder, params }) => {
  builder.from('table').where('f1', '=', 3);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('Select all single where not', (test, { builder, params }) => {
  builder.from('table').whereNot('f1', '=', 3);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE NOT "f1" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('Select all multiple where', (test, { builder, params }) => {
  builder
    .from('table')
    .where('f1', '=', 3)
    .where('f2', '<', 'abc');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" = $1 AND "f2" < $2');
  test.strictSame(params.build(), [3, 'abc']);
});

test.testSync(
  'Select all multiple where count',
  (test, { builder, params }) => {
    builder
      .from('table')
      .where('f1', '=', 3)
      .where('f2', '<', 'abc')
      .count('f0');
    const query = builder.build();
    test.strictSame(
      query,
      'SELECT count("f0") FROM "table" WHERE "f1" = $1 AND "f2" < $2'
    );
    test.strictSame(params.build(), [3, 'abc']);
  }
);

test.testSync('Select few where avg', (test, { builder, params }) => {
  builder
    .from('table')
    .select('f1', 'f2')
    .where('f1', '=', 3)
    .avg('f0');
  // Note that this is not a correct PostgreSQL query as the select fields
  // are not present in the groupBy section. PG will fail with:
  // 'ERROR: column "table.f1", "table.f2" must appear in the GROUP BY clause
  //  or be used in an aggregate function'.
  //  But this is not the job of an SQL generator to catch these
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT "f1", "f2", avg("f0") FROM "table" WHERE "f1" = $1'
  );
  test.strictSame(params.build(), [3]);
});

test.testSync('Select few where avg', (test, { builder, params }) => {
  builder
    .from('table')
    .select('f1', 'f2')
    .where('f1', '=', 3)
    .groupBy('f1', 'f2')
    .min('f0');
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT "f1", "f2", min("f0") FROM "table" ' +
      'WHERE "f1" = $1 GROUP BY "f1", "f2"'
  );
  test.strictSame(params.build(), [3]);
});

test.testSync('Select all where max', (test, { builder, params }) => {
  builder
    .from('table')
    .where('f2', '=', 3)
    .max('f1');
  const query = builder.build();
  test.strictSame(query, 'SELECT max("f1") FROM "table" WHERE "f2" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('Select all where limit', (test, { builder, params }) => {
  builder
    .from('table')
    .where('f2', '=', 3)
    .limit(10);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1 LIMIT $2');
  test.strictSame(params.build(), [3, 10]);
});

test.testSync('Select all where offset', (test, { builder, params }) => {
  builder
    .from('table')
    .where('f2', '=', 3)
    .offset(10);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1 OFFSET $2');
  test.strictSame(params.build(), [3, 10]);
});

test.testSync('Select all order offset', (test, { builder, params }) => {
  builder
    .from('table')
    .orderBy('f1')
    .offset(10);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" ORDER BY "f1" ASC OFFSET $1');
  test.strictSame(params.build(), [10]);
});

test.testSync('Select few order desc limit', (test, { builder, params }) => {
  builder
    .from('table')
    .select('f1', 'f2')
    .orderBy('f1', 'desc')
    .limit(10);
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT "f1", "f2" FROM "table" ORDER BY "f1" DESC LIMIT $1'
  );
  test.strictSame(params.build(), [10]);
});

test.testSync(
  'Select few where order limit offset',
  (test, { builder, params }) => {
    builder
      .from('table')
      .select('f1')
      .where('f2', '=', 3)
      .offset(10)
      .orderBy('f1')
      .select('f3');
    const query = builder.build();
    test.strictSame(
      query,
      'SELECT "f1", "f3" FROM "table" WHERE "f2" = $1 ' +
        'ORDER BY "f1" ASC OFFSET $2'
    );
    test.strictSame(params.build(), [3, 10]);
  }
);

test.testSync('Select where date', (test, { builder, params }) => {
  const date = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
  builder.from('table').where('f2', '=', date, { date: 'date' });
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1');
  test.strictSame(params.build(), [date]);
});

test.testSync(
  'Select where time with timezone',
  (test, { builder, params }) => {
    const time = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    builder
      .from('table')
      .where('f2', '=', time, { date: 'time with time zone' });
    const query = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1');
    test.strictSame(params.build(), [time]);
  }
);

test.testSync(
  'Select where timestamp with timezone',
  (test, { builder, params }) => {
    const time = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
    builder
      .from('table')
      .where('f2', '=', time, { date: 'timestamp with time zone' });
    const query = builder.build();
    test.strictSame(query, 'SELECT * FROM "table" WHERE "f2" = $1');
    test.strictSame(params.build(), [time]);
  }
);

test.testSync('Select where in numbers', (test, { builder, params }) => {
  builder.from('table').whereIn('f1', [1, 2, 3]);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" IN ($1, $2, $3)');
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync('Select where not in numbers', (test, { builder, params }) => {
  builder.from('table').whereNotIn('f1', [1, 2, 3]);
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT * FROM "table" WHERE "f1" NOT IN ($1, $2, $3)'
  );
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync('Select where any numbers', (test, { builder, params }) => {
  builder.from('table').whereAny('f1', [1, 2, 3]);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" = ANY ($1)');
  test.strictSame(params.build(), [[1, 2, 3]]);
});

test.testSync('Select multiple operations', (test, { builder, params }) => {
  builder
    .from('table')
    .avg('f1')
    .sum('f2');
  const query = builder.build();
  test.strictSame(query, 'SELECT avg("f1"), sum("f2") FROM "table"');
  test.strictSame(params.build(), []);
});

test.testSync(
  'Select multiple operations order',
  (test, { builder, params }) => {
    builder
      .from('table')
      .avg('f1')
      .select('f3')
      .sum('f2')
      .select('f4');
    const query = builder.build();
    test.strictSame(
      query,
      'SELECT avg("f1"), "f3", sum("f2"), "f4" FROM "table"'
    );
    test.strictSame(params.build(), []);
  }
);

test.testSync(
  'Select multiple operations groupBy',
  (test, { builder, params }) => {
    builder
      .from('table')
      .avg('f1')
      .sum('f2')
      .groupBy('a', 'b');
    const query = builder.build();
    test.strictSame(
      query,
      'SELECT avg("f1"), sum("f2") FROM "table" GROUP BY "a", "b"'
    );
    test.strictSame(params.build(), []);
  }
);

test.testSync('Select where like', (test, { builder, params }) => {
  builder.from('table').where('f1', 'like', 'abc');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" LIKE $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync('Select where <>', (test, { builder, params }) => {
  builder.from('table').where('f1', '<>', 'abc');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" <> $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync('Select where !=', (test, { builder, params }) => {
  builder.from('table').where('f1', '!=', 'abc');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "f1" <> $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync('Select multiple from', (test, { builder, params }) => {
  builder.from('table1').from('table2');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table1", "table2"');
  test.strictSame(params.build(), []);
});

test.testSync('Select name with table', (test, { builder, params }) => {
  builder.from('table').where('table.a', '=', 1);
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table" WHERE "table"."a" = $1');
  test.strictSame(params.build(), [1]);
});

test.testSync('Select rows with where', (test, { builder, params }) => {
  builder
    .from('table1')
    .from('table2')
    .where('f1', '=', 'abc');
  const query = builder.build();
  test.strictSame(query, 'SELECT * FROM "table1", "table2" WHERE "f1" = $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync(
  'Select rows with multiple where',
  (test, { builder, params }) => {
    builder
      .from('table1')
      .from('table2')
      .where('table1.f', '=', 'abc')
      .where('table2.f', '=', 'abc');
    const query = builder.build();
    test.strictSame(
      query,
      'SELECT * FROM "table1", "table2" ' +
        'WHERE "table1"."f" = $1 AND "table2"."f" = $2'
    );
    test.strictSame(params.build(), ['abc', 'abc']);
  }
);

test.testSync('Select with inner join', (test, { builder, params }) => {
  builder
    .from('table1')
    .innerJoin('table2', 'table1.f', 'table2.f')
    .where('table1.f', '=', 'abc');
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT * FROM "table1" ' +
      'INNER JOIN "table2" ON "table1"."f" = "table2"."f" ' +
      'WHERE "table1"."f" = $1'
  );
  test.strictSame(params.build(), ['abc']);
});

test.testSync(
  'Select with multiple inner joins',
  (test, { builder, params }) => {
    builder
      .from('table1')
      .innerJoin('table2', 'table1.f', 'table2.f')
      .innerJoin('table3', 'table1.f', 'table3.f')
      .where('table1.f', '=', 'abc');
    const query = builder.build();
    test.strictSame(
      query,
      'SELECT * FROM "table1" ' +
        'INNER JOIN "table2" ON "table1"."f" = "table2"."f" ' +
        'INNER JOIN "table3" ON "table1"."f" = "table3"."f" ' +
        'WHERE "table1"."f" = $1'
    );
    test.strictSame(params.build(), ['abc']);
  }
);

test.testSync('Select where nested', (test, { builder, params }) => {
  const nested = new SelectBuilder(builder.params)
    .from('table2')
    .select('A')
    .where('f1', '=', 42);
  builder.from('table1').where('a', '=', nested);
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT * FROM "table1" WHERE "a" = (SELECT "A" FROM "table2" WHERE "f1" = $1)'
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('Select where nested raw', (test, { builder, params }) => {
  const nested = new RawBuilder(
    params => `SELECT "A" FROM "table2" WHERE "f1" = ${params.add(42)}`,
    params
  );
  builder.from('table1').where('f1', '=', nested);
  const query = builder.build();
  test.strictSame(
    query,
    'SELECT * FROM "table1" WHERE "f1" = (SELECT "A" FROM "table2" WHERE "f1" = $1)'
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('Select where exists', (test, { builder, params }) => {
  const nested = new SelectBuilder(params).from('table2').where('f1', '=', 42);
  builder
    .from('table1')
    .whereExists(nested)
    .where('f1', '=', 13);
  test.strictSame(
    builder.build(),
    'SELECT * FROM "table1" WHERE' +
      ' EXISTS (SELECT * FROM "table2" WHERE "f1" = $1)' +
      ' AND "f1" = $2'
  );
  test.strictSame(params.build(), [42, 13]);
});
