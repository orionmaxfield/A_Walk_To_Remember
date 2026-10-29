// PATCH /api/team  { team_id, name } — rename a walk. Only the person who started it can.

export async function onRequestPatch({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const teamId = String(body.team_id || '');
  const name = String(body.name || '').trim().slice(0, 60);
  if (name.length < 2) return json({ error: 'Give it a name (at least 2 letters).' }, 400);

  const result = await env.DB.prepare(
    `UPDATE teams SET name = ? WHERE id = ? AND created_by = ?`
  ).bind(name, teamId, data.user.id).run();
  if (!result.meta.changes) return json({ error: 'Only the person who started this walk can rename it.' }, 403);

  return json({ ok: true, name });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
