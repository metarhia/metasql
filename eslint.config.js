'use strict';

const init = require('eslint-config-metarhia');

module.exports = [
  ...init,
  {
    files: ['lib/plugins/*.js'],
    languageOptions: {
      globals: {
        db: true,
      },
    },
  },
];
