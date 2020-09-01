import { ParamsBuilder } from './params-builder';
import { QueryBuilder, QueryBuilderOptions } from './query-builder';

export interface SelectBuilderOptions extends QueryBuilderOptions {}

type QueryValue = QueryBuilder | ((builder: SelectBuilder) => QueryBuilder);

type ConditionValue = any | QueryValue;

export class SelectBuilder extends QueryBuilder<SelectBuilderOptions> {
  constructor(params: ParamsBuilder, options?: SelectBuilderOptions);

  from(tableName: string): this;

  select(...fields: string[]): this;

  selectAs(field: string, alias: string): this;

  innerJoin(tableName: string, leftKey: string, rightKey: string): this;

  distinct(): this;

  where(key: string, cond: string, value: ConditionValue): this;

  orWhere(key: string, cond: string, value: ConditionValue): this;

  whereNot(key: string, cond: string, value: ConditionValue): this;

  orWhereNot(key: string, cond: string, value: ConditionValue): this;

  whereNull(key: string): this;

  orWhereNull(key: string): this;

  whereNotNull(key: string): this;

  orWhereNotNull(key: string): this;

  whereBetween(
    key: string,
    from: ConditionValue,
    to: ConditionValue,
    symmetric?: boolean
  ): this;

  orWhereBetween(
    key: string,
    from: ConditionValue,
    to: ConditionValue,
    symmetric?: boolean
  ): this;

  whereNotBetween(
    key: string,
    from: ConditionValue,
    to: ConditionValue,
    symmetric?: boolean
  ): this;

  orWhereNotBetween(
    key: string,
    from: ConditionValue,
    to: ConditionValue,
    symmetric?: boolean
  ): this;

  whereIn(key: string, conds: Iterable<any> | QueryValue): this;

  orWhereIn(key: string, conds: Iterable<any> | QueryValue): this;

  whereNotIn(key: string, conds: Iterable<any> | QueryValue): this;

  orWhereNotIn(key: string, conds: Iterable<any> | QueryValue): this;

  whereAny(key: string, value: ConditionValue): this;

  orWhereAny(key: string, value: ConditionValue): this;

  whereExists(subquery: QueryValue): this;

  orWhereExists(subquery: QueryValue): this;

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
