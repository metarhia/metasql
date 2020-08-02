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

module.exports = {
  escapeIdentifier,
  escapeKey,
  mapJoinIterable,
  joinIterable,
};
