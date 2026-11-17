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

// GET /api/join?code=XXXX — what an invite link points at, for the sign-in cover.
// Public by design: the code is the secret, and the answer is only the walk's name,
// its destination and how many people are walking. Nothing about who they are.
export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = String(url.searchParams.get('code') || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (code.length < 4) return json({ error: 'That invite code does not look right.' }, 400);
  const team = await env.DB.prepare(
    `SELECT id, name, journey_id, kind FROM teams WHERE invite_code = ?`
  ).bind(code).first();
  if (!team) return json({ error: 'No walk has that invite code.' }, 404);
  let custom = null;
  try {
    const row = await env.DB.prepare(`SELECT custom_json FROM teams WHERE id = ?`).bind(team.id).first();
    if (row && row.custom_json) custom = JSON.parse(row.custom_json);
  } catch (err) { custom = null; }
  const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM team_members WHERE team_id = ?`).bind(team.id).first();
  return json({ invite: { name: team.name, journey_id: team.journey_id, kind: team.kind, custom, walkers: Number(count ? count.n : 0) } });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
