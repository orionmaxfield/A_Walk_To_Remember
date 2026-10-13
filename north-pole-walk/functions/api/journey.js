// GET /api/journey?team=TEAM_ID — everything the Journey screen needs:
// the team's combined miles, your own miles, the members, and recent entries.

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const teamId = new URL(request.url).searchParams.get('team') || '';
  const member = await membership(env, teamId, data.user.id);
  if (!member) return json({ error: 'You are not on that team.' }, 403);

  const [team, teamTotal, myTotal, members, recent] = await env.DB.batch([
    env.DB.prepare(`SELECT id, name, invite_code, journey_id FROM teams WHERE id = ?`).bind(teamId),
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
        WHERE e.team_id = ? ORDER BY e.id DESC LIMIT 20`
    ).bind(teamId),
  ]);

  return json({
    team: team.results[0],
    teamTotal: round(teamTotal.results[0].total),
    myTotal: round(myTotal.results[0].total),
    members: members.results,
    recent: recent.results,
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
