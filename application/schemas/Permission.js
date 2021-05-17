({
  Relation: {},

  role: 'Role',
  identifier: 'Identifier',
  action: {
    type: 'string',
    lookup: ['read', 'insert', 'update', 'delete', 'audit'],
  },

  naturalKey: { unique: ['role', 'identifier'] },
});
