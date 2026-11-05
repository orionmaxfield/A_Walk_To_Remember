// GET /api/recap?team=TEAM_ID — last week (Monday to Sunday, Denver time) on one walk:
// how far the walk moved, your own miles and days, the best day, and the stops passed.
// Shown as a card on Mondays; works for solo and group walks alike.

import { denver, denverMidnightUtc, weekStartDay, parseSql, toSql } from '../lib/awards.js';
import { attachCustom } from './me.js';
import '../../public/journey.js';
import '../../public/custom.js';

const JOURNEYS = globalThis.JOURNEYS;
const customJourney = globalThis.customJourney;

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);
  const teamId = new URL(request.url).searchParams.get('team') || '';
  const member = teamId && await env.DB.prepare(`SELECT 1 AS ok FROM team_members WHERE team_id = ? AND user_id = ?`).bind(teamId, data.user.id).first();
  if (!member) return json({ error: 'You are not on that walk.' }, 403);

  const now = denver(Date.now());
  const lastWeek = now.weekIndex - 1;
  const from = denverMidnightUtc(weekStartDay(lastWeek));
  const to = denverMidnightUtc(weekStartDay(lastWeek) + 7);

  const [team, before, week, members] = await env.DB.batch([
    env.DB.prepare(`SELECT id, name, journey_id, kind FROM teams WHERE id = ?`).bind(teamId),
    env.DB.prepare(`SELECT COALESCE(SUM(miles), 0) AS total FROM mile_entries WHERE team_id = ? AND logged_at < ?`).bind(teamId, toSql(from)),
    env.DB.prepare(`SELECT user_id, miles, logged_at FROM mile_entries WHERE team_id = ? AND logged_at >= ? AND logged_at < ?`).bind(teamId, toSql(from), toSql(to)),
    env.DB.prepare(`SELECT u.id, u.name FROM team_members m JOIN users u ON u.id = m.user_id WHERE m.team_id = ?`).bind(teamId),
  ]);
  const t = team.results[0] || {};
  await attachCustom(env, [t]);
  const J = t.journey_id === 'custom' && t.custom ? customJourney(t.custom) : (JOURNEYS[t.journey_id] || JOURNEYS['north-pole']);

  const startMile = Number(before.results[0].total);
  let teamMiles = 0, myMiles = 0;
  const myDays = new Set(), dayTotals = {}, byUser = {};
  for (const e of week.results) {
    const miles = Number(e.miles);
    const at = denver(parseSql(e.logged_at));
    teamMiles += miles;
    byUser[e.user_id] = (byUser[e.user_id] || 0) + miles;
    if (e.user_id === data.user.id) {
      myMiles += miles;
      myDays.add(at.dayIndex);
      dayTotals[at.dayIndex] = (dayTotals[at.dayIndex] || 0) + miles;
    }
  }
  let bestDay = null;
  for (const [d, mi] of Object.entries(dayTotals)) if (!bestDay || mi > bestDay.miles) bestDay = { dayIndex: Number(d), miles: round(mi) };
  if (bestDay) {
    const dt = new Date(denverMidnightUtc(bestDay.dayIndex) + 12 * 3600000);
    bestDay.weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][denver(dt.getTime()).weekday];
  }
  const endMile = Math.min(startMile + teamMiles, J.totalMiles);
  const stopsPassed = J.waypoints.filter((w) => w.mile > startMile && w.mile <= endMile && w.mile > 0).map((w) => w.name);
  const walkers = Object.keys(byUser).length;
  const top = Object.entries(byUser).sort((a, b) => b[1] - a[1])[0];
  const topName = top ? (members.results.find((m) => m.id === top[0]) || {}).name : null;

  return json({
    weekStart: toSql(from),
    isMonday: now.weekday === 1,
    teamMiles: round(teamMiles), myMiles: round(myMiles), myDays: myDays.size,
    bestDay, startMile: round(startMile), endMile: round(endMile), stopsPassed,
    walkers, topName, kind: t.kind, arrived: endMile >= J.totalMiles,
  });
}

function round(n) { return Math.round(Number(n) * 100) / 100; }
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
