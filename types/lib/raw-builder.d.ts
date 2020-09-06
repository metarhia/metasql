import { ParamsBuilder } from './params-builder';
import { QueryBuilder, QueryBuilderOptions } from './query-builder';

export class RawBuilder extends QueryBuilder {
  constructor(
    sqlTemplate: (p: typeof params) => string,
    params: ParamsBuilder,
    options?: QueryBuilderOptions
  );
}
