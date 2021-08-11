export class Database {
  count(table: string, ...conditions: Array<object>): Promise<number>;
}
