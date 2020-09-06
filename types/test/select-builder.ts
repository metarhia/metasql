import { ParamsBuilder } from '../lib/params-builder';
import { QueryBuilder } from '../lib/query-builder';
import { SelectBuilder } from '../lib/select-builder';

const anotherQuery: QueryBuilder = {} as QueryBuilder;
const params = new ParamsBuilder();
const builder: SelectBuilder = new SelectBuilder(params);
const sql = builder
  .from('table1')
  .select('a', 'b')
  .selectAs('c', 'alias')
  .innerJoin('table2', 'key1', 'key2')
  .distinct()
  .where('key', '>', 42)
  .where('key', '>', anotherQuery)
  .whereNot('keynot', '<', 42)
  .whereNot('keynot', '<', anotherQuery)
  .whereNull('keynull')
  .whereNotNull('keynotnull')
  .whereIn('keyin', [1, 2, 3])
  .whereIn('keyin', new Set([1, 2, 3]))
  .whereIn('keyin', anotherQuery)
  .whereNotIn('keynotin', [1, 2, 3])
  .whereNotIn('keynotin', new Set([1, 2, 3]))
  .whereNotIn('keynotin', anotherQuery)
  .whereAny('keyany', [1, 2, 3])
  .whereAny('keyany', new Set([1, 2, 3]))
  .whereAny('keyany', anotherQuery)
  .whereExists(anotherQuery)
  .orderBy('a')
  .orderBy('a', 'ASC')
  .orderBy('a', 'DESC')
  .groupBy('x', 'z')
  .limit(42)
  .offset(13)
  .count()
  .count('*')
  .count('a', '42')
  .avg('f1')
  .avg('f2', 'a2')
  .min('f3')
  .min('f4', 'a4')
  .max('f5')
  .max('f5', 'a5')
  .sum('f6')
  .sum('f6', 'a6')
  .build();

const p: any[] = params.build();
