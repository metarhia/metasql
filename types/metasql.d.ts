import { QueryResult } from 'pg';

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  logger: { db: Function; debug: Function };
}

export class Database {
  constructor(config: DatabaseConfig);
  query(sql: string, values: Array<string | number>): Promise<QueryResult>;
  insert(table: string, record: object): Promise<QueryResult>;
  select(
    table: string,
    fields: Array<string>,
    ...conditions: Array<object>
  ): Query;
  row(
    table: string,
    fields: Array<string>,
    ...conditions: Array<object>
  ): Promise<Array<object>>;
  scalar(
    table: string,
    field: string,
    ...conditions: Array<object>
  ): Promise<string | number | undefined>;
  col: (
    table: string,
    field: string,
    ...conditions: Array<object>
  ) => Promise<Array<string | number | undefined>>;
  dict: (
    table: string,
    fields: Array<string>,
    ...conditions: Array<object>
  ) => Promise<object>;
  delete: (table: string, ...conditions: Array<object>) => Promise<QueryResult>;
  update: (
    table: string,
    delta: object,
    ...conditions: Array<object>
  ) => Promise<QueryResult>;
  upsert: (
    table: string,
    record: object,
    constraint: object
  ) => Promise<QueryResult>;
  fields: (table: string) => Promise<Array<string>>;
  close: () => void;
}

export class Query {
  constructor(
    db: Database,
    table: string,
    fields: Array<string>,
    ...where: Array<object>
  );
  order(field: string | Array<string>): Query;
  desc(field: string | Array<string>): Query;
  limit(count: number): Query;
  offset(count: number): Query;
  then(resolve: (rows: Array<object>) => void, reject: Function): void;
}
