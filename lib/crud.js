'use strict';

module.exports = (init) => {
  const iface = {};
  const { entities, database } = init;
  for (const [entity, methods] of Object.entries(entities)) {
    if (methods.includes('create')) {
      iface['create' + entity] = () => async (record) => {
        const result = await database.insert(entity, record);
        return { result };
      };
    }
    if (methods.includes('get')) {
      iface['get' + entity] = () => async (conditions) => {
        const result = await database.row(entity, conditions);
        return { result };
      };
    }
    if (methods.includes('select')) {
      iface['select' + entity] = () => async (conditions) => {
        const result = await database.select(entity, conditions);
        return { result };
      };
    }
    if (methods.includes('update')) {
      iface['update' + entity] = () => async ({ delta, conditions }) => {
        const result = await database.update(entity, delta, conditions);
        return { result };
      };
    }
    if (methods.includes('delete')) {
      iface['delete' + entity] = () => async (conditions) => {
        const result = await database.delete(entity, conditions);
        return { result };
      };
    }
  }
  return iface;
};
