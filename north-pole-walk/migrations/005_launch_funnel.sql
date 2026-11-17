-- 005: launch measurement. Daily totals for the sign-up funnel (no one is named), and the
-- one date a walker first came back, so "day-2 return" is counted once per account.
-- Safe to run on a database that already has the earlier tables.

CREATE TABLE IF NOT EXISTS funnel_days (
  day TEXT NOT NULL,                  -- YYYY-MM-DD (UTC)
  step TEXT NOT NULL,                 -- 'landing', 'signin', 'first_entry' or 'day2'
  count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (day, step)
);

ALTER TABLE users ADD COLUMN returned_on TEXT;   -- NULL until the walker's first visit on a later day
