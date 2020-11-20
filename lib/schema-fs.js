'use strict';

const path = require('path');
const fs = require('fs').promises;
const metavm = require('metavm');

const schema = require('./schema.js');

const readDirectory = async (dirPath) => {
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  const structs = new Map();
  for (const file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith('.js')) continue;
    const absPath = path.join(dirPath, file.name);
    const { name, exports } = await metavm.readScript(absPath);
    structs.set(name, exports);
  }
  return structs;
};

module.exports = { ...schema, readDirectory };
