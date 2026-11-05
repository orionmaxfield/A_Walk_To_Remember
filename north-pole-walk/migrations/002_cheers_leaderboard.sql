-- Migration 002: cheers on the activity feed, and a leaderboard switch per walk.
-- Run once, in the D1 console, on a database that already has the v1 tables.
-- (A fresh database runs schema.sql instead; it already includes this.)

CREATE TABLE IF NOT EXISTS cheers (
  entry_id INTEGER NOT NULL,        -- the mile entry being cheered
  user_id TEXT NOT NULL,            -- who cheered
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (entry_id, user_id)
);

-- 1 = the walk shows a leaderboard (the default); 0 = the organizer switched it off.
ALTER TABLE teams ADD COLUMN leaderboard INTEGER NOT NULL DEFAULT 1;
