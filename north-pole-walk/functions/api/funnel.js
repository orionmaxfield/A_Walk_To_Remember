// POST /api/funnel { step: 'landing' }   — count a front-page view (no sign-in needed; totals only)
// GET  /api/funnel?days=14               — the daily counts, for the emails in ADMIN_EMAILS
import { STEPS, bump, isAdmin } from '../lib/funnel.js';

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  // Only the front-page view is counted from the browser; the other steps are counted by the server.
  if (body.step !== 'landing') return json({ error: 'Not a step the page can count.' }, 400);
  await bump(env, 'landing');
  return json({ ok: true });
}

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);
  if (!isAdmin(env, data.user)) return json({ error: 'The launch numbers are only shown to the addresses in ADMIN_EMAILS.' }, 403);
  const url = new URL(request.url);
  const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 14));
  const since = new Date(Date.now() - (days - 1) * 86400 * 1000).toISOString().slice(0, 10);
  let rows = [];
  try {
    rows = (await env.DB.prepare(`SELECT day, step, count FROM funnel_days WHERE day >= ? ORDER BY day DESC`).bind(since).all()).results || [];
  } catch (err) {
    return json({ error: 'The funnel table is not there yet (migration 005).' }, 500);
  }
  const byDay = {};
  for (const r of rows) {
    byDay[r.day] = byDay[r.day] || { day: r.day, landing: 0, signin: 0, first_entry: 0, day2: 0 };
    if (STEPS.includes(r.step)) byDay[r.day][r.step] = r.count;
  }
  const list = Object.values(byDay).sort((a, b) => (a.day < b.day ? 1 : -1));
  const totals = { landing: 0, signin: 0, first_entry: 0, day2: 0 };
  for (const d of list) for (const s of STEPS) totals[s] += d[s];
  return json({ days, since, rows: list, totals });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
