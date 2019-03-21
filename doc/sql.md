# API Documentation

### Interface: sql

#### QueryBuilder()

Base class for all QueryBuilders

#### QueryBuilder.prototype.constructor()

Base class for all QueryBuilders

#### QueryBuilder.prototype.build()

_Returns:_ [`<string>`][string]

Generic building method that must return the resulting SQL

#### SelectBuilder()

#### SelectBuilder.prototype.constructor()

#### SelectBuilder.prototype.from()

#### SelectBuilder.prototype.select()

#### SelectBuilder.prototype.innerJoin()

#### SelectBuilder.prototype.distinct()

#### SelectBuilder.prototype.where()

#### SelectBuilder.prototype.whereNot()

#### SelectBuilder.prototype.whereNull()

#### SelectBuilder.prototype.whereNotNull()

#### SelectBuilder.prototype.whereIn()

#### SelectBuilder.prototype.whereNotIn()

#### SelectBuilder.prototype.whereAny()

#### SelectBuilder.prototype.whereExists()

#### SelectBuilder.prototype.orderBy()

#### SelectBuilder.prototype.groupBy()

#### SelectBuilder.prototype.limit()

#### SelectBuilder.prototype.offset()

#### SelectBuilder.prototype.count()

#### SelectBuilder.prototype.avg()

#### SelectBuilder.prototype.min()

#### SelectBuilder.prototype.max()

#### SelectBuilder.prototype.sum()

#### SelectBuilder.prototype.processSelect()

#### SelectBuilder.prototype.processOperations()

#### SelectBuilder.prototype.processWhere()

#### SelectBuilder.prototype.processOrder()

#### SelectBuilder.prototype.build()

#### RawBuilder()

#### RawBuilder.prototype.constructor(sqlTemplate, Returns:)

- `sqlTemplate`: [`<Function>`][function]
  - `params`: [`<ParamsBuilder>`][paramsbuilder]
- `Returns:`: [`<string>`][string] query

#### RawBuilder.prototype.build()

#### ParamsBuilder()

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

#### PostgresParamsBuilder()

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
