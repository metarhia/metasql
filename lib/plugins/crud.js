'use strict';

module.exports = (init) => () => {
  const unit = {};
  const { entities } = init;
  const database = db.pg;
  for (const [entity, methods] of Object.entries(entities)) {
    if (methods.includes('create')) {
      unit['create' + entity] = (context) => async (record) => {
        if (!context) throw new Error('Cant execute CREATE');
        const result = await database.insert(entity, record);
        return { result };
      };
    }
    if (methods.includes('get')) {
      unit['get' + entity] = (context) => async (conditions) => {
        if (!context) throw new Error('Cant execute GET');
        const result = await database.row(entity, conditions);
        return { result };
      };
    }
    if (methods.includes('select')) {
      unit['select' + entity] = (context) => async (conditions) => {
        if (!context) throw new Error('Cant execute SELECT');
        const result = await database.select(entity, conditions);
        return { result };
      };
    }
    if (methods.includes('update')) {
      unit['update' + entity] = (context) => async (args) => {
        if (!context) throw new Error('Cant execute UPDATE');
        const { delta, conditions } = args;
        const result = await database.update(entity, delta, conditions);
        return { result };
      };
    }
    if (methods.includes('delete')) {
      unit['delete' + entity] = (context) => async (conditions) => {
        if (!context) throw new Error('Cant execute DELETE');
        const result = await database.delete(entity, conditions);
        return { result };
      };
    }
  }
  return unit;
};
