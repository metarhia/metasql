'use strict';

const path = require('path');
const fs = require('fs').promises;

const schema = require('./schema.js');

const readStruct = async (name, structPath) => {
  try {
    const src = await fs.readFile(structPath, 'utf8');
    if (!src) return null;
    return schema.compileStruct(name, src);
  } catch {
    return null;
  }
};

const readDirectory = async dirPath => {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  const structs = new Map();
  for (const file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith('.js')) continue;
    const absPath = path.join(dirPath, file.name);
    const name = path.basename(file.name, '.js');
    const struct = await readStruct(name, absPath);
    structs.set(name, struct);
  }
  return structs;
};

module.exports = { ...schema, readStruct, readDirectory };
