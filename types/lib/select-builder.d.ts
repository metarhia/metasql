import { ParamsBuilder } from './params-builder';
import { QueryBuilder, QueryBuilderOptions } from './query-builder';

export interface SelectBuilderOptions extends QueryBuilderOptions {}

export class SelectBuilder extends QueryBuilder<SelectBuilderOptions> {
  constructor(params: ParamsBuilder, options?: SelectBuilderOptions);

  from(tableName: string): this;

  select(...fields: string[]): this;

  selectAs(field: string, alias: string): this;

  innerJoin(tableName: string, leftKey: string, rightKey: string): this;

  distinct(): this;

  where(key: string, cond: string, value: any | QueryBuilder): this;

  orWhere(key: string, cond: string, value: any | QueryBuilder): this;

  whereNot(key: string, cond: string, value: any | QueryBuilder): this;

  orWhereNot(key: string, cond: string, value: any | QueryBuilder): this;

  whereNull(key: string): this;

  orWhereNull(key: string): this;

  whereNotNull(key: string): this;

  orWhereNotNull(key: string): this;

  whereBetween(
    key: string,
    from: any | QueryBuilder,
    to: any | QueryBuilder,
    symmetric?: boolean
  ): this;

  orWhereBetween(
    key: string,
    from: any | QueryBuilder,
    to: any | QueryBuilder,
    symmetric?: boolean
  ): this;

  whereNotBetween(
    key: string,
    from: any | QueryBuilder,
    to: any | QueryBuilder,
    symmetric?: boolean
  ): this;

  orWhereNotBetween(
    key: string,
    from: any | QueryBuilder,
    to: any | QueryBuilder,
    symmetric?: boolean
  ): this;

  whereIn(key: string, conds: Iterable<any> | QueryBuilder): this;

  orWhereIn(key: string, conds: Iterable<any> | QueryBuilder): this;

  whereNotIn(key: string, conds: Iterable<any> | QueryBuilder): this;

  orWhereNotIn(key: string, conds: Iterable<any> | QueryBuilder): this;

  whereAny(key: string, value: any | QueryBuilder): this;

  orWhereAny(key: string, value: any | QueryBuilder): this;

  whereExists(subquery: QueryBuilder): this;

  orWhereExists(subquery: QueryBuilder): this;

  orderBy(field: string, dir?: 'ASC' | 'DESC'): this;

  groupBy(...field: string[]): this;

  limit(limit: number): this;

  offset(offset: number): this;

  count(field?: string, alias?: string): this;

  avg(field: string, alias?: string): this;

  min(field: string, alias?: string): this;

  max(field: string, alias?: string): this;

  sum(field: string, alias?: string): this;
}
