// POST /api/join  { code } — join a walk using its invite code.
// Joining someone's solo walk turns it into a group walk (kind 'team').

export async function onRequestPost({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const code = String(body.code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 4) return json({ error: 'That invite code does not look right.' }, 400);

  const team = await env.DB.prepare(
    `SELECT id, name, invite_code, journey_id, kind FROM teams WHERE invite_code = ?`
  ).bind(code).first();
  if (!team) return json({ error: 'No walk has that invite code. Check it and try again.' }, 404);

  const already = await env.DB.prepare(
    `SELECT 1 AS ok FROM team_members WHERE team_id = ? AND user_id = ?`
  ).bind(team.id, data.user.id).first();

  const statements = [
    env.DB.prepare(`INSERT OR IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)`).bind(team.id, data.user.id),
  ];
  // A second walker makes it a group walk.
  if (!already && team.kind === 'solo') {
    statements.push(env.DB.prepare(`UPDATE teams SET kind = 'team' WHERE id = ?`).bind(team.id));
    team.kind = 'team';
  }
  await env.DB.batch(statements);

  return json({ team, joined: !already });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
