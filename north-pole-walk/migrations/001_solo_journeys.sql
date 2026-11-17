-- Migration 001: solo journeys.
-- Run once, in the D1 console, on a database that already has the v1 tables
-- (a fresh database should run schema.sql instead; it already includes this).
--
-- A "team" row is also used for a solo journey. `kind` says which it is:
--   'team' — a group walk (the office's current mode; the default for every existing row)
--   'solo' — one person's own journey. It turns into 'team' the moment a second person joins.

ALTER TABLE teams ADD COLUMN kind TEXT NOT NULL DEFAULT 'team';
