'use strict';

const fsp = require('fs').promises;
const { Pool } = require('pg');

const read = (file) => fsp.readFile(`application/db/${file}.sql`, 'utf-8');

const pg = new Pool({
  host: 'postgres',
  user: 'postgres',
  password: 'postgres',
});

const application = new Pool({
  host: 'postgres',
  database: 'application',
  user: 'marcus',
  password: 'marcus',
});

(async () => {
  const install = await read('install');
  await pg.query(install);

  const structure = await read('structure');
  await application.query(structure);

  const data = await read('data');
  await application.query(data);
})();
