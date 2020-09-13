'use strict';

const path = require('path');
const fs = require('fs').promises;

const escapeIdentifier = name => `"${name}"`;

const escapeKey = (key, escapeIdentifier) =>
  key
    .split('.')
    .map(k => (k === '*' ? '*' : escapeIdentifier(k)))
    .join('.');

const mapJoinIterable = (val, mapper, sep) => {
  const it = val[Symbol.iterator]();
  const { done, value } = it.next();
  if (done) return '';
  let res = mapper(value);
  for (const value of it) {
    res += sep + mapper(value);
  }
  return res;
};

const joinIterable = (val, sep) => {
  const it = val[Symbol.iterator]();
  const { done, value } = it.next();
  if (done) return '';
  let res = String(value);
  for (const value of it) {
    res += sep + value;
  }
  return res;
};

const cpdir = async (from, to) => {
  const files = await fs.readdir(from, { withFileTypes: true });
  for (const file of files) {
    if (file.isDirectory()) continue;
    const fromPath = path.join(from, file.name);
    const toPath = path.join(to, file.name);
    await fs.copyFile(fromPath, toPath);
  }
};

const toLowerCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
const toUpperCamel = s => s.charAt(0).toUpperCase() + s.slice(1);
const isUpperCamel = s => !!s && s[0] === s[0].toUpperCase();

module.exports = {
  escapeIdentifier,
  escapeKey,
  mapJoinIterable,
  joinIterable,
  cpdir,
  toLowerCamel,
  toUpperCamel,
  isUpperCamel,
};
