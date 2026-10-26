const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  // Supabase requires TLS. rejectUnauthorized:false skips CA checking (fine for a class project).
  ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
  max: 10,
});

// Run one statement. Always pass user input through `params` ($1, $2 ...) - never string-concatenate it.
const query = (text, params) => pool.query(text, params);

// Run several statements atomically: all succeed or all are rolled back.
async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (err) {
    await client.query('rollback');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, withTransaction };
