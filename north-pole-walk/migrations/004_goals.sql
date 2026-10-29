-- Migration 004: a personal daily or weekly goal.
-- Run once, in the D1 console, on a database that already has the v1 tables.
-- (A fresh database runs schema.sql instead; it already includes this.)

ALTER TABLE users ADD COLUMN goal_miles REAL;                        -- NULL = no goal set yet
ALTER TABLE users ADD COLUMN goal_period TEXT NOT NULL DEFAULT 'day'; -- 'day' or 'week'
