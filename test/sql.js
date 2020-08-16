'use strict';

const { testSync } = require('metatests');
const { pg } = require('..');

testSync('Must correctly export pg utility', test => {
  const { builder, params } = pg();
  builder
    .select('f1')
    .from('table1')
    .where('f2', '=', 42);
  test.strictEqual(
    builder.build(),
    'SELECT "f1" FROM "table1" WHERE "f2" = $1'
  );
  test.strictEqual(params.build(), [42]);
});

testSync('Must correctly export pg utility with handler', test => {
  const { builder, params } = pg(builder => {
    builder
      .select('f1')
      .from('table1')
      .where('f2', '=', 42);
  });
  test.strictEqual(
    builder.build(),
    'SELECT "f1" FROM "table1" WHERE "f2" = $1'
  );
  test.strictEqual(params.build(), [42]);
});
