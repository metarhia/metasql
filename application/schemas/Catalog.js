({
  Registry: {},

  name: { type: 'string', unique: true },
  parent: { type: 'Catalog', required: false },
  entities: { many: 'Identifier' },
});
