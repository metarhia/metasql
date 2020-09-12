({
  name: 'example',
  description: 'Example database schema',
  version: 3,

  authors: [
    { name: 'Timur Shemsedinov', email: 'timur.shemsedinov@gmail.com' },
  ],

  extensions: [
    'hstore',
    'postgis',
    'postgis_topology',
    'pg_trgm',
  ]
});
