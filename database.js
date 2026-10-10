const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// 1. Connect to SQLite file (game.db)
const db = new sqlite3.Database(path.join(__dirname, 'game.db'), (err) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Connected to SQLite database: game.db');
  }
});

// 2. Initialize schema tables
function initDatabase() {
  db.serialize(() => {
    // Session & progress state (No PII: tracks via anonymous join_code)
    db.run(`
      CREATE TABLE IF NOT EXISTS student_sessions (
        join_code TEXT PRIMARY KEY,
        custom_player_name TEXT NOT NULL,
        cohort_id TEXT DEFAULT 'HYDERABAD-G11-G12',
        active_world INTEGER DEFAULT 1,
        wallet INTEGER DEFAULT 0,
        reserve INTEGER DEFAULT 0,
        cibil_score INTEGER DEFAULT 650,
        unlocked_portals TEXT DEFAULT '["prologue"]',
        completed_minigames TEXT DEFAULT '[]',
        language TEXT DEFAULT 'en',
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // NGO telemetry event stream (tracks aggregate learning without PII)
    db.run(`
      CREATE TABLE IF NOT EXISTS game_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        join_code TEXT NOT NULL,
        cohort_id TEXT NOT NULL,
        pillar_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
  });
}

module.exports = { db, initDatabase };