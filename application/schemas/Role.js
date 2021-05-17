({
  Entity: {},

  name: { type: 'string', unique: true },
  application: 'Application',
  active: { type: 'boolean', default: true },

  naturalKey: { unique: ['application', 'name'] },
});
