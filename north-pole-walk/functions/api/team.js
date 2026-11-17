// PATCH /api/team  { team_id, name?, leaderboard? } — settings for a walk.
// Only the person who started the walk can change them.
//   name         — rename the walk
//   leaderboard  — true/false: show the standings to everyone on the walk

export async function onRequestPatch({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const teamId = String(body.team_id || '');

  const owner = await env.DB.prepare(`SELECT 1 AS ok FROM teams WHERE id = ? AND created_by = ?`).bind(teamId, data.user.id).first();
  if (!owner) return json({ error: 'Only the person who started this walk can change its settings.' }, 403);

  const out = { ok: true };
  if (body.name != null) {
    const name = String(body.name).trim().slice(0, 60);
    if (name.length < 2) return json({ error: 'Give it a name (at least 2 letters).' }, 400);
    await env.DB.prepare(`UPDATE teams SET name = ? WHERE id = ?`).bind(name, teamId).run();
    out.name = name;
  }
  if (body.leaderboard != null) {
    const on = body.leaderboard ? 1 : 0;
    try {
      await env.DB.prepare(`UPDATE teams SET leaderboard = ? WHERE id = ?`).bind(on, teamId).run();
    } catch (err) {
      return json({ error: 'The leaderboard switch needs a database update (migration 002).' }, 500);
    }
    out.leaderboard = Boolean(on);
  }
  return json(out);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
