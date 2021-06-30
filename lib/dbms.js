'use strict';

const path = require('path');
const fsp = require('fs').promises;
const { Model, Schema } = require('metaschema');

const dbms = {};

const cpdir = async (from, to) => {
  const files = await fsp.readdir(from, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) continue;
    const fromPath = path.join(from, file.name);
    const toPath = path.join(to, file.name);
    await fsp.copyFile(fromPath, toPath);
  }
};

const shorten = (dir) => {
  const pos = dir.lastIndexOf('/');
  return pos !== -1 ? dir.substring(pos) : dir;
};

const loadModel = async (modelPath) => {
  const dbmsTypes = dbms.pg.types;
  const model = await Model.load(modelPath, dbmsTypes);
  if (!model.database) {
    throw new Error(`File is not found: ${modelPath}/.database.js`);
  }
  return model;
};

const getPreviousVersion = async (modelPath) => {
  const historyPath = path.join(modelPath, 'history');
  const folders = await fsp.readdir(historyPath, { withFileTypes: true });
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
  return path.join(historyPath, previousName);
};

const create = async (modelPath, outputPath = modelPath) => {
  console.log('Generating SQL DDL script ' + shorten(outputPath));
  const model = await loadModel(modelPath);
  const script = [];
  const { createEntity } = dbms[model.database.driver];
  for (const name of model.order) {
    const entity = model.entities.get(name);
    if (Schema.KIND_STORED.includes(entity.kind)) {
      const sql = createEntity(model, name);
      script.push(sql);
    }
  }
  const dbPath = path.join(outputPath, 'database.sql');
  await fsp.writeFile(dbPath, script.join('\n\n') + '\n');
  const dtsPath = path.join(outputPath, 'database.d.ts');
  await model.saveTypes(dtsPath);
};

const generate = async (modelPath) => {
  const model = await loadModel(modelPath);
  const { name, driver, version } = model.database;
  const now = new Date().toISOString().substring(0, 10);
  console.log(`Generate migration: ${driver}:${name} v${version} (${now})`);
  const previousPath = await getPreviousVersion(modelPath).catch(() => {});
  if (!previousPath) {
    console.log('Previous version is not found in ../history');
    return;
  }
  const ps = await loadModel(previousPath);
  const folder = path.basename(previousPath);
  const date = folder.substring(0, folder.lastIndexOf('v') - 1);
  console.log(`Previous version: v${ps.database.version} (${date})`);
  if (ps.database.version >= version) {
    console.log('You have latest model version. Migration is not needed.');
    return;
  }
  const newFolder = path.join(modelPath, `history/${now}-v${version}`);
  const mig = path.join(modelPath, `migration/${now}-v${version}`);
  const migUp = mig + '-up.sql';
  const migDn = mig + '-dn.sql';
  console.log(`Save history: ${shorten(newFolder)}`);
  await fsp.mkdir(newFolder, { recursive: true });
  await cpdir(modelPath, newFolder);
  console.log(`Migration up: ${shorten(migUp)}`);
  console.log(`Migration down: ${shorten(migDn)}`);
};

const migrate = async (modelPath, version) => {
  const model = await loadModel(modelPath);
  const { execute } = dbms[model.database.driver];
  if (version) console.log(`Migration to this version: ${version}`);
  else console.log('Migration to the latest version');
  const migPath = path.join(modelPath, `migrations`);
  const files = await fsp.readdir(migPath, { withFileTypes: true });
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
      const sql = await fsp.readFile(fileName, 'utf8');
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
