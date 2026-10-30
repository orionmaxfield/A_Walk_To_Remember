// GET /api/history?month=YYYY-MM — your own walks for one month, across every
// walk you're on: one line per entry, plus a per-day total for the calendar.
// Days follow Denver time, like the awards and the streak.

import { denver, denverMidnightUtc, parseSql, toSql } from '../lib/awards.js';

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const q = new URL(request.url).searchParams.get('month') || '';
  const m = q.match(/^(\d{4})-(\d{2})$/);
  const today = denver(Date.now());
  const year = m ? Number(m[1]) : today.year;
  const month = m ? Number(m[2]) - 1 : today.month; // 0-based
  if (!(year >= 2020 && year <= 2100 && month >= 0 && month <= 11)) return json({ error: 'That month does not look right.' }, 400);

  const firstDay = Math.floor(Date.UTC(year, month, 1) / 86400000);
  const nextMonthDay = Math.floor(Date.UTC(year, month + 1, 1) / 86400000);
  const from = toSql(denverMidnightUtc(firstDay));
  const to = toSql(denverMidnightUtc(nextMonthDay));

  const rows = await env.DB.prepare(
    `SELECT e.id, e.team_id, e.miles, e.note, e.logged_at, t.name AS team_name, t.kind, t.journey_id
       FROM mile_entries e JOIN teams t ON t.id = e.team_id
      WHERE e.user_id = ? AND e.logged_at >= ? AND e.logged_at < ?
      ORDER BY e.logged_at DESC, e.id DESC`
  ).bind(data.user.id, from, to).all();

  const days = {};
  let total = 0;
  const entries = rows.results.map((r) => {
    const at = denver(parseSql(r.logged_at));
    const day = at.day;
    days[day] = (days[day] || 0) + Number(r.miles);
    total += Number(r.miles);
    return { id: r.id, team_id: r.team_id, team_name: r.team_name, kind: r.kind, journey_id: r.journey_id, miles: Number(r.miles), note: r.note, logged_at: r.logged_at, day };
  });

  const allTime = await env.DB.prepare(
    `SELECT COALESCE(SUM(miles), 0) AS miles, COUNT(*) AS entries FROM mile_entries WHERE user_id = ?`
  ).bind(data.user.id).first();

  return json({
    year, month: month + 1,
    daysInMonth: nextMonthDay - firstDay,
    firstWeekday: new Date(Date.UTC(year, month, 1)).getUTCDay(), // 0 = Sunday
    days: Object.fromEntries(Object.entries(days).map(([d, mi]) => [d, Math.round(mi * 100) / 100])),
    total: Math.round(total * 100) / 100,
    entries,
    allTimeMiles: Math.round(Number(allTime.miles) * 100) / 100,
    allTimeEntries: Number(allTime.entries),
    today: { year: today.year, month: today.month + 1, day: today.day },
  });
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
