// Runs database/schema.sql against DATABASE_URL. Usage: npm run db:schema
const fs = require('fs');
const path = require('path');
const config = require('../src/config');
const { pool } = require('../src/db');

(async () => {
  if (config.isProd && !process.argv.includes('--force')) {
    console.error('Refusing to DROP tables with NODE_ENV=production. Re-run with --force if you really mean it.');
    process.exit(1);
  }
  const sql = fs.readFileSync(path.join(__dirname, '..', '..', 'database', 'schema.sql'), 'utf8');
  await pool.query(sql); // no parameters -> Postgres runs all statements in the file
  console.log('Schema created.');
  await pool.end();
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
