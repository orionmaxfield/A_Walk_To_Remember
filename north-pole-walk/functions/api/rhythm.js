// GET /api/rhythm — your personal walking rhythm across every walk you're on:
// today's miles, this week's miles (Monday to Sunday, Denver time), your streak
// of days in a row with a walk, and your goal (migration 004).

import { denver, denverMidnightUtc, parseSql, toSql } from '../lib/awards.js';

const LOOKBACK_DAYS = 400;

export async function onRequestGet({ env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const now = Date.now();
  const today = denver(now);
  const since = toSql(denverMidnightUtc(today.dayIndex - LOOKBACK_DAYS));
  const rows = await env.DB.prepare(
    `SELECT miles, logged_at FROM mile_entries WHERE user_id = ? AND logged_at >= ? ORDER BY logged_at`
  ).bind(data.user.id, since).all();

  const byDay = {};
  let todayMiles = 0, weekMiles = 0;
  const weekFlags = [false, false, false, false, false, false, false]; // Monday .. Sunday of this week
  for (const r of rows.results) {
    const at = denver(parseSql(r.logged_at));
    const miles = Number(r.miles);
    byDay[at.dayIndex] = (byDay[at.dayIndex] || 0) + miles;
    if (at.dayIndex === today.dayIndex) todayMiles += miles;
    if (at.weekIndex === today.weekIndex) { weekMiles += miles; weekFlags[(at.weekday + 6) % 7] = true; }
  }

  // Streak: days in a row with a walk, counting back from today (or from
  // yesterday, if today hasn't been walked yet: the streak is alive until
  // midnight). One missed day is forgiven per streak (a grace day), so a
  // single off day never wipes out weeks of walking.
  let streak = 0, graceUsed = false, graceDay = null;
  const walkedToday = Boolean(byDay[today.dayIndex]);
  let d = walkedToday ? today.dayIndex : today.dayIndex - 1;
  if (!walkedToday && !byDay[d] && byDay[d - 1]) { graceUsed = true; graceDay = d; d -= 1; } // yesterday was the off day
  while (byDay[d]) {
    streak++;
    d--;
    if (!byDay[d] && !graceUsed && byDay[d - 1]) { graceUsed = true; graceDay = d; d--; }
  }
  if (streak === 0) { graceUsed = false; graceDay = null; }

  let best = 0, run = 0;
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }

  // The goal lives on the user (migration 004). Without it, there's simply no goal yet.
  let goal = null, goalSupported = false;
  try {
    const g = await env.DB.prepare(`SELECT goal_miles, goal_period FROM users WHERE id = ?`).bind(data.user.id).first();
    goalSupported = true;
    if (g && g.goal_miles) goal = { miles: Number(g.goal_miles), period: g.goal_period === 'week' ? 'week' : 'day' };
  } catch (err) { goalSupported = false; }

  return json({
    todayMiles: round(todayMiles),
    weekMiles: round(weekMiles),
    weekFlags,                                   // which days of this week (Mon..Sun) had a walk
    weekDays: weekFlags.filter(Boolean).length,
    weekDaysGoal: 3,                             // the weekly mini-goal: walk on 3 different days
    todayIndexInWeek: (today.weekday + 6) % 7,
    streak,
    walkedToday,
    graceUsed,
    graceDay: graceDay != null ? toSql(denverMidnightUtc(graceDay) + 12 * 3600000).slice(0, 10) : null,
    bestStreak: best,
    daysWalked: days.length,
    goal,
    features: { goal: goalSupported },
  });
}

function round(n) { return Math.round(Number(n) * 100) / 100; }

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
