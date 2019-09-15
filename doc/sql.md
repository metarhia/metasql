# API Documentation

## Interface: sql

### class QueryBuilder

Base class for all QueryBuilders

#### QueryBuilder.prototype.constructor(params, options)

- `params`: [`<ParamsBuilder>`][paramsbuilder]
- `options`: [`<Object>`][object]
  - `escapeIdentifier`: [`<Function>`][function]
    - `identifier`: [`<string>`][string] to escape
  - _Returns:_ [`<string>`][string] escaped string

#### QueryBuilder.prototype.build()

_Returns:_ [`<string>`][string]

Generic building method that must return the resulting SQL

### class SelectBuilder extends QueryBuilder

#### SelectBuilder.prototype.constructor(params, options)

#### SelectBuilder.prototype.avg(field)

#### SelectBuilder.prototype.build()

#### SelectBuilder.prototype.count(field = '\*')

#### SelectBuilder.prototype.distinct()

#### SelectBuilder.prototype.from(tableName)

#### SelectBuilder.prototype.groupBy(...fields)

#### SelectBuilder.prototype.innerJoin(tableName, leftKey, rightKey)

#### SelectBuilder.prototype.limit(limit)

#### SelectBuilder.prototype.max(field)

#### SelectBuilder.prototype.min(field)

#### SelectBuilder.prototype.offset(offset)

#### SelectBuilder.prototype.orderBy(field, dir = 'ASC')

#### SelectBuilder.prototype.processOperations(query, operations, functionHandlers)

#### SelectBuilder.prototype.processOrder(query, clauses)

#### SelectBuilder.prototype.processSelect(query, clauses)

#### SelectBuilder.prototype.processWhere(query, clauses)

#### SelectBuilder.prototype.select(...fields)

#### SelectBuilder.prototype.sum(field)

#### SelectBuilder.prototype.where(key, cond, value)

#### SelectBuilder.prototype.whereAny(key, value)

#### SelectBuilder.prototype.whereExists(subquery)

#### SelectBuilder.prototype.whereIn(key, conds)

#### SelectBuilder.prototype.whereNot(key, cond, value)

#### SelectBuilder.prototype.whereNotIn(key, conds)

#### SelectBuilder.prototype.whereNotNull(key)

#### SelectBuilder.prototype.whereNull(key)

### class RawBuilder extends QueryBuilder

#### RawBuilder.prototype.constructor(sqlTemplate)

- `sqlTemplate`: [`<Function>`][function]
  - `params`: [`<ParamsBuilder>`][paramsbuilder]
- _Returns:_ [`<string>`][string] query

#### RawBuilder.prototype.build()

### class ParamsBuilder

Base class for all ParamsBuilders

#### ParamsBuilder.prototype.constructor()

Base class for all ParamsBuilders

#### ParamsBuilder.prototype.add(value, options)

- `value`: `<any>`
- `options`: [`<Object>`][object] optional

_Returns:_ [`<string>`][string] name to put in an sql query

Add passed value to parameters

#### ParamsBuilder.prototype.build()

_Returns:_ [`<string>`][string]

Generic building method that must return the resulting SQL

### class PostgresParamsBuilder extends [ParamsBuilder][paramsbuilder]

#### PostgresParamsBuilder.prototype.constructor()

#### PostgresParamsBuilder.prototype.add(value, options)

- `value`: `<any>`
- `options`: [`<Object>`][object] optional

_Returns:_ [`<string>`][string] name to put in a sql query

Add passed value to parameters

#### PostgresParamsBuilder.prototype.build()

_Returns:_ `<any>`

Generic building method that must return the parameters object

[paramsbuilder]: ../lib/params-builder.js
[object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type
