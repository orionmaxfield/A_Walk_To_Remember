-- Migration 003: custom real-world destinations.
-- Run once, in the D1 console, on a database that already has the v1 tables.
-- (A fresh database runs schema.sql instead; it already includes this.)
--
-- A walk with journey_id 'custom' keeps its places and distance here as JSON:
-- {"start":{"name":...,"lat":...,"lon":...},"end":{...},"miles":123}

ALTER TABLE teams ADD COLUMN custom_json TEXT;
