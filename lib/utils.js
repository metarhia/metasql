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

const toLowerCamel = (s) => s.charAt(0).toLowerCase() + s.slice(1);
const toUpperCamel = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const isUpperCamel = (s) => !!s && s[0] === s[0].toUpperCase();

const shorten = (dir) => {
  const pos = dir.lastIndexOf('/');
  return pos !== -1 ? dir.substring(pos) : dir;
};

module.exports = {
  cpdir,
  toLowerCamel,
  toUpperCamel,
  isUpperCamel,
  shorten,
};
