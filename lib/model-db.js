'use strict';

const path = require('path');
const fs = require('fs').promises;

const { cpdir, shorten } = require('./utils.js');
const schema = require('./schema-fs.js');

class DatabaseModel {
  constructor(modelPath, database, types = {}) {
    this.path = modelPath;
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
    const ModelClass = DatabaseModel.implementations[database.driver];
    const databaseModel = new ModelClass(modelPath, database, types);
    databaseModel.entities = model;
    schema.preprocessModel(databaseModel);
    return databaseModel;
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

  async getPreviousVersion() {
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
    return DatabaseModel.load(previousPath);
  }

  async generate() {
    const { name, driver, version } = this.database;
    const now = new Date().toISOString().substring(0, 10);
    console.log(`Generate migration: ${driver}:${name} v${version} (${now})`);
    const ps = await this.getPreviousVersion();
    if (!ps) {
      console.log('Previous version is not found in ../history');
      return;
    }
    const folder = path.basename(ps.path);
    const date = folder.substring(0, folder.lastIndexOf('v') - 1);
    console.log(`Previous version: v${ps.database.version} (${date})`);
    if (ps.database.version >= version) {
      console.log('You have latest model version. Migration is not needed.');
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
      const entity = this.entities.get(name);
      dts.push(schema.toInterface(name, entity));
    }
    await fs.writeFile(filePath, dts.join('\n\n') + '\n');
  }
}

DatabaseModel.implementations = {};

const create = async (modelPath, outputPath) => {
  const model = await DatabaseModel.load(modelPath);
  await model.create(outputPath);
  await model.saveTypes(outputPath);
};

const generate = async modelPath => {
  const model = await DatabaseModel.load(modelPath);
  await model.generate();
};

const migrate = async (modelPath, version) => {
  const model = await DatabaseModel.load(modelPath);
  await model.migrate(version);
};

module.exports = {
  DatabaseModel,
  create,
  generate,
  migrate,
};
