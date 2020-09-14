'use strict';

const path = require('path');
const fs = require('fs').promises;

const { isUpperCamel, cpdir } = require('./utils.js');
const { Schema } = require('./schema.js');

class DatabaseSchema {
  constructor(schemaPath, database) {
    this.path = schemaPath;
    this.database = database;
    this.entities = new Map();
    this.order = new Set();
  }

  static async load(schemaPath) {
    const files = await fs.readdir(schemaPath, { withFileTypes: true });
    const dbPath = path.join(schemaPath, '.database.js');
    const database = await new Schema(dbPath);
    const SchemaClass = DatabaseSchema.implementations[database.driver];
    const dbSchema = new SchemaClass(schemaPath, database);
    for (const file of files) {
      if (file.isDirectory()) continue;
      if (!file.name.endsWith('.js')) continue;
      if (file.name.startsWith('.')) continue;
      const absPath = path.join(schemaPath, file.name);
      const schema = await new Schema(absPath);
      if (!schema) continue;
      const schemaName = path.basename(file.name, '.js');
      dbSchema.entities.set(schemaName, schema);
    }
    await dbSchema.preprocess();
    return dbSchema;
  }

  async preprocess() {
    console.log(`Preprocess metaschema: ${this.path}`);
    for (const name of this.entities.keys()) {
      await this.preprocessEntity(name);
    }
    for (const name of this.entities.keys()) {
      if (!this.order.has(name)) {
        await this.reorderEntity(name);
      }
    }
  }

  async preprocessEntity(name) {
    throw new Error(`Method is not implemented: preprocessEntity(${name})`);
  }

  async reorderEntity(name) {
    const entity = this.entities.get(name);
    const fields = Object.keys(entity);
    for (const field of fields) {
      const { type } = entity[field];
      if (isUpperCamel(type) && !this.order.has(type)) {
        await this.reorderEntity(type);
      }
    }
    this.order.add(name);
  }

  async validate() {
    console.log('Validating metaschema');
    for (const name of this.order) {
      const entity = this.entities.get(name);
      const fields = Object.keys(entity);
      if (entity) console.log(`  ${name}: ${fields.length} fields`);
    }
  }

  async create(outputPath) {
    console.log('Generating SQL DDL script ' + outputPath);
    const script = [];
    for (const name of this.order) {
      const sql = await this.createEntity(name);
      script.push(sql);
    }
    const dbPath = path.join(outputPath, 'database.sql');
    await fs.writeFile(dbPath, script.join('\n\n') + '\n');
  }

  async createEntity(name) {
    throw new Error(`Method is not implemented: createEntity(${name})`);
  }

  async getPreviousSchema() {
    const historyPath = path.join(this.path, 'history');
    const folders = await fs.readdir(historyPath, { withFileTypes: true });
    let version = 0;
    let previousName = '';
    for (const folder of folders) {
      if (!folder.isDirectory()) continue;
      const { name } = folder;
      const v = parseInt(name.substring(name.indexOf('v') + 1), 10);
      if (v > version) {
        version = v;
        previousName = folder.name;
      }
    }
    if (version === 0) return null;
    const previousPath = path.join(historyPath, previousName);
    return DatabaseSchema.load(previousPath);
  }

  async generate() {
    const { name, driver, version } = this.database;
    const now = new Date().toISOString().substring(0, 10);
    console.log(`Migration ${driver} database: ${name} v${version} (${now})`);
    const ps = await this.getPreviousSchema();
    if (!ps) {
      console.log('Previous schema is not found in ../history');
      return;
    }
    const folder = path.basename(ps.path);
    const date = folder.substring(0, folder.lastIndexOf('v') - 1);
    console.log(`Previous schema: v${ps.database.version} (${date})`);
    if (ps.database.version >= version) {
      console.log('You have latest schema version. Migration is not needed.');
      return;
    }
    const newFolder = path.join(this.path, `history/${date}-v${version}`);
    const mig = path.join(this.path, `migration/${date}-v${version}`);
    const migUp = mig + '-up.sql';
    const migDn = mig + '-dn.sql';
    console.log(`Save history: ${newFolder}`);
    await fs.mkdir(newFolder);
    await cpdir(this.path, newFolder);
    console.log(`Migration up: ${migUp}`);
    console.log(`Migration down: ${migDn}`);
  }
}

DatabaseSchema.implementations = {};

const create = async (schemaPath, outputPath) => {
  const schema = await DatabaseSchema.load(schemaPath);
  await schema.create(outputPath);
};

const generate = async schemaPath => {
  const schema = await DatabaseSchema.load(schemaPath);
  await schema.generate();
};

module.exports = {
  DatabaseSchema,
  create,
  generate,
};
