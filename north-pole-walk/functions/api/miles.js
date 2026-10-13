// POST   /api/miles  { team_id, miles, note } — add miles to the team.
// DELETE /api/miles  { id }                    — remove one of your own entries (fix a typo).

const MAX_MILES_PER_ENTRY = 100;

export async function onRequestPost({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const teamId = String(body.team_id || '');
  const miles = Math.round(Number(body.miles) * 100) / 100;
  const note = String(body.note || '').trim().slice(0, 120) || null;

  if (!Number.isFinite(miles) || miles <= 0) return json({ error: 'Enter a number of miles greater than 0.' }, 400);
  if (miles > MAX_MILES_PER_ENTRY) return json({ error: `That is a lot of miles for one entry. Keep each entry under ${MAX_MILES_PER_ENTRY}.` }, 400);

  const member = await env.DB.prepare(
    `SELECT 1 AS ok FROM team_members WHERE team_id = ? AND user_id = ?`
  ).bind(teamId, data.user.id).first();
  if (!member) return json({ error: 'You are not on that team.' }, 403);

  const result = await env.DB.prepare(
    `INSERT INTO mile_entries (team_id, user_id, miles, note) VALUES (?, ?, ?, ?)`
  ).bind(teamId, data.user.id, miles, note).run();

  return json({ ok: true, id: result.meta.last_row_id, miles });
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

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
