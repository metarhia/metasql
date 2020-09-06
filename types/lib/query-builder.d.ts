import { ParamsBuilder } from './params-builder';

export interface QueryBuilderOptions {
  escapeIdentifier?: (key: string) => string;
}

// Base class for all QueryBuilders
export class QueryBuilder<O extends QueryBuilderOptions = QueryBuilderOptions> {
  constructor(params: ParamsBuilder, options?: O);

  // Build and return the SQL query.
  build(): string;
}
