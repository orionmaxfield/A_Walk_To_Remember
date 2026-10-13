// POST /api/join  { code } — join a team using its invite code.

export async function onRequestPost({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 4) return json({ error: 'That invite code does not look right.' }, 400);

  const team = await env.DB.prepare(
    `SELECT id, name, invite_code, journey_id FROM teams WHERE invite_code = ?`
  ).bind(code).first();
  if (!team) return json({ error: 'No team has that invite code. Check it and try again.' }, 404);

  await env.DB.prepare(
    `INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)`
  ).bind(team.id, data.user.id).run();

  return json({ team });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
