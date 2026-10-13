// GET /api/awards?team=TEAM_ID — every badge for the Awards tab.
// Team awards are the same for everyone on the team; personal awards are for
// the signed-in person. Each award says whether it is earned, when, and how far along it is.

import { computeAwards } from '../lib/awards.js';

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const teamId = new URL(request.url).searchParams.get('team') || '';
  const member = teamId && await env.DB.prepare(
    `SELECT 1 AS ok FROM team_members WHERE team_id = ? AND user_id = ?`
  ).bind(teamId, data.user.id).first();
  if (!member) return json({ error: 'You are not on that team.' }, 403);

  const [team, members, entries] = await env.DB.batch([
    env.DB.prepare(`SELECT id, journey_id FROM teams WHERE id = ?`).bind(teamId),
    env.DB.prepare(`SELECT u.id, u.name FROM team_members m JOIN users u ON u.id = m.user_id WHERE m.team_id = ? ORDER BY m.joined_at`).bind(teamId),
    env.DB.prepare(`SELECT id, user_id, miles, logged_at FROM mile_entries WHERE team_id = ? ORDER BY logged_at, id`).bind(teamId),
  ]);

  const awards = computeAwards({
    journeyId: team.results[0] && team.results[0].journey_id,
    entries: entries.results,
    members: members.results,
    userId: data.user.id,
  });
  return json(awards);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
