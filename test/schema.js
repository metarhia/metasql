'use strict';

const { testSync } = require('metatests');
const schema = require('..');

testSync('Compile struct from string', test => {
  const src = `({
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });\n`;

  const expected = {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

  const struct = schema.compileStruct('Company', src);
  test.strictEqual(struct, expected);
});

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

  const entity = schema.createSchema('Company', src);
  test.strictEqual(entity, expected);
});

testSync('Create schema from struct', test => {
  const raw = {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

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

  const entity = new schema.Schema('Company', raw);
  test.strictEqual(entity, expected);
});

testSync('Create model from struct', test => {
  const database = {
    name: 'example',
    description: 'Example database schema',
    version: 3,
    driver: 'pg',
  };
  const types = { ...schema.dbms.pg.types };
  const entities = new Map();
  entities.set('Company', {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  });

  const expected = {
    database: {
      name: 'example',
      description: 'Example database schema',
      version: 3,
      driver: 'pg',
    },
    types: { ...schema.dbms.pg.types },
    entities: new Map([['Company', {
      name: 'Company',
      scope: 'global',
      kind: 'dictionary',
      fields: { name: { type: 'string', unique: true, required: true } },
      indexes: { addresses: { many: 'Address' } },
      validate: null,
      format: null,
      parse: null,
      serialize: null,
    }]]),
    order: new Set(['Company']),
  };

  const model = new schema.DomainModel(database, types, entities);
  test.strictEqual(model, expected);
});

testSync('Export schema to interface', test => {
  const raw = {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

  const expected = `interface Company {
  companyId: number;
  name: string;\n}`;

  const entity = new schema.Schema('Company', raw);
  const iface = schema.toInterface('Company', entity);
  test.strictEqual(iface, expected);
});
