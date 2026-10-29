// GET /api/journey?team=TEAM_ID — everything the Journey screen needs:
// the walk's combined miles, your own miles, the members, recent entries with
// their cheers, and the standings (when the walk's leaderboard is on).

import { denver, denverMidnightUtc, weekStartDay, toSql } from '../lib/awards.js';

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const teamId = new URL(request.url).searchParams.get('team') || '';
  const member = await membership(env, teamId, data.user.id);
  if (!member) return json({ error: 'You are not on that walk.' }, 403);

  const weekStart = toSql(denverMidnightUtc(weekStartDay(denver(Date.now()).weekIndex)));

  const [team, teamTotal, myTotal, members, recent, totals, weekTotals] = await env.DB.batch([
    env.DB.prepare(`SELECT id, name, invite_code, journey_id, kind, created_by FROM teams WHERE id = ?`).bind(teamId),
    env.DB.prepare(`SELECT COALESCE(SUM(miles), 0) AS total FROM mile_entries WHERE team_id = ?`).bind(teamId),
    env.DB.prepare(`SELECT COALESCE(SUM(miles), 0) AS total FROM mile_entries WHERE team_id = ? AND user_id = ?`).bind(teamId, data.user.id),
    env.DB.prepare(
      `SELECT u.id, u.name, u.picture, m.joined_at
         FROM team_members m JOIN users u ON u.id = m.user_id
        WHERE m.team_id = ? ORDER BY m.joined_at`
    ).bind(teamId),
    env.DB.prepare(
      `SELECT e.id, e.miles, e.note, e.logged_at, e.user_id, u.name
         FROM mile_entries e JOIN users u ON u.id = e.user_id
        WHERE e.team_id = ? ORDER BY e.id DESC LIMIT 30`
    ).bind(teamId),
    env.DB.prepare(`SELECT user_id, SUM(miles) AS total FROM mile_entries WHERE team_id = ? GROUP BY user_id`).bind(teamId),
    env.DB.prepare(`SELECT user_id, SUM(miles) AS total FROM mile_entries WHERE team_id = ? AND logged_at >= ? GROUP BY user_id`).bind(teamId, weekStart),
  ]);

  const t = team.results[0];
  const entries = recent.results;

  // Cheers and the leaderboard switch arrive with migration 002. Until a database
  // has it, these fall back quietly and the app simply hides those features.
  let cheersOn = false, leaderboardOn = null;
  try {
    const flag = await env.DB.prepare(`SELECT leaderboard FROM teams WHERE id = ?`).bind(teamId).first();
    leaderboardOn = Boolean(flag && flag.leaderboard);
    if (entries.length) {
      const ids = entries.map((e) => e.id);
      const rows = await env.DB.prepare(
        `SELECT c.entry_id, c.user_id, u.name FROM cheers c JOIN users u ON u.id = c.user_id
          WHERE c.entry_id IN (${ids.map(() => '?').join(',')}) ORDER BY c.created_at`
      ).bind(...ids).all();
      const byEntry = {};
      for (const c of rows.results) (byEntry[c.entry_id] = byEntry[c.entry_id] || []).push(c);
      for (const e of entries) {
        const list = byEntry[e.id] || [];
        e.cheers = list.length;
        e.cheered = list.some((c) => c.user_id === data.user.id);
        e.cheer_names = list.filter((c) => c.user_id !== data.user.id).slice(0, 3).map((c) => c.name);
      }
    }
    cheersOn = true;
  } catch (err) {
    cheersOn = false; leaderboardOn = null;
  }

  const allTime = Object.fromEntries(totals.results.map((r) => [r.user_id, Number(r.total)]));
  const thisWeek = Object.fromEntries(weekTotals.results.map((r) => [r.user_id, Number(r.total)]));
  const standings = leaderboardOn
    ? members.results.map((m) => ({ id: m.id, name: m.name, picture: m.picture, total: round(allTime[m.id] || 0), week: round(thisWeek[m.id] || 0) }))
        .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    : null;

  return json({
    team: { ...t, leaderboard: leaderboardOn },
    teamTotal: round(teamTotal.results[0].total),
    myTotal: round(myTotal.results[0].total),
    members: members.results,
    recent: entries,
    standings,
    features: { cheers: cheersOn, leaderboard: leaderboardOn != null },
  });
}

async function membership(env, teamId, userId) {
  if (!teamId) return null;
  return env.DB.prepare(
    `SELECT 1 AS ok FROM team_members WHERE team_id = ? AND user_id = ?`
  ).bind(teamId, userId).first();
}

function round(n) {
  return Math.round(Number(n) * 100) / 100;
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
