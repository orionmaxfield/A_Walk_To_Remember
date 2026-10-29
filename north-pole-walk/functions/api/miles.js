// POST   /api/miles  { team_id, miles, note, date } — add miles to a walk.
//                    date (YYYY-MM-DD, optional) back-logs a missed day; it is saved
//                    as noon in Denver on that day. The reply lists any awards the
//                    entry just earned (newAwards).
// PATCH  /api/miles  { id, miles, note, date }   — change one of your own entries.
// DELETE /api/miles  { id }                       — remove one of your own entries.

import { computeAwards, newlyEarned, denver, denverOffsetHours, toSql } from '../lib/awards.js';
import { attachCustom } from './me.js';

const MAX_MILES_PER_ENTRY = 100;
const MAX_BACKLOG_DAYS = 400;

export async function onRequestPost({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const teamId = String(body.team_id || '');
  const parsed = parseEntry(body);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const { miles, note, loggedAt } = parsed;

  const member = await env.DB.prepare(
    `SELECT 1 AS ok FROM team_members WHERE team_id = ? AND user_id = ?`
  ).bind(teamId, data.user.id).first();
  if (!member) return json({ error: 'You are not on that walk.' }, 403);

  const { base, entries } = await snapshot(env, teamId, data.user.id);
  const before = computeAwards({ ...base, entries });

  const result = loggedAt
    ? await env.DB.prepare(`INSERT INTO mile_entries (team_id, user_id, miles, note, logged_at) VALUES (?, ?, ?, ?, ?)`).bind(teamId, data.user.id, miles, note, loggedAt).run()
    : await env.DB.prepare(`INSERT INTO mile_entries (team_id, user_id, miles, note) VALUES (?, ?, ?, ?)`).bind(teamId, data.user.id, miles, note).run();
  const id = result.meta.last_row_id;
  const saved = await env.DB.prepare(`SELECT id, user_id, miles, note, logged_at FROM mile_entries WHERE id = ?`).bind(id).first();

  const after = computeAwards({ ...base, entries: entries.concat(saved ? [saved] : []) });
  return json({ ok: true, id, miles, entry: saved, newAwards: newlyEarned(before, after) });
}

export async function onRequestPatch({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return json({ error: 'Which entry?' }, 400);
  const parsed = parseEntry(body);
  if (parsed.error) return json({ error: parsed.error }, 400);
  const { miles, note, loggedAt } = parsed;

  const current = await env.DB.prepare(
    `SELECT id, team_id, user_id, logged_at FROM mile_entries WHERE id = ? AND user_id = ?`
  ).bind(id, data.user.id).first();
  if (!current) return json({ error: 'That entry was not found, or it is not yours.' }, 404);

  const { base, entries } = await snapshot(env, current.team_id, data.user.id);
  const before = computeAwards({ ...base, entries });

  // Keep the original time unless a different day was asked for.
  const keepTime = !loggedAt || sameDenverDay(loggedAt, current.logged_at);
  await env.DB.prepare(`UPDATE mile_entries SET miles = ?, note = ?, logged_at = ? WHERE id = ?`)
    .bind(miles, note, keepTime ? current.logged_at : loggedAt, id).run();
  const saved = await env.DB.prepare(`SELECT id, user_id, miles, note, logged_at FROM mile_entries WHERE id = ?`).bind(id).first();

  const after = computeAwards({ ...base, entries: entries.map((e) => (e.id === id ? saved : e)) });
  return json({ ok: true, id, miles, entry: saved, newAwards: newlyEarned(before, after) });
}

export async function onRequestDelete({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return json({ error: 'Which entry?' }, 400);

  const result = await env.DB.prepare(
    `DELETE FROM mile_entries WHERE id = ? AND user_id = ?`
  ).bind(id, data.user.id).run();

  if (!result.meta.changes) return json({ error: 'That entry was not found, or it is not yours.' }, 404);
  return json({ ok: true });
}

/* ---------- helpers ---------- */

function parseEntry(body) {
  const miles = Math.round(Number(body.miles) * 100) / 100;
  const note = String(body.note || '').trim().slice(0, 120) || null;
  if (!Number.isFinite(miles) || miles <= 0) return { error: 'Enter a number of miles greater than 0.' };
  if (miles > MAX_MILES_PER_ENTRY) return { error: `That is a lot of miles for one entry. Keep each entry under ${MAX_MILES_PER_ENTRY}.` };

  let loggedAt = null;
  if (body.date) {
    const m = String(body.date).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return { error: 'That date does not look right.' };
    const today = denver(Date.now());
    const todayIndex = Math.floor(Date.UTC(today.year, today.month, today.day) / 86400000);
    const dayIndex = Math.floor(Date.UTC(+m[1], +m[2] - 1, +m[3]) / 86400000);
    if (Number.isNaN(dayIndex)) return { error: 'That date does not look right.' };
    if (dayIndex > todayIndex) return { error: "That day hasn't happened yet." };
    if (todayIndex - dayIndex > MAX_BACKLOG_DAYS) return { error: 'That is more than a year ago. Pick a more recent day.' };
    if (dayIndex !== todayIndex) {
      // Noon in Denver on that day, as a UTC timestamp in SQLite's format.
      const noonUtcGuess = Date.UTC(+m[1], +m[2] - 1, +m[3], 12);
      loggedAt = toSql(noonUtcGuess - denverOffsetHours(noonUtcGuess) * 3600000);
    }
  }
  return { miles, note, loggedAt };
}

function sameDenverDay(sqlA, sqlB) {
  const a = denver(Date.parse(String(sqlA).replace(' ', 'T') + 'Z'));
  const b = denver(Date.parse(String(sqlB).replace(' ', 'T') + 'Z'));
  return a.dayIndex === b.dayIndex;
}

// Everything computeAwards needs for a walk, before a change is made.
async function snapshot(env, teamId, userId) {
  const [team, members, entries] = await env.DB.batch([
    env.DB.prepare(`SELECT id, journey_id, kind FROM teams WHERE id = ?`).bind(teamId),
    env.DB.prepare(`SELECT u.id, u.name FROM team_members m JOIN users u ON u.id = m.user_id WHERE m.team_id = ?`).bind(teamId),
    env.DB.prepare(`SELECT id, user_id, miles, logged_at FROM mile_entries WHERE team_id = ? ORDER BY logged_at, id`).bind(teamId),
  ]);
  const t = team.results[0] || {};
  await attachCustom(env, [t]);
  return {
    base: { journeyId: t.journey_id, kind: t.kind, custom: t.custom, members: members.results, userId },
    entries: entries.results,
  };
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
