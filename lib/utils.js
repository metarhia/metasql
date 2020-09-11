'use strict';

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

const toLowerCamel = s => s.charAt(0).toLowerCase() + s.slice(1);
const toUpperCamel = s => s.charAt(0).toUpperCase() + s.slice(1);
const isUpperCamel = s => !!s && s[0] === s[0].toUpperCase();

module.exports = {
  escapeIdentifier,
  escapeKey,
  mapJoinIterable,
  joinIterable,
  toLowerCamel,
  toUpperCamel,
  isUpperCamel,
};
