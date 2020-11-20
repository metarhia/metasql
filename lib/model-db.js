'use strict';

const path = require('path');
const fs = require('fs').promises;

const schema = require('./schema-fs.js');
const { cpdir, shorten } = require('./utils.js');

const dbms = {};

const loadModel = async (modelPath) => {
  const structs = await schema.readDirectory(modelPath);
  const database = structs.get('.database');
  structs.delete('.database');
  if (!database) {
    throw new Error(`File is not found: ${modelPath}/.database.js`);
  }
  const dbmsTypes = dbms[database.driver].types;
  const customTypes = structs.get('.types') || {};
  structs.delete('.types');
  const types = { ...dbmsTypes, ...customTypes };
  const databaseModel = new schema.DomainModel(database, types, structs);
  return databaseModel;
};

const getPreviousVersion = async (modelPath) => {
  const historyPath = path.join(modelPath, 'history');
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
  return loadModel(previousPath);
};

const saveTypes = async (model, outputPath) => {
  const filePath = path.join(outputPath, 'database.d.ts');
  console.log('Generating types ' + shorten(filePath));
  const dts = [];
  for (const name of model.order) {
    const entity = model.entities.get(name);
    dts.push(schema.toInterface(name, entity));
  }
  await fs.writeFile(filePath, dts.join('\n\n') + '\n');
};

const create = async (modelPath, outputPath) => {
  console.log('Generating SQL DDL script ' + shorten(outputPath));
  const model = await loadModel(modelPath);
  const script = [];
  const { createEntity } = dbms[model.database.driver];
  for (const name of model.order) {
    const sql = createEntity(model, name);
    script.push(sql);
  }
  const dbPath = path.join(outputPath, 'database.sql');
  await fs.writeFile(dbPath, script.join('\n\n') + '\n');
  await saveTypes(model, outputPath);
};

const generate = async (modelPath) => {
  const model = await loadModel(modelPath);
  const { name, driver, version } = model.database;
  const now = new Date().toISOString().substring(0, 10);
  console.log(`Generate migration: ${driver}:${name} v${version} (${now})`);
  const ps = await getPreviousVersion(modelPath);
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
  const newFolder = path.join(modelPath, `history/${date}-v${version}`);
  const mig = path.join(modelPath, `migration/${date}-v${version}`);
  const migUp = mig + '-up.sql';
  const migDn = mig + '-dn.sql';
  console.log(`Save history: ${shorten(newFolder)}`);
  await fs.mkdir(newFolder);
  await cpdir(modelPath, newFolder);
  console.log(`Migration up: ${shorten(migUp)})`);
  console.log(`Migration down: ${shorten(migDn)}`);
};

const migrate = async (modelPath, version) => {
  const model = await loadModel(modelPath);
  const { execute } = dbms[model.database.driver];
  if (version) console.log(`Migration to this version: ${version}`);
  else console.log('Migration to the latest version');
  const migPath = path.join(modelPath, `migrations`);
  const files = await fs.readdir(migPath, { withFileTypes: true });
  files.sort((a, b) => (a.name < b.name ? -1 : 1));
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
      await execute(sql);
    }
  }
};

module.exports = {
  dbms,
  create,
  generate,
  migrate,
};
