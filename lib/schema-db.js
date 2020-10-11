'use strict';

const path = require('path');
const fs = require('fs').promises;

const { isUpperCamel, cpdir, shorten } = require('./utils.js');
const schema = require('./schema-fs.js');

class DatabaseSchema {
  constructor(schemaPath, database, types = {}) {
    this.path = schemaPath;
    this.database = database;
    this.types = types;
    this.entities = new Map();
    this.order = new Set();
  }

  static async load(modelPath) {
    const model = await schema.readModel(modelPath);
    const database = model.get('.database');
    if (!database) {
      throw new Error(`File is not found: ${modelPath}/.database.js`);
    }
    const types = model.get('.types');
    const SchemaClass = DatabaseSchema.implementations[database.driver];
    const databaseSchema = new SchemaClass(modelPath, database, types);
    databaseSchema.entities = model;
    schema.preprocessModel(databaseSchema);
    return databaseSchema;
  }

  preprocessEntity(name) {
    throw new Error(`Method is not implemented: preprocessEntity(${name})`);
  }

  reorderEntity(name, base = name) {
    const entity = this.entities.get(name);
    const fields = Object.keys(entity);
    for (const field of fields) {
      const { type } = entity[field];
      if (type === base) {
        console.log(`Recursive dependency: ${name}.${base}`);
        continue;
      }
      if (isUpperCamel(type) && !this.order.has(type)) {
        this.reorderEntity(type, base);
      }
    }
    this.order.add(name);
  }

  async create(outputPath) {
    console.log('Generating SQL DDL script ' + shorten(outputPath));
    const script = [];
    for (const name of this.order) {
      const sql = this.createEntity(name);
      script.push(sql);
    }
    const dbPath = path.join(outputPath, 'database.sql');
    await fs.writeFile(dbPath, script.join('\n\n') + '\n');
  }

  createEntity(name) {
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
    console.log(`Generate migration: ${driver}:${name} v${version} (${now})`);
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
    console.log(`Save history: ${shorten(newFolder)}`);
    await fs.mkdir(newFolder);
    await cpdir(this.path, newFolder);
    console.log(`Migration up: ${shorten(migUp)})`);
    console.log(`Migration down: ${shorten(migDn)}`);
  }

  async migrate(version) {
    if (version) console.log(`Migration to this version: ${version}`);
    else console.log('Migration to the latest version');
    const migPath = path.join(this.path, `migrations`);
    const files = await fs.readdir(migPath, { withFileTypes: true });
    files.sort((a, b) => a.name < b.name ? -1 : 1);
    for (const file of files) {
      if (file.isDirectory()) continue;
      const { name } = file;
      const from = name.lastIndexOf('v') + 1;
      const to = name.lastIndexOf('-');
      const v = parseInt(name.substring(from, to), 10);
      if (!name.endsWith('-up.sql')) continue;
      if (!version || v <= version) {
        const fileName = path.join(migPath, name);
        const sql = await fs.readFile(fileName, 'utf8');
        console.log(`Apply script: ${name}`);
        await this.execute(sql);
      }
    }
  }

  async execute(sql) {
    throw new Error(`Method is not implemented: execute(${sql})`);
  }

  async saveTypes(outputPath) {
    const filePath = path.join(outputPath, 'database.d.ts');
    console.log('Generating types ' + shorten(filePath));
    const dts = [];
    for (const name of this.order) {
      const entitySchema = this.entities.get(name);
      dts.push(schema.toInterface(name, entitySchema));
    }
    await fs.writeFile(filePath, dts.join('\n\n') + '\n');
  }
}

DatabaseSchema.implementations = {};

const create = async (schemaPath, outputPath) => {
  const dbSchema = await DatabaseSchema.load(schemaPath);
  await dbSchema.create(outputPath);
  await dbSchema.saveTypes(outputPath);
};

const generate = async schemaPath => {
  const dbSchema = await DatabaseSchema.load(schemaPath);
  await dbSchema.generate();
};

const migrate = async (schemaPath, version) => {
  const dbSchema = await DatabaseSchema.load(schemaPath);
  await dbSchema.migrate(version);
};

module.exports = {
  DatabaseSchema,
  create,
  generate,
  migrate,
};
