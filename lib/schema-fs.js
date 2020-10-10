'use strict';

const path = require('path');
const fs = require('fs').promises;

const schema = require('./schema.js');

const readSchema = async schemaPath => {
  const name = path.basename(schemaPath, '.js');
  try {
    const src = await fs.readFile(schemaPath, 'utf8');
    if (!src) return null;
    return schema.createSchema(name, src);
  } catch {
    return null;
  }
};

const readModel = async modelPath => {
  const files = await fs.readdir(modelPath, { withFileTypes: true });
  const model = new Map();
  for (const file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith('.js')) continue;
    const absPath = path.join(modelPath, file.name);
    const entity = await readSchema(absPath);
    if (!entity) continue;
    const name = path.basename(file.name, '.js');
    model.set(name, entity);
  }
  return model;
};

module.exports = { ...schema, readSchema, readModel };
