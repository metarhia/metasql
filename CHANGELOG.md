# Changelog

## [Unreleased][unreleased]

## [1.3.0][] - 2021-08-07

- Use `options.logger` and global `console` if no `options.console` for backward
  compatibility, fallback will be better than crash
- Add `{ delete: 'cascade' }` to generate `ON DELETE CASCADE` for `{ many }`
- Implement `.returning(fields)` for `Query`
- Methods `insert`, `delete` and `update` of `Database` returns instance of
  `Modify` class with chain methods `.returning` and `.then`

## [1.2.0][] - 2021-08-04

- Add typings for Database and Query classes
- Move types to package root
- Generated `always as identity` just for `Registry`
- Support `DEFAULT CURRENT_TIMESTAMP` for `datetime`
- Generate SQL for bootstrapping db data
- Pass `Model` to `Database` to access schemas
- Use common `Console` interface for logging
- Generate ids for `Registry` tables

## [1.1.5][] - 2021-07-04

- Implement CRUD plugin
- Save Query to declarative format
- Create Query from declarative format

## [1.1.4][] - 2021-06-30

- Support `OR` in queries
- Database will be generated only from Schema.KIND_STORED schemas

## [1.1.3][] - 2021-05-25

- Remove debug output
- Package meintenance

## [1.1.2][] - 2021-05-24

- Update index generation according to new metadata
- Query.limit(count: number)
- Query.offset(count: number)
- Query.order(fields: string | Array<string>)
- Query.desc(fields: string | Array<string>)
- Support permissions for categories, catalogs, fields
- Support unique alternative keys
- Generate nullable fields

## [1.1.1][] - 2021-05-08

- Field group name concatenation with field name
- Support optional shorthand and nested json schema

## [1.1.0][] - 2021-05-07

- Use metaschema Model and Schema classes
- Support script generation with field groups
- Update metaschema to v1.1.0
- New API methods for Database:
  - async row(table, fields, conditions): Object
  - async scalar(table, field, conditions): ScalarValue
  - async col(table, field, conditions): Array
  - async dict(table, fields, conditions): Object

## [1.0.1][] - 2021-04-04

- Fixed field names quotation
- Update dependencies

## [1.0.0][] - 2021-03-06

- Simple query builder instead of SQL clause generator
- Only PostgreSQL support instead of universal
- Use metaschema and metavm for schema loading
- Database model loader
- PostgreSQL DDL script generator
- TypeScript typings generator
- Calculate changec and generate up and down migrations

## [metarhia-sql][] - 2020-09-06

Code before fork from https://github.com/metarhia/sql

[unreleased]: https://github.com/metarhia/metasql/compare/v1.3.0...HEAD
[1.3.0]: https://github.com/metarhia/metasql/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/metarhia/metasql/compare/v1.1.5...v1.2.0
[1.1.5]: https://github.com/metarhia/metasql/compare/v1.1.4...v1.1.5
[1.1.4]: https://github.com/metarhia/metasql/compare/v1.1.3...v1.1.4
[1.1.3]: https://github.com/metarhia/metasql/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/metarhia/metasql/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/metarhia/metasql/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/metarhia/metasql/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/metarhia/metasql/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metasql/compare/metarhia-sql...v1.0.0
[metarhia-sql]: https://github.com/metarhia/metasql/releases/tag/metarhia-sql
