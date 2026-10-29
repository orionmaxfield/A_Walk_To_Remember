// GET /api/me — who is signed in, and which walks (solo journeys and teams) they belong to.

export async function onRequestGet({ env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const teams = await env.DB.prepare(
    `SELECT t.id, t.name, t.invite_code, t.journey_id, t.kind
       FROM teams t
       JOIN team_members m ON m.team_id = t.id
      WHERE m.user_id = ?
      ORDER BY m.joined_at`
  ).bind(data.user.id).all();
  const list = teams.results || [];
  await attachCustom(env, list);

  return json({ user: data.user, teams: list });
}

// Custom destinations keep their places in teams.custom_json (migration 003).
// Until a database has that column, custom walks simply don't exist yet.
export async function attachCustom(env, teams) {
  const ids = teams.filter((t) => t.journey_id === 'custom').map((t) => t.id);
  for (const t of teams) t.custom = null;
  if (!ids.length) return;
  try {
    const rows = await env.DB.prepare(
      `SELECT id, custom_json FROM teams WHERE id IN (${ids.map(() => '?').join(',')})`
    ).bind(...ids).all();
    const byId = Object.fromEntries(rows.results.map((r) => [r.id, r.custom_json]));
    for (const t of teams) if (byId[t.id]) { try { t.custom = JSON.parse(byId[t.id]); } catch (e) { t.custom = null; } }
  } catch (err) { /* column missing: leave custom null */ }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// DELETE /api/me — delete your account: your sessions, your miles, your memberships,
// and any walk you started that nobody else is on. Walks that still have other
// members keep their shared miles but your name comes off them.
export async function onRequestDelete({ env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);
  const uid = data.user.id;

  const mine = await env.DB.prepare(
    `SELECT t.id FROM teams t
      WHERE t.created_by = ?
        AND NOT EXISTS (SELECT 1 FROM team_members m WHERE m.team_id = t.id AND m.user_id <> ?)`
  ).bind(uid, uid).all();
  const emptyTeams = (mine.results || []).map((r) => r.id);

  const statements = [];
  for (const id of emptyTeams) {
    statements.push(env.DB.prepare(`DELETE FROM mile_entries WHERE team_id = ?`).bind(id));
    statements.push(env.DB.prepare(`DELETE FROM team_members WHERE team_id = ?`).bind(id));
    statements.push(env.DB.prepare(`DELETE FROM teams WHERE id = ?`).bind(id));
  }
  statements.push(env.DB.prepare(`DELETE FROM mile_entries WHERE user_id = ?`).bind(uid));
  statements.push(env.DB.prepare(`DELETE FROM team_members WHERE user_id = ?`).bind(uid));
  statements.push(env.DB.prepare(`DELETE FROM sessions WHERE user_id = ?`).bind(uid));
  statements.push(env.DB.prepare(`DELETE FROM users WHERE id = ?`).bind(uid));
  await env.DB.batch(statements);

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
