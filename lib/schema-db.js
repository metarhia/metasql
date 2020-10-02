'use strict';

const path = require('path');
const fs = require('fs').promises;

const { isUpperCamel, cpdir } = require('./utils.js');
const { Schema } = require('./schema.js');

const shorten = dir => {
  const pos = dir.lastIndexOf('/');
  return pos !== -1 ? dir.substring(pos) : dir;
};

class DatabaseSchema {
  constructor(schemaPath, database, types) {
    this.path = schemaPath;
    this.database = database;
    this.types = types;
    this.entities = new Map();
    this.order = new Set();
  }

  static async load(schemaPath) {
    const files = await fs.readdir(schemaPath, { withFileTypes: true });
    const dbPath = path.join(schemaPath, '.database.js');
    const dbSchema = await new Schema(dbPath);
    if (!dbSchema) throw new Error(`File is not found: ${dbPath}`);
    const { entity: database } = dbSchema;
    const typesPath = path.join(schemaPath, '.types.js');
    const typesSchema = await new Schema(typesPath);
    if (!typesSchema) console.log(`File is not found: ${shorten(typesPath)}`);
    const { entity: types } = typesSchema || { entity: {} };
    const SchemaClass = DatabaseSchema.implementations[database.driver];
    const databaseSchema = new SchemaClass(schemaPath, database, types);
    for (const file of files) {
      if (file.isDirectory()) continue;
      if (!file.name.endsWith('.js')) continue;
      if (file.name.startsWith('.')) continue;
      const absPath = path.join(schemaPath, file.name);
      const schema = await new Schema(absPath);
      if (!schema) continue;
      const schemaName = path.basename(file.name, '.js');
      databaseSchema.entities.set(schemaName, schema);
    }
    await databaseSchema.preprocess();
    return databaseSchema;
  }

  async preprocess() {
    console.log(`Preprocess metaschema: ${shorten(this.path)}`);
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

  async reorderEntity(name, base = name) {
    const { entity } = this.entities.get(name);
    const fields = Object.keys(entity);
    for (const field of fields) {
      const { type } = entity[field];
      if (type === base) {
        console.log(`Recursive dependency: ${name}.${base}`);
        continue;
      }
      if (isUpperCamel(type) && !this.order.has(type)) {
        await this.reorderEntity(type, base);
      }
    }
    this.order.add(name);
  }

  async validate() {
    console.log('Validating metaschema');
    for (const name of this.order) {
      const { entity } = this.entities.get(name);
      const fields = Object.keys(entity);
      if (entity) console.log(`  ${name}: ${fields.length} fields`);
    }
  }

  async create(outputPath) {
    console.log('Generating SQL DDL script ' + shorten(outputPath));
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
      const schema = this.entities.get(name);
      dts.push(schema.toInterface());
    }
    await fs.writeFile(filePath, dts.join('\n\n') + '\n');
  }
}

DatabaseSchema.implementations = {};

const create = async (schemaPath, outputPath) => {
  const schema = await DatabaseSchema.load(schemaPath);
  await schema.create(outputPath);
  await schema.saveTypes(outputPath);
};

const generate = async schemaPath => {
  const schema = await DatabaseSchema.load(schemaPath);
  await schema.generate();
};

const migrate = async (schemaPath, version) => {
  const schema = await DatabaseSchema.load(schemaPath);
  await schema.migrate(version);
};

module.exports = {
  DatabaseSchema,
  create,
  generate,
  migrate,
};
