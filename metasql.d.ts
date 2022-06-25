import { QueryResult, Pool } from 'pg';
import { Model } from 'metaschema';

type ScalarValue = string | number | undefined;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  logger: { db: Function; debug: Function };
}

export class Database {
  pool: Pool;
  model: Model;
  console: Console;
  constructor(config: DatabaseConfig);
  query(sql: string, values: Array<string | number>): Promise<QueryResult>;
  insert(table: string, record: object): Modify;
  select(
    table: string,
    fields: Array<string>,
    ...conditions: Array<object>
  ): Query;
  select(table: string, ...conditions: Array<object>): Query;
  row(
    table: string,
    fields: Array<string>,
    ...conditions: Array<object>
  ): Promise<Array<object>>;
  scalar(
    table: string,
    field: string,
    ...conditions: Array<object>
  ): Promise<ScalarValue>;
  col(
    table: string,
    field: string,
    ...conditions: Array<object>
  ): Promise<Array<ScalarValue>>;
  dict(
    table: string,
    fields: Array<string>,
    ...conditions: Array<object>
  ): Promise<object>;
  delete(table: string, ...conditions: Array<object>): Modify;
  update(table: string, delta: object, ...conditions: Array<object>): Modify;
  close(): void;
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
  then(
    resolve?: (rows: Array<object>) => unknown,
    reject?: Function,
  ): Promise<unknown>;
  catch(reject?: Function): Promise<unknown>;
  toString(): string;
  toObject(): QueryObject;
  static from(db: Database, metadata: QueryObject): Query;
}

interface QueryObject {
  table: string;
  fields: string | Array<string>;
  where?: Array<object>;
  options: Array<object>;
}

export class Modify {
  constructor(db: Database, sql: string, args: Array<string>);
  returning(field: string | Array<string>): Modify;
  then(resolve: (rows: Array<object>) => void, reject: Function): void;
  toString(): string;
  toObject(): ModifyObject;
  static from(db: Database, metadata: ModifyObject): Modify;
}

interface ModifyObject {
  sql: string;
  args: Array<string>;
  options: Array<object>;
}
