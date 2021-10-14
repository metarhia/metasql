'use strict';

const path = require('path');
const fsp = require('fs').promises;
const { Model, Schema } = require('metaschema');

const dbms = {};

const isUtilityFile = (file) => {
  const firstCh = file[0];
  return firstCh === '.' || firstCh === firstCh.toLowerCase();
};

const makeVersionName = (v, date) => `${date}--v${v}`;

const cpdir = async (from, to, filter) => {
  await fsp.mkdir(to, { recursive: true });
  const files = await fsp.readdir(from, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) continue;
    const basename = file.name.slice(0, file.name.lastIndexOf('.'));
    if (!isUtilityFile(file.name) && filter && !filter.includes(basename)) {
      continue;
    }
    const fromPath = path.join(from, file.name);
    const toPath = path.join(to, file.name);
    await fsp.copyFile(fromPath, toPath);
  }
};

const shorten = (dir, target = null) => {
  if (target) {
    return path.relative(target, dir);
  }
  const pos = dir.lastIndexOf(path.sep);
  return pos !== -1 ? dir.slice(pos) : dir;
};

const diffModels = (oldModel, newModel) => {
  if (oldModel === newModel) return [];
  const newSchemas = [];
  for (const [name, schema] of newModel.entities) {
    const oldSchema = oldModel.entities.get(name);
    if (!oldSchema || JSON.stringify(oldSchema) !== JSON.stringify(schema)) {
      newSchemas.push(name);
    }
  }
  return newSchemas;
};

const loadModel = async (modelPath) => {
  const dbmsTypes = dbms.pg.types;
  const model = await Model.load(modelPath, dbmsTypes);
  if (!model.database) {
    throw new Error(`File is not found: ${modelPath}/.database.js`);
  }
  return model;
};

const replaceModelVersion = async (newVersion, modelPath) => {
  const databasePath = path.join(modelPath, '.database.js');
  const existingFile = await fsp.readFile(databasePath, { encoding: 'utf8' });
  const newFile = existingFile.replace(
    /version: \d+/,
    `version: ${newVersion}`
  );
  await fsp.writeFile(databasePath, newFile, { encoding: 'utf8' });
};

const getPreviousVersion = async (modelPath, historyPath) => {
  const folders = await fsp
    .readdir(historyPath, { withFileTypes: true })
    .catch(() => []);
  let version = 0;
  let previousName = '';
  for (const folder of folders) {
    if (!folder.isDirectory()) continue;
    const { name } = folder;
    const v = parseInt(/v(\d+)/.exec(name)[1], 10);
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
  const ins = [];
  const upd = [];
  const { createEntity, registerEntity } = dbms[model.database.driver];
  for (const name of model.order) {
    const entity = model.entities.get(name);
    if (Schema.KIND_STORED.includes(entity.kind)) {
      script.push(createEntity(model, name));
      if (model.entities.get('Identifier')) {
        const { inserts, updates } = registerEntity(model, name);
        ins.push(inserts);
        upd.push(updates);
      }
    }
  }
  if (ins.length) script.push('', ...ins, '', ...upd, '');
  const dbPath = path.join(outputPath, 'database.sql');
  await fsp.writeFile(dbPath, script.join('\n'));
  const dtsPath = path.join(outputPath, 'database.d.ts');
  await model.saveTypes(dtsPath);
};

const createMigrations = async (migrationPath, fullVersion, cwd) => {
  const mig = path.join(migrationPath, fullVersion);
  await fsp.mkdir(mig, { recursive: true });
  const migUp = path.join(migrationPath, `${mig}-up.sql`);
  await fsp.writeFile(migUp, '', { encoding: 'utf8' });
  const migDn = path.join(migrationPath, `${mig}-dn.sql`);
  await fsp.writeFile(migDn, '', { encoding: 'utf8' });
  console.log(`Migration up: ${shorten(migUp, cwd)}`);
  console.log(`Migration down: ${shorten(migDn, cwd)}`);
};

const generate = async (modelPath, cwd = process.cwd()) => {
  const historyPath = path.join(modelPath, 'history');
  const migrationPath = path.join(modelPath, 'migration');
  const currentModel = await loadModel(modelPath);
  const { name, driver, version } = currentModel.database;
  const now = new Date().toISOString().replace(/:/g, '-').split('.')[0];
  console.log(`Generating new migration: ${driver}:${name}`);
  const previousPath = await getPreviousVersion(modelPath, historyPath);

  let previousModel;
  if (!previousPath) {
    console.log(`Previous version not found in ${shorten(historyPath, cwd)}`);
    const oldVersionPath = path.join(
      modelPath,
      'history',
      makeVersionName(version, now)
    );
    console.log(
      `Saving current as old version to ${shorten(oldVersionPath, cwd)}`
    );
    await fsp.mkdir(oldVersionPath, { recursive: true });
    await cpdir(modelPath, oldVersionPath);
    previousModel = currentModel;
  } else {
    console.log(`Previous version is found in ${shorten(previousPath, cwd)}`);
    console.log(`Saving current as new version`);
    previousModel = await loadModel(previousPath);
  }

  const newVersion =
    currentModel.database.version <= previousModel.database.version
      ? previousModel.database.version + 1
      : currentModel.database.version;

  if (currentModel.database.version !== newVersion) {
    currentModel.database.version = newVersion;
    await replaceModelVersion(newVersion, modelPath);
  }

  const fullVersion = makeVersionName(newVersion, now);
  const versionPath = path.join(historyPath, fullVersion);
  console.log(
    `New version: v${newVersion} (${now}) to ${shorten(versionPath, cwd)}`
  );

  const newSchemas = diffModels(previousModel, currentModel);
  await cpdir(modelPath, versionPath, newSchemas);
  await createMigrations(migrationPath, fullVersion, cwd);
};

const migrate = async (modelPath, toVersion) => {
  const model = await loadModel(modelPath);
  const { execute } = dbms[model.database.driver];
  if (toVersion) console.log(`Migration to this version: ${toVersion}`);
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
    if (!toVersion || v <= toVersion) {
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
