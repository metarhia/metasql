'use strict';

const path = require('path');
const fs = require('fs').promises;

const cpdir = async (from, to) => {
  const files = await fs.readdir(from, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) continue;
    const fromPath = path.join(from, file.name);
    const toPath = path.join(to, file.name);
    await fs.copyFile(fromPath, toPath);
  }
};

const shorten = (dir) => {
  const pos = dir.lastIndexOf('/');
  return pos !== -1 ? dir.substring(pos) : dir;
};

module.exports = {
  cpdir,
  shorten,
};
