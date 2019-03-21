'use strict';

const escapeIdentifier = name => `"${name}"`;

const escapeKey = (key, escapeIdentifier) =>
  key
    .split('.')
    .map(k => (k === '*' ? '*' : escapeIdentifier(k)))
    .join('.');

module.exports = {
  escapeIdentifier,
  escapeKey,
};
