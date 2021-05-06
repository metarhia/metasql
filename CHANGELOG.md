# Changelog

## [Unreleased][unreleased]

- New API methods for Database:
  - async row(table, fields, conditions): Object
  - async scalar(table, field, conditions): ScalarValue
  - async col(table, field, conditions): Array
  - async dict(table, fields, conditions): Object
- Update metaschema to v1.1.0

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

[unreleased]: https://github.com/metarhia/metasql/compare/v1.0.1...HEAD
[1.0.1]: https://github.com/metarhia/metasql/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/metarhia/metasql/compare/metarhia-sql...v1.0.0
[metarhia-sql]: https://github.com/metarhia/metasql/releases/tag/metarhia-sql
