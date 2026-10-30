// PATCH /api/goal  { miles, period } — set your personal goal ('day' or 'week').
//                   miles 0 or empty clears it.

export async function onRequestPatch({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);
  const body = await request.json().catch(() => ({}));
  const miles = Math.round(Number(body.miles || 0) * 100) / 100;
  const period = body.period === 'week' ? 'week' : 'day';
  if (!Number.isFinite(miles) || miles < 0) return json({ error: 'Enter a number of miles.' }, 400);
  if (miles > (period === 'week' ? 500 : 100)) return json({ error: 'That goal is bigger than the trail. Pick something you can keep.' }, 400);
  try {
    await env.DB.prepare(`UPDATE users SET goal_miles = ?, goal_period = ? WHERE id = ?`)
      .bind(miles > 0 ? miles : null, period, data.user.id).run();
  } catch (err) {
    return json({ error: 'Goals need a database update (migration 004).' }, 500);
  }
  return json({ ok: true, goal: miles > 0 ? { miles, period } : null });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
