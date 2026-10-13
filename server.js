require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { db, initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: '*' }));
app.use(express.json());

// Initialize SQLite tables
initDatabase();

// Helper function to generate clean 6-character anonymous join codes (e.g., HYD-842)
function generateJoinCode() {
  const num = Math.floor(100 + Math.random() * 900);
  return `HYD-${num}`;
}

// ----------------------------------------------------
// 1. Health Check
// ----------------------------------------------------
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ----------------------------------------------------
// 2. Start a New Game Session (Anonymous, Zero PII)
// ----------------------------------------------------
app.post('/api/session/start', (req, res) => {
  const { playerName, cohortId = 'HYDERABAD-G11-G12', language = 'en' } = req.body;

  if (!playerName || playerName.trim() === '') {
    return res.status(400).json({ error: 'Player name is required' });
  }

  const joinCode = generateJoinCode();

  const insertSql = `
    INSERT INTO student_sessions (
      join_code, custom_player_name, cohort_id, active_world,
      wallet, reserve, cibil_score, unlocked_portals, completed_minigames, language
    ) VALUES (?, ?, ?, 1, 0, 0, 650, '["prologue"]', '[]', ?)
  `;

  db.run(insertSql, [joinCode, playerName.trim(), cohortId, language], function (err) {
    if (err) {
      console.error('Error creating session:', err.message);
      return res.status(500).json({ error: 'Failed to create student session' });
    }

    res.status(201).json({
      success: true,
      joinCode,
      playerName: playerName.trim(),
      activeWorld: 1,
      wallet: 0,
      reserve: 0,
      cibilScore: 650,
      unlockedPortals: ['prologue'],
      language
    });
  });
});

// ----------------------------------------------------
// 3. Resume Session (Enter Code to Restore Game)
// ----------------------------------------------------
app.get('/api/session/resume/:joinCode', (req, res) => {
  const { joinCode } = req.params;

  const querySql = `SELECT * FROM student_sessions WHERE join_code = ?`;

  db.get(querySql, [joinCode.toUpperCase()], (err, row) => {
    if (err) {
      console.error('Error fetching session:', err.message);
      return res.status(500).json({ error: 'Database query failed' });
    }

    if (!row) {
      return res.status(404).json({ error: 'Session code not found' });
    }

    res.json({
      success: true,
      joinCode: row.join_code,
      playerName: row.custom_player_name,
      cohortId: row.cohort_id,
      activeWorld: row.active_world,
      wallet: row.wallet,
      reserve: row.reserve,
      cibilScore: row.cibil_score,
      unlockedPortals: JSON.parse(row.unlocked_portals || '["prologue"]'),
      completedMinigames: JSON.parse(row.completed_minigames || '[]'),
      language: row.language
    });
  });
});

// ----------------------------------------------------
// 4. Save Progress (Update Wallet, Score, Portals)
// ----------------------------------------------------
app.put('/api/session/progress', (req, res) => {
  const {
    joinCode,
    activeWorld,
    wallet,
    reserve,
    cibilScore,
    unlockedPortals,
    completedMinigames,
    language
  } = req.body;

  if (!joinCode) {
    return res.status(400).json({ error: 'joinCode is required to save progress' });
  }

  const updateSql = `
    UPDATE student_sessions
    SET
      active_world = COALESCE(?, active_world),
      wallet = COALESCE(?, wallet),
      reserve = COALESCE(?, reserve),
      cibil_score = COALESCE(?, cibil_score),
      unlocked_portals = COALESCE(?, unlocked_portals),
      completed_minigames = COALESCE(?, completed_minigames),
      language = COALESCE(?, language),
      updated_at = CURRENT_TIMESTAMP
    WHERE join_code = ?
  `;

  const portalsStr = unlockedPortals ? JSON.stringify(unlockedPortals) : null;
  const gamesStr = completedMinigames ? JSON.stringify(completedMinigames) : null;

  db.run(
    updateSql,
    [activeWorld, wallet, reserve, cibilScore, portalsStr, gamesStr, language, joinCode.toUpperCase()],
    function (err) {
      if (err) {
        console.error('Error updating progress:', err.message);
        return res.status(500).json({ error: 'Failed to update progress' });
      }

      res.json({ success: true, message: 'Game state saved successfully' });
    }
  );
});

// ----------------------------------------------------
// 5. Log Telemetry Event (Pillars 1-4 Learning Metrics)
// ----------------------------------------------------
app.post('/api/telemetry/event', (req, res) => {
  const { joinCode, cohortId = 'HYDERABAD-G11-G12', pillarId, eventType, score = 0 } = req.body;

  if (!joinCode || !pillarId || !eventType) {
    return res.status(400).json({ error: 'joinCode, pillarId, and eventType are required' });
  }

  const insertEvent = `
    INSERT INTO game_events (join_code, cohort_id, pillar_id, event_type, score)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.run(insertEvent, [joinCode.toUpperCase(), cohortId, pillarId, eventType, score], function (err) {
    if (err) {
      console.error('Error logging telemetry:', err.message);
      return res.status(500).json({ error: 'Failed to record event' });
    }

    res.status(201).json({ success: true, eventId: this.lastID });
  });
});

// ----------------------------------------------------
// 6. NGO Facilitator Cohort Dashboard Summary
// ----------------------------------------------------
app.get('/api/facilitator/cohort-summary', (req, res) => {
  const summarySql = `
    SELECT
      COUNT(DISTINCT join_code) AS "totalStudents",
      COALESCE(AVG(wallet), 0) AS "avgWallet",
      COALESCE(AVG(reserve), 0) AS "avgReserve",
      COALESCE(AVG(cibil_score), 650) AS "avgCibilScore"
    FROM student_sessions
  `;

  db.get(summarySql, [], (err, summary) => {
    if (err) {
      console.error('Error aggregating cohort data:', err.message);
      return res.status(500).json({ error: 'Failed to aggregate cohort data' });
    }

    const pillarSql = `
      SELECT pillar_id, COUNT(*) AS "eventCount", AVG(score) AS "avgScore"
      FROM game_events
      GROUP BY pillar_id
    `;

    db.all(pillarSql, [], (err, pillarStats) => {
      if (err) {
        console.error('Error aggregating pillar stats:', err.message);
        return res.status(500).json({ error: 'Failed to aggregate pillar stats' });
      }

      // Safe access supporting both quoted camelCase and lowercase Postgres keys
      const total = Number(summary?.totalStudents ?? summary?.totalstudents ?? 0);
      const wallet = Number(summary?.avgWallet ?? summary?.avgwallet ?? 0);
      const reserve = Number(summary?.avgReserve ?? summary?.avgreserve ?? 0);
      const cibil = Number(summary?.avgCibilScore ?? summary?.avgcibilscore ?? 650);

      res.json({
        cohortMetrics: {
          totalStudents: total,
          avgWallet: Math.round(wallet),
          avgReserve: Math.round(reserve),
          avgCibilScore: Math.round(cibil)
        },
        pillarMastery: pillarStats || []
      });
    });
  });
});

// ----------------------------------------------------
// 7. Serve Static Frontend Bundle in Production
// ----------------------------------------------------
const frontendDist = path.resolve(__dirname, 'frontend', 'dist');

// Serve static assets (JS, CSS, images, etc.)
app.use(express.static(frontendDist));

// Root path handler
app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

// SPA fallback for client-side routing
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    return res.sendFile(path.join(frontendDist, 'index.html'));
  }
  next();
});

// Start listening
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});