'use strict';

const { testSync } = require('metatests');
const { createSchema } = require('..');

testSync('Create schema from string', test => {
  const src = `({
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });\n`;

  const expected = {
    name: 'Company',
    scope: 'global',
    kind: 'dictionary',
    fields: { name: { type: 'string', unique: true, required: true } },
    indexes: { addresses: { many: 'Address' } },
    validate: null,
    format: null,
    parse: null,
    serialize: null,
  };

  const schema = createSchema('Company', src);
  test.strictEqual(schema, expected);
});
