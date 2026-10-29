-- Run this once in a NEW D1 database (Cloudflare dashboard > D1 > your database > Console).
-- An existing database that already has these tables gets updated with the files in migrations/ instead.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,              -- Google account id
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  picture TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  journey_id TEXT NOT NULL DEFAULT 'north-pole',
  kind TEXT NOT NULL DEFAULT 'team',  -- 'team' (a group walk) or 'solo' (one person's own journey)
  leaderboard INTEGER NOT NULL DEFAULT 1,  -- 1 shows the leaderboard; 0 = the organizer switched it off
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  joined_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS mile_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  miles REAL NOT NULL,
  note TEXT,
  logged_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS cheers (
  entry_id INTEGER NOT NULL,        -- the mile entry being cheered
  user_id TEXT NOT NULL,            -- who cheered
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_entries_team ON mile_entries (team_id, id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions (user_id);
