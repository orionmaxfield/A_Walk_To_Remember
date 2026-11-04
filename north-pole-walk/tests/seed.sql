-- Test data for `npm test`. Loaded into a throwaway local D1 (tests/.state) on every run,
-- never into a real database. Three walkers with fixed session cookies, the office's
-- North Pole team with two members and a few entries, and a finished Camino walk.

DELETE FROM cheers; DELETE FROM mile_entries; DELETE FROM team_members; DELETE FROM teams; DELETE FROM sessions; DELETE FROM users;

INSERT INTO users (id, email, name, picture) VALUES
  ('test-a', 'a@example.test', 'Test Walker', NULL),
  ('test-b', 'b@example.test', 'Second Friend', NULL),
  ('test-c', 'c@example.test', 'New Walker', NULL);

INSERT INTO sessions (token, user_id, expires_at) VALUES
  ('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'test-a', '2099-01-01 00:00:00'),
  ('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb', 'test-b', '2099-01-01 00:00:00'),
  ('cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc', 'test-c', '2099-01-01 00:00:00');

-- The office's walk to the North Pole: a group of two
INSERT INTO teams (id, name, invite_code, journey_id, kind, created_by) VALUES
  ('team-office', 'Office Walkers', 'OFFICE1', 'north-pole', 'team', 'test-a');
INSERT INTO team_members (team_id, user_id) VALUES ('team-office', 'test-a'), ('team-office', 'test-b');
INSERT INTO mile_entries (team_id, user_id, miles, note, logged_at) VALUES
  ('team-office', 'test-a', 2, 'lunch walk', datetime('now', '-1 day')),
  ('team-office', 'test-b', 1.5, NULL, datetime('now', '-1 day')),
  ('team-office', 'test-a', 3, NULL, datetime('now', '-2 days'));

-- A finished solo walk on the Camino (485 miles) for the arrival and share-card checks
INSERT INTO teams (id, name, invite_code, journey_id, kind, created_by) VALUES
  ('team-camino', 'Camino done', 'CAMINO1', 'camino', 'solo', 'test-a');
INSERT INTO team_members (team_id, user_id) VALUES ('team-camino', 'test-a');
INSERT INTO mile_entries (team_id, user_id, miles, note, logged_at) VALUES
  ('team-camino', 'test-a', 100, NULL, datetime('now', '-30 days')),
  ('team-camino', 'test-a', 100, NULL, datetime('now', '-20 days')),
  ('team-camino', 'test-a', 100, NULL, datetime('now', '-10 days')),
  ('team-camino', 'test-a', 100, NULL, datetime('now', '-5 days')),
  ('team-camino', 'test-a', 90, NULL, datetime('now', '-1 day'));
