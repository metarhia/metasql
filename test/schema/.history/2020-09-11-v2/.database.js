({
  name: 'example',
  description: 'Example database schema',
  version: 2,

  authors: [
    { name: 'Timur Shemsedinov', email: 'timur.shemsedinov@gmail.com' },
  ],

  extensions: [
    'hstore',
    'pg_trgm',
  ]
});
