const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

pool.on('connect', () => {
  console.log('Connected to Supabase PostgreSQL database.');
});

pool.on('error', (err) => {
  console.error('Database connection error:', err.message);
});

// Converts SQLite '?' placeholders to Postgres '$1, $2, ...'
function toPgSql(sql) {
  let index = 1;
  let pgSql = sql.replace(/\?/g, () => `$${index++}`);

  // Only append RETURNING id for game_events (which contains a serial id primary key)
  if (/insert\s+into\s+game_events/i.test(pgSql) && !/returning/i.test(pgSql)) {
    pgSql += ' RETURNING id';
  }

  return pgSql;
}

const db = {
  run(sql, params = [], cb = () => {}) {
    pool.query(toPgSql(sql), params, (err, res) => {
      if (err) return cb(err);
      const lastID = res?.rows?.[0]?.id || null;
      cb.call({ lastID, changes: res?.rowCount || 0 }, null);
    });
  },
  get(sql, params = [], cb = () => {}) {
    pool.query(toPgSql(sql), params, (err, res) => {
      if (err) return cb(err, null);
      cb(null, res?.rows?.[0] || null);
    });
  },
  all(sql, params = [], cb = () => {}) {
    pool.query(toPgSql(sql), params, (err, res) => {
      if (err) return cb(err, null);
      cb(null, res?.rows || []);
    });
  }
};

function initDatabase() {}

module.exports = { db, initDatabase };