import { QueryResult, Pool } from 'pg';
import { Model } from 'metaschema';

export type ScalarValue = string | number | boolean | null | undefined;
export type FieldValue = ScalarValue | ScalarValue[];
export type RecordData = Record<string, FieldValue>;
export type ConditionObject = Record<string, FieldValue>;
export type FieldList = string | string[];

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  console?: {
    debug?: (...args: unknown[]) => void;
    log?: (...args: unknown[]) => void;
    error?: (...args: unknown[]) => void;
  };
  model: Model;
  max?: number;
  min?: number;
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
  ssl?: boolean | object;
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  order?: string | string[];
  desc?: string | string[];
}

export interface QueryObject {
  table: string;
  fields: FieldList;
  where?: ConditionObject[];
  options: QueryOptions;
}

export interface ModifyObject {
  sql: string;
  args: unknown[];
  options: {
    returning?: FieldList;
  };
}

export class Statement {
  constructor(db: Database, sql: string, args: unknown[]);

  rows(): Promise<RecordData[]>;
  row(params?: RecordData): Promise<RecordData | null>;
  scalar(params?: RecordData): Promise<ScalarValue>;
  col(field: string, params?: RecordData): Promise<ScalarValue[]>;
  dict(
    keyField: string,
    valueField: string,
    params?: RecordData,
  ): Promise<Record<string, ScalarValue>>;
  count(params?: RecordData): Promise<number>;

  then(
    onfulfilled?: (value: RecordData[]) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ): Promise<unknown>;
  catch(onrejected?: (reason: unknown) => unknown): Promise<RecordData[]>;
}

export class Query {
  constructor(
    db: Database,
    table: string,
    fields: FieldList,
    ...where: ConditionObject[]
  );

  order(field: string | string[]): Query;
  desc(field: string | string[]): Query;
  limit(count: number): Query;
  offset(count: number): Query;

  then(
    onfulfilled?: (value: RecordData[]) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ): Promise<unknown>;
  catch(onrejected?: (reason: unknown) => unknown): Promise<RecordData[]>;

  toString(): string;
  toObject(): QueryObject;

  static from(db: Database, metadata: QueryObject): Query;
}

export class Modify {
  constructor(db: Database, sql: string, args: unknown[]);

  returning(field: FieldList): Modify;

  then(
    onfulfilled?: (value: RecordData[]) => unknown,
    onrejected?: (reason: unknown) => unknown,
  ): Promise<unknown>;
  catch(onrejected?: (reason: unknown) => unknown): Promise<RecordData[]>;

  toString(): string;
  toObject(): ModifyObject;

  static from(db: Database, metadata: ModifyObject): Modify;
}

export class Database {
  pool: Pool;
  model: Model;
  console: Console;

  constructor(config: DatabaseConfig);

  close(): Promise<void>;
  query(sql: string, values?: unknown[]): Promise<QueryResult>;
  sql(strings: TemplateStringsArray, ...values: unknown[]): Statement;

  insert(table: string, record: RecordData): Modify;
  select(
    table: string,
    fields: FieldList,
    ...conditions: ConditionObject[]
  ): Query;
  select(table: string, ...conditions: ConditionObject[]): Query;
  update(
    table: string,
    delta: RecordData,
    ...conditions: ConditionObject[]
  ): Modify;
  delete(table: string, ...conditions: ConditionObject[]): Modify;

  row(
    table: string,
    fields: FieldList,
    ...conditions: ConditionObject[]
  ): Promise<RecordData | null>;
  row(
    table: string,
    ...conditions: ConditionObject[]
  ): Promise<RecordData | null>;
  scalar(
    table: string,
    field: string,
    ...conditions: ConditionObject[]
  ): Promise<ScalarValue>;
  col(
    table: string,
    field: string,
    ...conditions: ConditionObject[]
  ): Promise<ScalarValue[]>;
  dict(
    table: string,
    fields: [string, string],
    ...conditions: ConditionObject[]
  ): Promise<Record<string, ScalarValue>>;
  count(table: string, ...conditions: ConditionObject[]): Promise<number>;
}

export function create(modelPath: string, outputPath?: string): Promise<void>;
export function generate(modelPath: string): Promise<void>;
export function migrate(modelPath: string, version?: number): Promise<void>;

export interface CrudPluginInit {
  entities: Record<string, string[]>;
}

export interface CrudPluginResult {
  [key: string]: (
    context: unknown,
  ) => (params: unknown) => Promise<{ result: unknown }>;
}

export interface Plugins {
  crud: (init: CrudPluginInit) => () => CrudPluginResult;
}
