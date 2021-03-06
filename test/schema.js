'use strict';

const { testSync } = require('metatests');
const { Schema } = require('metaschema');
const metasql = require('..');

testSync('Create model from struct', (test) => {
  const database = {
    name: 'example',
    description: 'Example database schema',
    version: 3,
    driver: 'pg',
  };
  const types = { ...metasql.dbms.pg.types };
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
    types: { ...metasql.dbms.pg.types },
    entities: new Map([
      [
        'Company',
        {
          name: 'Company',
          scope: 'global',
          kind: 'dictionary',
          fields: { name: { type: 'string', unique: true, required: true } },
          indexes: { addresses: { many: 'Address' } },
          validate: null,
          format: null,
          parse: null,
          serialize: null,
        },
      ],
    ]),
    order: new Set(['Company']),
  };

  const model = new metasql.DomainModel(database, types, entities);
  test.strictEqual(model, expected);
});

testSync('Export schema to interface', (test) => {
  const raw = {
    Company: 'global dictionary',
    name: { type: 'string', unique: true },
    addresses: { many: 'Address' },
  };

  const expected = `interface Company {
  companyId: number;
  name: string;\n}`;

  const entity = new Schema('Company', raw);
  const iface = metasql.toInterface('Company', entity);
  test.strictEqual(iface, expected);
});
