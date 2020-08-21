'use strict';

const { SelectBuilder } = require('../lib/select-builder');
const { testSync } = require('metatests');
const { RawBuilder } = require('../lib/raw-builder');
const { ConditionsBuilder } = require('../lib/conditions-builder');
const { PostgresParamsBuilder } = require('../lib/pg-params-builder');

const test = testSync('Conditions tests', null, { parallelSubtests: true });
test.beforeEach((test, callback) => {
  const params = new PostgresParamsBuilder();
  callback({ builder: new ConditionsBuilder(params), params });
});

const allowedConditions = new Set([
  '=',
  '!=',
  '<>',
  '<',
  '<=',
  '>',
  '>=',
  'LIKE',
  'EXISTS',
  'IS',
  'IS DISTINCT',
  'IN',
  'NOT IN',
  'BETWEEN',
  'BETWEEN SYMMETRIC',
  'NOT BETWEEN',
  'NOT BETWEEN SYMMETRIC',
]);

test.testSync('single condition and', (test, { builder, params }) => {
  builder.and('f1', '=', 3);
  test.strictSame(builder.build(), '"f1" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('single condition or', (test, { builder, params }) => {
  builder.or('f1', '=', 3);
  test.strictSame(builder.build(), '"f1" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('simple .and().or() condition', (test, { builder, params }) => {
  builder.and('f1', '=', 3).or('f2', '=', 4);
  test.strictSame(builder.build(), '"f1" = $1 OR "f2" = $2');
  test.strictSame(params.build(), [3, 4]);
});

test.testSync('single condition not', (test, { builder, params }) => {
  builder.not('f1', '=', 3);
  test.strictSame(builder.build(), 'NOT "f1" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('single condition orNot', (test, { builder, params }) => {
  builder.orNot('f1', '=', 3);
  test.strictSame(builder.build(), 'NOT "f1" = $1');
  test.strictSame(params.build(), [3]);
});

test.testSync('not with orNot condition', (test, { builder, params }) => {
  builder.not('f1', '=', 3).orNot('f2', '=', 42);
  test.strictSame(builder.build(), 'NOT "f1" = $1 OR NOT "f2" = $2');
  test.strictSame(params.build(), [3, 42]);
});

test.testSync('multiple conditions and', (test, { builder, params }) => {
  builder.and('f1', '=', 3).and('f2', '<', 'abc');
  test.strictSame(builder.build(), '"f1" = $1 AND "f2" < $2');
  test.strictSame(params.build(), [3, 'abc']);
});

test.testSync('multiple conditions or', (test, { builder, params }) => {
  builder.or('f1', '=', 3).or('f2', '<', 'abc');
  test.strictSame(builder.build(), '"f1" = $1 OR "f2" < $2');
  test.strictSame(params.build(), [3, 'abc']);
});

test.testSync('condition date', (test, { builder, params }) => {
  const date = new Date(1537025908018); // 2018-09-15T15:38:28.018Z
  builder.and('f2', '=', date);
  test.strictSame(builder.build(), '"f2" = $1');
  test.strictSame(params.build(), [date]);
});

test.testSync('condition null', (test, { builder, params }) => {
  builder.null('f1');
  test.strictSame(builder.build(), '"f1" IS NULL');
  test.strictSame(params.build(), []);
});

test.testSync('condition orNull', (test, { builder, params }) => {
  builder.orNull('f1');
  test.strictSame(builder.build(), '"f1" IS NULL');
  test.strictSame(params.build(), []);
});

test.testSync('condition null and orNull', (test, { builder, params }) => {
  builder.null('f1').orNull('f2');
  test.strictSame(builder.build(), '"f1" IS NULL OR "f2" IS NULL');
  test.strictSame(params.build(), []);
});

test.testSync('condition notNull', (test, { builder, params }) => {
  builder.notNull('f1');
  test.strictSame(builder.build(), '"f1" IS NOT NULL');
  test.strictSame(params.build(), []);
});

test.testSync('condition orNotNull', (test, { builder, params }) => {
  builder.orNotNull('f1');
  test.strictSame(builder.build(), '"f1" IS NOT NULL');
  test.strictSame(params.build(), []);
});

test.testSync(
  'condition notNull and orNotNull',
  (test, { builder, params }) => {
    builder.notNull('f1').orNotNull('f2');
    test.strictSame(builder.build(), '"f1" IS NOT NULL OR "f2" IS NOT NULL');
    test.strictSame(params.build(), []);
  }
);

test.testSync('condition in numbers', (test, { builder, params }) => {
  builder.in('f1', [1, 2, 3]);
  test.strictSame(builder.build(), '"f1" IN ($1, $2, $3)');
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync('condition orIn numbers', (test, { builder, params }) => {
  builder.orIn('f1', [1, 2, 3]);
  test.strictSame(builder.build(), '"f1" IN ($1, $2, $3)');
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync(
  'condition in numbers or numbers',
  (test, { builder, params }) => {
    builder.in('f1', [1, 2, 3]).orIn('f2', [1, 2, 3]);
    test.strictSame(
      builder.build(),
      '"f1" IN ($1, $2, $3) OR "f2" IN ($4, $5, $6)'
    );
    test.strictSame(params.build(), [1, 2, 3, 1, 2, 3]);
  }
);

test.testSync('condition in set', (test, { builder, params }) => {
  builder.in('f1', new Set([1, 2, 3]));
  test.strictSame(builder.build(), '"f1" IN ($1, $2, $3)');
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync('condition orIn set', (test, { builder, params }) => {
  builder.orIn('f1', new Set([1, 2, 3]));
  test.strictSame(builder.build(), '"f1" IN ($1, $2, $3)');
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync('condition in set or array', (test, { builder, params }) => {
  builder.in('f1', new Set([1, 2, 3])).orIn('f2', new Set([1, 2, 3]));
  test.strictSame(
    builder.build(),
    '"f1" IN ($1, $2, $3) OR "f2" IN ($4, $5, $6)'
  );
  test.strictSame(params.build(), [1, 2, 3, 1, 2, 3]);
});

test.testSync('condition notIn numbers', (test, { builder, params }) => {
  builder.notIn('f1', [1, 2, 3]);
  test.strictSame(builder.build(), '"f1" NOT IN ($1, $2, $3)');
  test.strictSame(params.build(), [1, 2, 3]);
});

test.testSync('condition any numbers', (test, { builder, params }) => {
  builder.any('f1', [1, 2, 3]);
  test.strictSame(builder.build(), '"f1" = ANY ($1)');
  test.strictSame(params.build(), [[1, 2, 3]]);
});

test.testSync(
  'condition any numbers or numbers',
  (test, { builder, params }) => {
    builder.any('f1', [1, 2, 3]).orAny('f2', [3, 2, 1]);
    test.strictSame(builder.build(), '"f1" = ANY ($1) OR "f2" = ANY ($2)');
    test.strictSame(params.build(), [
      [1, 2, 3],
      [3, 2, 1],
    ]);
  }
);

test.testSync('condition like', (test, { builder, params }) => {
  builder.and('f1', 'like', 'abc');
  test.strictSame(builder.build(), '"f1" LIKE $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync('condition or like', (test, { builder, params }) => {
  builder.or('f1', 'like', 'abc');
  test.strictSame(builder.build(), '"f1" LIKE $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync('condition like or like', (test, { builder, params }) => {
  builder.and('f1', 'like', 'abc').or('f2', 'like', 'cba');
  test.strictSame(builder.build(), '"f1" LIKE $1 OR "f2" LIKE $2');
  test.strictSame(params.build(), ['abc', 'cba']);
});

test.testSync('allowed conditions and', (test, { builder }) => {
  // Must not throw.
  allowedConditions.forEach(cond => builder.and('f1', cond, 42));
});

test.testSync('allowed conditions or', (test, { builder }) => {
  // Must not throw.
  allowedConditions.forEach(cond => builder.or('f1', cond, 42));
});

test.testSync('condition !=', (test, { builder, params }) => {
  builder.and('f1', '!=', 'abc');
  test.strictSame(builder.build(), '"f1" <> $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync('condition or !=', (test, { builder, params }) => {
  builder.or('f1', '!=', 'abc');
  test.strictSame(builder.build(), '"f1" <> $1');
  test.strictSame(params.build(), ['abc']);
});

test.testSync(
  'qualified rows with multiple conditions',
  (test, { builder, params }) => {
    builder.and('table1.f', '=', 'abc').and('table2.f', '=', 'abc');
    test.strictSame(builder.build(), '"table1"."f" = $1 AND "table2"."f" = $2');
    test.strictSame(params.build(), ['abc', 'abc']);
  }
);

test.testSync(
  'qualified rows with multiple conditions or',
  (test, { builder, params }) => {
    builder
      .and('table1.f', '=', 'abc')
      .and('table2.f', '=', 'abc')
      .or('table3.f', '>', 13);
    test.strictSame(
      builder.build(),
      '"table1"."f" = $1 AND "table2"."f" = $2 OR "table3"."f" > $3'
    );
    test.strictSame(params.build(), ['abc', 'abc', 13]);
  }
);

test.testSync('condition nested', (test, { builder, params }) => {
  const nested = new SelectBuilder(builder.params)
    .from('table2')
    .select('A')
    .where('f1', '=', 42);
  builder.and('a', '=', nested);
  test.strictSame(
    builder.build(),
    '"a" = (SELECT "A" FROM "table2" WHERE "f1" = $1)'
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition nested or', (test, { builder, params }) => {
  const nested = new SelectBuilder(builder.params)
    .from('table2')
    .select('A')
    .where('f1', '=', 42);
  builder.or('a', '=', nested);
  test.strictSame(
    builder.build(),
    '"a" = (SELECT "A" FROM "table2" WHERE "f1" = $1)'
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition nested raw', (test, { builder, params }) => {
  const nested = new RawBuilder(
    params => `SELECT "A" FROM "table2" WHERE "f1" = ${params.add(42)}`,
    params
  );
  builder.and('f1', '=', nested);
  test.strictSame(
    builder.build(),
    '"f1" = (SELECT "A" FROM "table2" WHERE "f1" = $1)'
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition nested raw or select', (test, { builder, params }) => {
  const nestedAnd = new RawBuilder(
    params => `SELECT "A" FROM "table2" WHERE "f1" = ${params.add(42)}`,
    params
  );
  const nestedOr = new SelectBuilder(builder.params)
    .from('table2')
    .select('A')
    .where('f1', '=', 42);
  builder.and('f1', '=', nestedAnd).or('f2', '=', nestedOr);
  const expectedSql = `"f1" = (SELECT "A" FROM "table2" WHERE "f1" = $1)
   OR "f2" = (SELECT "A" FROM "table2" WHERE "f1" = $2)`;
  test.strictSame(builder.build(), expectedSql.replace(/\n\s+/g, ' '));
  test.strictSame(params.build(), [42, 42]);
});

test.testSync('condition exists', (test, { builder, params }) => {
  const nested = new SelectBuilder(params).from('table2').where('f1', '=', 42);
  builder.exists(nested).and('f1', '=', 13);
  test.strictSame(
    builder.build(),
    'EXISTS (SELECT * FROM "table2" WHERE "f1" = $1) AND "f1" = $2'
  );
  test.strictSame(params.build(), [42, 13]);
});

test.testSync('condition orExists', (test, { builder, params }) => {
  const nested = new SelectBuilder(params).from('table2').where('f1', '=', 42);
  builder.orExists(nested).and('f1', '=', 13);
  test.strictSame(
    builder.build(),
    'EXISTS (SELECT * FROM "table2" WHERE "f1" = $1) AND "f1" = $2'
  );
  test.strictSame(params.build(), [42, 13]);
});

test.testSync('conditions between', (test, { builder, params }) => {
  builder
    .between('a', 1, 100)
    .between('b', 100, 1, true)
    .between('c', 'aaa', 'yyy');
  test.strictSame(
    builder.build(),
    `"a" BETWEEN $1 AND $2
       AND "b" BETWEEN SYMMETRIC $3 AND $4
       AND "c" BETWEEN $5 AND $6`.replace(/\n\s+/g, ' ')
  );
  test.strictSame(params.build(), [1, 100, 100, 1, 'aaa', 'yyy']);
});

test.testSync('conditions orBetween', (test, { builder, params }) => {
  builder
    .orBetween('a', 1, 100)
    .orBetween('b', 100, 1, true)
    .orBetween('c', 'aaa', 'yyy');
  test.strictSame(
    builder.build(),
    `"a" BETWEEN $1 AND $2
       OR "b" BETWEEN SYMMETRIC $3 AND $4
       OR "c" BETWEEN $5 AND $6`.replace(/\n\s+/g, ' ')
  );
  test.strictSame(params.build(), [1, 100, 100, 1, 'aaa', 'yyy']);
});

test.testSync('conditions notBetween', (test, { builder, params }) => {
  builder.notBetween('a', 1, 100).notBetween('b', 'aaa', 'yyy', true);
  test.strictSame(
    builder.build(),
    `"a" NOT BETWEEN $1 AND $2
       AND "b" NOT BETWEEN SYMMETRIC $3 AND $4`.replace(/\n\s+/g, ' ')
  );
  test.strictSame(params.build(), [1, 100, 'aaa', 'yyy']);
});

test.testSync('conditions orNotBetween', (test, { builder, params }) => {
  builder.orNotBetween('a', 1, 100).orNotBetween('b', 'aaa', 'yyy', true);
  test.strictSame(
    builder.build(),
    `"a" NOT BETWEEN $1 AND $2
       OR "b" NOT BETWEEN SYMMETRIC $3 AND $4`.replace(/\n\s+/g, ' ')
  );
  test.strictSame(params.build(), [1, 100, 'aaa', 'yyy']);
});

test.testSync('conditions between multiple', (test, { builder, params }) => {
  builder
    .notBetween('a', 1, 100)
    .orBetween('c', 1, 100)
    .between('b', 'xzy', 'yyy', true)
    .notBetween('c', 'aaa', 'yyy', true)
    .between('d', 42, 100)
    .orNotBetween('e', 123, 222);
  test.strictSame(
    builder.build(),
    `"a" NOT BETWEEN $1 AND $2
       OR "c" BETWEEN $3 AND $4
       AND "b" BETWEEN SYMMETRIC $5 AND $6
       AND "c" NOT BETWEEN SYMMETRIC $7 AND $8
       AND "d" BETWEEN $9 AND $10
       OR "e" NOT BETWEEN $11 AND $12`.replace(/\n\s+/g, ' ')
  );
  const args = [1, 100, 1, 100, 'xzy', 'yyy', 'aaa', 'yyy', 42, 100, 123, 222];
  test.strictSame(params.build(), args);
});

test.testSync('condition in nested', (test, { builder, params }) => {
  const nestedQuery = new SelectBuilder(params);
  nestedQuery
    .from('table2')
    .select('a')
    .where('id', '>', 42);

  builder.in('a', nestedQuery);
  test.strictSame(
    builder.build(),
    `"a" IN (SELECT "a" FROM "table2" WHERE "id" > $1)`
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition orIn nested', (test, { builder, params }) => {
  const nestedQuery = new SelectBuilder(params);
  nestedQuery
    .from('table2')
    .select('a')
    .where('id', '>', 42);

  builder.orIn('a', nestedQuery);
  test.strictSame(
    builder.build(),
    `"a" IN (SELECT "a" FROM "table2" WHERE "id" > $1)`
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition in and orIn nested', (test, { builder, params }) => {
  const nestedAnd = new SelectBuilder(params)
    .from('table2')
    .select('a')
    .where('id', '>', 42);
  const nestedOr = new SelectBuilder(params)
    .from('table3')
    .select('b')
    .where('r2', '>', 24);

  builder.in('a', nestedAnd).orIn('b', nestedOr);
  const expectedSql = `"a" IN (SELECT "a" FROM "table2" WHERE "id" > $1)
    OR "b" IN (SELECT "b" FROM "table3" WHERE "r2" > $2)`;
  test.strictSame(builder.build(), expectedSql.replace(/\n\s+/g, ' '));
  test.strictSame(params.build(), [42, 24]);
});

test.testSync('condition notIn nested', (test, { builder, params }) => {
  const nestedQuery = new SelectBuilder(params);
  nestedQuery
    .from('table2')
    .select('a')
    .where('id', '>', 42);

  builder.notIn('a', nestedQuery);
  test.strictSame(
    builder.build(),
    `"a" NOT IN (SELECT "a" FROM "table2" WHERE "id" > $1)`
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition orNotIn nested', (test, { builder, params }) => {
  const nestedQuery = new SelectBuilder(params);
  nestedQuery
    .from('table2')
    .select('a')
    .where('id', '>', 42);

  builder.orNotIn('a', nestedQuery);
  test.strictSame(
    builder.build(),
    `"a" NOT IN (SELECT "a" FROM "table2" WHERE "id" > $1)`
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition any nested', (test, { builder, params }) => {
  const nestedQuery = new SelectBuilder(params);
  nestedQuery
    .from('table2')
    .select('a')
    .where('id', '>', 42);

  builder.any('a', nestedQuery);
  test.strictSame(
    builder.build(),
    `"a" = ANY (SELECT "a" FROM "table2" WHERE "id" > $1)`
  );
  test.strictSame(params.build(), [42]);
});

test.testSync('condition orAny nested', (test, { builder, params }) => {
  const nestedQuery = new SelectBuilder(params);
  nestedQuery
    .from('table2')
    .select('a')
    .where('id', '>', 42);

  builder.orAny('a', nestedQuery);
  test.strictSame(
    builder.build(),
    `"a" = ANY (SELECT "a" FROM "table2" WHERE "id" > $1)`
  );
  test.strictSame(params.build(), [42]);
});

test.testSync(
  'condition between nested simple',
  (test, { builder, params }) => {
    const nestedStart = new RawBuilder(() => 'SELECT -1', params);
    const nestedEnd = new RawBuilder(() => 'SELECT 42', params);
    builder
      .between('a', nestedStart, nestedEnd)
      .between('b', nestedEnd, nestedStart, true);
    const expectedSql = `"a" BETWEEN (SELECT -1) AND (SELECT 42)
       AND "b" BETWEEN SYMMETRIC (SELECT 42) AND (SELECT -1)`;
    test.strictSame(builder.build(), expectedSql.replace(/\n\s+/g, ' '));
    test.strictSame(params.build(), []);
  }
);

test.testSync(
  'condition between nested complex',
  (test, { builder, params }) => {
    const nestedStart = new SelectBuilder(params)
      .from('table2')
      .select('f1')
      .where('f2', '>', 42)
      .limit(1);
    const nestedEnd = new SelectBuilder(params)
      .from('table3')
      .select('f1')
      .where('f2', '<', 42)
      .limit(1);
    builder
      .between('a', nestedStart, nestedEnd)
      .between('b', nestedEnd, nestedStart, true);
    const expectedSql = `"a" BETWEEN
            (SELECT "f1" FROM "table2" WHERE "f2" > $1 LIMIT $2) AND
            (SELECT "f1" FROM "table3" WHERE "f2" < $3 LIMIT $4)
          AND "b" BETWEEN SYMMETRIC
            (SELECT "f1" FROM "table3" WHERE "f2" < $5 LIMIT $6) AND
            (SELECT "f1" FROM "table2" WHERE "f2" > $7 LIMIT $8)`;
    test.strictSame(builder.build(), expectedSql.replace(/\n\s+/g, ' '));
    test.strictSame(params.build(), [42, 1, 42, 1, 42, 1, 42, 1]);
  }
);

test.testSync(
  'nested conditions functions with or/and',
  (test, { builder, params }) => {
    builder
      .and('f1', '=', 42)
      .null('f2')
      .and(builder => builder.or('a1', '=', 13).or('a2', '>', 42))
      .or(builder => builder.and('f3', '<', 97).between('f4', 100, 142));
    const expectedSql = `"f1" = $1 AND "f2" IS NULL
      AND ("a1" = $2 OR "a2" > $3)
      OR ("f3" < $4 AND "f4" BETWEEN $5 AND $6)`;
    test.strictSame(builder.build(), expectedSql.replace(/\n\s+/g, ' '));
    test.strictSame(params.build(), [42, 13, 42, 97, 100, 142]);
  }
);

test.testSync(
  'nested conditions query with or/and',
  (test, { builder, params }) => {
    const andQuery = new ConditionsBuilder(params)
      .or('a1', '=', 13)
      .or('a2', '>', 42);
    const orQuery = new ConditionsBuilder(params)
      .and('f3', '<', 97)
      .between('f4', 100, 142);
    builder
      .and('f1', '=', 42)
      .notNull('f2')
      .and(andQuery)
      .or(orQuery)
      .notBetween('f5', 42, 24, true);
    const expectedSql = `"f1" = $1 AND "f2" IS NOT NULL
      AND ("a1" = $2 OR "a2" > $3)
      OR ("f3" < $4 AND "f4" BETWEEN $5 AND $6)
      AND "f5" NOT BETWEEN SYMMETRIC $7 AND $8`;
    test.strictSame(builder.build(), expectedSql.replace(/\n\s+/g, ' '));
    test.strictSame(params.build(), [42, 13, 42, 97, 100, 142, 42, 24]);
  }
);
