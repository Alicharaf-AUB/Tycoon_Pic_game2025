const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Use a data directory that can be persisted on Railway
const dataDir = process.env.DATA_DIR || path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log(`Created data directory: ${dataDir}`);
}

const dbPath = path.join(dataDir, 'game.db');
console.log(`Database path: ${dbPath}`);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS investors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    starting_credit INTEGER NOT NULL DEFAULT 500,
    submitted INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS startups (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    logo TEXT,
    pitch_deck TEXT,
    cohort TEXT,
    support_program TEXT,
    industry TEXT,
    email TEXT,
    team TEXT,
    generating_revenue TEXT,
    ask TEXT,
    legal_entity TEXT,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    investor_id TEXT NOT NULL,
    startup_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE,
    FOREIGN KEY (startup_id) REFERENCES startups(id) ON DELETE CASCADE,
    UNIQUE(investor_id, startup_id)
  );

  CREATE TABLE IF NOT EXISTS game_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    is_locked INTEGER DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Initialize game state
  INSERT OR IGNORE INTO game_state (id, is_locked) VALUES (1, 0);

  CREATE INDEX IF NOT EXISTS idx_investments_investor ON investments(investor_id);
  CREATE INDEX IF NOT EXISTS idx_investments_startup ON investments(startup_id);

  CREATE TABLE IF NOT EXISTS funds_requests (
    id TEXT PRIMARY KEY,
    investor_id TEXT NOT NULL,
    investor_name TEXT NOT NULL,
    current_credit INTEGER NOT NULL,
    requested_amount INTEGER NOT NULL,
    justification TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    admin_response TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    reviewed_at DATETIME,
    reviewed_by TEXT,
    FOREIGN KEY (investor_id) REFERENCES investors(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_funds_requests_investor ON funds_requests(investor_id);
  CREATE INDEX IF NOT EXISTS idx_funds_requests_status ON funds_requests(status);
`);

// Migration: Add submitted column if it doesn't exist
try {
  db.exec(`ALTER TABLE investors ADD COLUMN submitted INTEGER DEFAULT 0`);
  console.log('Added submitted column to investors table');
} catch (err) {
  // Column already exists, ignore error
}

// Migration: Add email column if it doesn't exist
try {
  db.exec(`ALTER TABLE investors ADD COLUMN email TEXT UNIQUE`);
  console.log('Added email column to investors table');
} catch (err) {
  // Column already exists, ignore error
}

// Migration: Add new startup columns if they don't exist
const newStartupColumns = [
  'logo TEXT',
  'pitch_deck TEXT',
  'cohort TEXT',
  'support_program TEXT',
  'industry TEXT',
  'email TEXT',
  'team TEXT',
  'generating_revenue TEXT',
  'ask TEXT',
  'legal_entity TEXT'
];

newStartupColumns.forEach(column => {
  try {
    const columnName = column.split(' ')[0];
    db.exec(`ALTER TABLE startups ADD COLUMN ${column}`);
    console.log(`Added ${columnName} column to startups table`);
  } catch (err) {
    // Column already exists, ignore error
  }
});

console.log('Database initialized successfully');

module.exports = db;
