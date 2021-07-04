export class Database {
  count(table: string, condition?: object): Promise<number>;
}
