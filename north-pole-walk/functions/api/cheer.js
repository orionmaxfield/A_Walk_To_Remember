// POST   /api/cheer  { entry_id } — cheer someone's miles.
// DELETE /api/cheer  { entry_id } — take your cheer back.
// You can cheer any entry on a walk you're on, except your own.

export async function onRequestPost(ctx) { return toggle(ctx, true); }
export async function onRequestDelete(ctx) { return toggle(ctx, false); }

async function toggle({ request, env, data }, on) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);
  const body = await request.json().catch(() => ({}));
  const entryId = Number(body.entry_id);
  if (!Number.isInteger(entryId)) return json({ error: 'Which entry?' }, 400);

  const entry = await env.DB.prepare(
    `SELECT e.user_id FROM mile_entries e
       JOIN team_members m ON m.team_id = e.team_id AND m.user_id = ?
      WHERE e.id = ?`
  ).bind(data.user.id, entryId).first();
  if (!entry) return json({ error: 'That entry is not on one of your walks.' }, 404);
  if (entry.user_id === data.user.id) return json({ error: 'You can cheer everyone but yourself.' }, 400);

  try {
    if (on) {
      await env.DB.prepare(`INSERT OR IGNORE INTO cheers (entry_id, user_id) VALUES (?, ?)`).bind(entryId, data.user.id).run();
    } else {
      await env.DB.prepare(`DELETE FROM cheers WHERE entry_id = ? AND user_id = ?`).bind(entryId, data.user.id).run();
    }
    const count = await env.DB.prepare(`SELECT COUNT(*) AS n FROM cheers WHERE entry_id = ?`).bind(entryId).first();
    return json({ ok: true, cheered: on, cheers: count.n });
  } catch (err) {
    return json({ error: 'Cheers need a database update (migration 002).' }, 500);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
