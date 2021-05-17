({
  Registry: {},

  name: { type: 'string', unique: true },
  parent: { type: 'Unit', required: false },
  application: 'Application',

  naturalKey: { unique: ['application', 'name'] },
});
