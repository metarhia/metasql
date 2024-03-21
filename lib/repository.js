'use strict';

class Repository {
  constructor(tableName, database) {
    this.tableName = tableName;
    this.db = database;
  }
  async select(where, fields = ['*']) {
    return this.db.select(this.tableName, fields, where);
  }

  async update(data, where) {
    return this.db.update(this.tableName, data, where);
  }

  async create(data) {
    return this.db.insert(this.tableName, data);
  }

  async remove(data) {
    return this.db.delete(this.tableName, data);
  }

  async query(sql, values) {
    return this.db.query(sql, values);
  }
}

module.exports = { Repository };
