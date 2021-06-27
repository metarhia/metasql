# Changelog

## [Unreleased][unreleased]

- Support `OR` in queries
- New API methods for Database:
  - async upsert(table, record, condition): Object
  - async fields(table): Array
  - async tables(): Array
- Add typing for Database and Query classes

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

[unreleased]: https://github.com/metarhia/metasql/compare/v1.1.3...HEAD
[1.1.3]: https://github.com/metarhia/metasql/compare/v1.1.2...v1.1.3
[1.1.2]: https://github.com/metarhia/metasql/compare/v1.1.1...v1.1.2
[1.1.1]: https://github.com/metarhia/metasql/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/metarhia/metasql/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/metarhia/metasql/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metasql/compare/metarhia-sql...v1.0.0
[metarhia-sql]: https://github.com/metarhia/metasql/releases/tag/metarhia-sql
