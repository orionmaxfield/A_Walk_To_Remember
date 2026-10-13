// GET /api/me — who is signed in, and which teams they belong to.

export async function onRequestGet({ env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const teams = await env.DB.prepare(
    `SELECT t.id, t.name, t.invite_code, t.journey_id
       FROM teams t
       JOIN team_members m ON m.team_id = t.id
      WHERE m.user_id = ?
      ORDER BY m.joined_at`
  ).bind(data.user.id).all();

  return json({ user: data.user, teams: teams.results || [] });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
