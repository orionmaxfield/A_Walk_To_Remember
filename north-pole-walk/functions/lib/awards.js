// Works out every award live from the mile entries that exist right now.
// Nothing is stored: remove an entry and the award it earned relocks on its own.
// Days, weeks and times of day all follow America/Denver.
//
// Used by GET /api/awards and by POST /api/miles (to spot freshly earned awards).

import '../../public/journey.js';
const JOURNEYS = globalThis.JOURNEYS;

/* ---------- America/Denver time ----------
   Mountain Standard Time is UTC-7. Daylight time (UTC-6) runs from the second
   Sunday in March at 2:00 am to the first Sunday in November at 2:00 am. */

const HOUR = 3600000;
const DAY = 86400000;

function dstBoundsUtc(year) {
  const marchDow = new Date(Date.UTC(year, 2, 1)).getUTCDay();
  const secondSunday = 1 + ((7 - marchDow) % 7) + 7;
  const novDow = new Date(Date.UTC(year, 10, 1)).getUTCDay();
  const firstSunday = 1 + ((7 - novDow) % 7);
  return [Date.UTC(year, 2, secondSunday, 9), Date.UTC(year, 10, firstSunday, 8)]; // 2am MST = 09:00Z, 2am MDT = 08:00Z
}

export function denverOffsetHours(ms) {
  const [start, end] = dstBoundsUtc(new Date(ms).getUTCFullYear());
  return ms >= start && ms < end ? -6 : -7;
}

// Local calendar parts for a UTC instant. dayIndex counts days so that
// consecutive days differ by 1; weekIndex counts Monday-to-Sunday weeks.
export function denver(ms) {
  const local = new Date(ms + denverOffsetHours(ms) * HOUR);
  const dayIndex = Math.floor(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) / DAY);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth(),
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    weekday: local.getUTCDay(),      // 0 = Sunday
    dayIndex,
    weekIndex: Math.floor((dayIndex - 4) / 7), // day 4 (1970-01-05) was a Monday
  };
}

// The UTC instant when a Denver day begins.
export function denverMidnightUtc(dayIndex) {
  const noonUtc = dayIndex * DAY + 12 * HOUR;
  return dayIndex * DAY - denverOffsetHours(noonUtc) * HOUR;
}

export const weekStartDay = (weekIndex) => weekIndex * 7 + 4;
export const weekEndUtc = (weekIndex) => denverMidnightUtc(weekStartDay(weekIndex) + 7); // first moment of the next week

export function parseSql(s) {
  return Date.parse(String(s).replace(' ', 'T') + 'Z');
}
export function toSql(ms) {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
}

/* ---------- Award definitions ---------- */

const PERSONAL = {
  laced: { id: 'laced-up', title: 'Laced Up', icon: 'boots', how: 'Log your first miles.' },
  milestones: [
    { id: 'miles-25', title: 'Trail Ready', icon: 'footprints', goal: 25 },
    { id: 'miles-100', title: 'Century Elf', icon: 'medal', goal: 100 },
    { id: 'miles-250', title: 'Seasoned Trekker', icon: 'backpack', goal: 250 },
    { id: 'miles-500', title: 'Legendary Elf', icon: 'crown', goal: 500 },
    { id: 'miles-1000', title: 'Mythic Elf', icon: 'comet', goal: 1000 },
  ],
  fairShare: { id: 'fair-share', title: 'Fair Share', icon: 'scales' },
  streaks: [
    { id: 'streak-3', title: 'On a Roll', icon: 'flame', goal: 3 },
    { id: 'streak-7', title: 'Unstoppable', icon: 'bolt', goal: 7 },
  ],
  elf: { id: 'elf-of-the-week', title: 'Elf of the Week', icon: 'trophy', how: 'Log the most miles on the team in a Monday-to-Sunday week.' },
  early: { id: 'early-bird', title: 'Early Bird', icon: 'sunrise', how: 'Log miles before 7:00 am.' },
  night: { id: 'night-owl', title: 'Night Owl', icon: 'moon', how: 'Log miles after 9:00 pm.' },
  weekend: { id: 'weekend-warrior', title: 'Weekend Warrior', icon: 'calendar', how: 'Log on both Saturday and Sunday of the same weekend.' },
  marathon: { id: 'marathoner', title: 'Marathoner', icon: 'ribbon', how: 'Log 26.2 miles or more in one entry.', goal: 26.2 },
  consistency: { id: 'consistency', title: 'Consistency', icon: 'checks', how: 'Log at least once a week for 4 weeks in a row.', goal: 4 },
};

const TEAM = {
  aboard: { id: 'all-aboard', title: 'All Aboard', icon: 'team', how: 'Everyone on the team logs at least once (2 or more walkers).' },
  bigDay: { id: 'big-day', title: 'Big Day', icon: 'bigday', how: 'Log 100 or more team miles in a single day.', goal: 100 },
};

function make(def, earnedMs, progress, extra) {
  return Object.assign({
    id: def.id,
    title: def.title,
    icon: def.icon,
    how: def.how,
    earned: earnedMs != null,
    earnedAt: earnedMs != null ? toSql(earnedMs) : null,
    progress: progress || null,
  }, extra || {});
}

const fmtMiles = (n) => (Math.round(n * 10) / 10).toLocaleString('en-US');

/* ---------- The calculation ---------- */

// entries: every mile entry for the team, oldest first ({ id, user_id, miles, logged_at }).
// members: everyone on the team ({ id, name }). userId: the signed-in person.
export function computeAwards({ journeyId, entries, members, userId, now = Date.now() }) {
  const J = JOURNEYS[journeyId] || JOURNEYS['north-pole'];
  const all = entries
    .map((e) => ({ ...e, miles: Number(e.miles), ms: parseSql(e.logged_at) }))
    .sort((a, b) => a.ms - b.ms || a.id - b.id)
    .map((e) => ({ ...e, at: denver(e.ms) }));
  const mine = all.filter((e) => e.user_id === userId);

  /* --- Team: journey stops, border crossings and milestones --- */
  // Signposted stops and the journey's milestones (no signpost), in trail order.
  const marks = J.waypoints.filter((wp) => wp.badge && wp.mile > 0)
    .concat((J.milestones || []).filter((m) => m.badge && m.mile > 0))
    .sort((a, b) => a.mile - b.mile);
  const team = [];
  let running = 0;
  const crossed = {}; // mile -> ms when the team total first reached it
  for (const e of all) {
    running += e.miles;
    for (const wp of marks) {
      if (crossed[wp.mile] == null && running >= wp.mile) crossed[wp.mile] = e.ms;
    }
  }
  for (const wp of marks) {
    const at = wp.mile.toLocaleString('en-US');
    const how = wp.kind === 'border' ? `Team crosses ${wp.name}, mile ${at}.`
      : wp.kind === 'milestone' ? `Team reaches ${wp.name}, mile ${at}.`
      : `Team reaches mile ${at}.`;
    team.push(make({ ...wp.badge, how }, crossed[wp.mile],
      { value: Math.min(running, wp.mile), goal: wp.mile, text: `${fmtMiles(Math.min(running, wp.mile))} / ${wp.mile.toLocaleString('en-US')} miles` },
      { mile: wp.mile, kind: wp.kind || 'stop' }));
  }

  /* --- Team: All Aboard --- */
  const firstEntryByUser = {};
  for (const e of all) if (firstEntryByUser[e.user_id] == null) firstEntryByUser[e.user_id] = e.ms;
  const logged = members.filter((m) => firstEntryByUser[m.id] != null);
  const aboardEarned = members.length >= 2 && logged.length === members.length
    ? Math.max(...logged.map((m) => firstEntryByUser[m.id])) : null;
  team.push(make(TEAM.aboard, aboardEarned, {
    value: logged.length, goal: members.length,
    text: members.length < 2 ? 'Needs a team of 2 or more' : `${logged.length} / ${members.length} walkers have logged`,
  }));

  /* --- Team: Big Day --- */
  let bigDayEarned = null, bestDay = 0;
  const dayTotals = {};
  for (const e of all) {
    const k = e.at.dayIndex;
    dayTotals[k] = (dayTotals[k] || 0) + e.miles;
    if (dayTotals[k] > bestDay) bestDay = dayTotals[k];
    if (bigDayEarned == null && dayTotals[k] >= TEAM.bigDay.goal) bigDayEarned = e.ms;
  }
  team.push(make(TEAM.bigDay, bigDayEarned, { value: Math.min(bestDay, 100), goal: 100, text: `Best day so far: ${fmtMiles(bestDay)} / 100 miles` }));

  /* --- Elf of the Week (completed Monday-to-Sunday weeks) --- */
  const weekUser = {}; // weekIndex -> { userId -> miles }
  for (const e of all) {
    const w = e.at.weekIndex;
    weekUser[w] = weekUser[w] || {};
    weekUser[w][e.user_id] = (weekUser[w][e.user_id] || 0) + e.miles;
  }
  const nameOf = (id) => { const m = members.find((x) => x.id === id); return m ? m.name : 'Someone'; };
  const winnersOf = (w) => {
    const sums = weekUser[w] || {};
    const best = Math.max(0, ...Object.values(sums));
    return best > 0 ? Object.keys(sums).filter((id) => sums[id] === best) : [];
  };
  const completedWeeks = Object.keys(weekUser).map(Number).filter((w) => weekEndUtc(w) <= now).sort((a, b) => a - b);
  const myWins = completedWeeks.filter((w) => winnersOf(w).includes(userId));
  const lastWeek = denver(now).weekIndex - 1;
  const lastWeekWinners = winnersOf(lastWeek).map(nameOf).sort((a, b) => a.localeCompare(b));
  const elfOfLastWeek = {
    weekStart: toSql(denverMidnightUtc(weekStartDay(lastWeek))),
    names: lastWeekWinners,
  };

  /* --- Personal --- */
  const personal = [];
  personal.push(make(PERSONAL.laced, mine.length ? mine[0].ms : null, null));

  let myTotal = 0, biggest = 0, marathonMs = null, earlyMs = null, nightMs = null;
  const reached = {};
  for (const e of mine) {
    myTotal += e.miles;
    for (const m of PERSONAL.milestones) if (reached[m.id] == null && myTotal >= m.goal) reached[m.id] = e.ms;
    if (e.miles > biggest) biggest = e.miles;
    if (marathonMs == null && e.miles >= PERSONAL.marathon.goal) marathonMs = e.ms;
    if (earlyMs == null && e.at.hour < 7) earlyMs = e.ms;
    if (nightMs == null && e.at.hour >= 21) nightMs = e.ms;
  }
  for (const m of PERSONAL.milestones) {
    personal.push(make({ ...m, how: `Log ${m.goal.toLocaleString('en-US')} miles in total.` }, reached[m.id],
      { value: Math.min(myTotal, m.goal), goal: m.goal, text: `${fmtMiles(Math.min(myTotal, m.goal))} / ${m.goal.toLocaleString('en-US')} miles` }));
  }

  // Fair Share: your own miles reach the journey total split evenly across the current team.
  // The goal moves as people join or leave, so it is worked out fresh every time.
  const walkers = Math.max(1, members.length);
  const share = Math.ceil(J.totalMiles / walkers);
  let shareMs = null, soFar = 0;
  for (const e of mine) { soFar += e.miles; if (soFar >= share) { shareMs = e.ms; break; } }
  personal.push(make({
    ...PERSONAL.fairShare,
    how: `Walk your share of the trail: ${J.totalMiles.toLocaleString('en-US')} miles ÷ ${walkers} ${walkers === 1 ? 'walker' : 'walkers'} ≈ ${share.toLocaleString('en-US')} miles.`,
  }, shareMs, { value: Math.min(myTotal, share), goal: share, text: `${fmtMiles(Math.min(myTotal, share))} / ${share.toLocaleString('en-US')} miles` }, { goal: share }));

  // Streaks: consecutive Denver days with at least one entry
  const days = [...new Set(mine.map((e) => e.at.dayIndex))].sort((a, b) => a - b);
  const firstOnDay = (d) => mine.find((e) => e.at.dayIndex === d).ms;
  const streakEarned = {}; let bestStreak = 0, run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1] + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    for (const s of PERSONAL.streaks) if (streakEarned[s.id] == null && run >= s.goal) streakEarned[s.id] = firstOnDay(days[i]);
  }
  for (const s of PERSONAL.streaks) {
    personal.push(make({ ...s, how: `Log miles ${s.goal} days in a row.` }, streakEarned[s.id],
      { value: Math.min(bestStreak, s.goal), goal: s.goal, text: `Best streak: ${Math.min(bestStreak, s.goal)} / ${s.goal} days` }));
  }

  personal.push(make(PERSONAL.elf, myWins.length ? weekEndUtc(myWins[0]) : null, null, { count: myWins.length }));
  personal.push(make(PERSONAL.early, earlyMs, null));
  personal.push(make(PERSONAL.night, nightMs, null));

  // Weekend Warrior: a Saturday and the Sunday right after it
  let weekendMs = null;
  for (const d of days) {
    if ((d + 4) % 7 === 0 && days.includes(d - 1)) { weekendMs = Math.max(firstOnDay(d - 1), firstOnDay(d)); break; } // (d + 4) % 7 === 0 is a Sunday
  }
  personal.push(make(PERSONAL.weekend, weekendMs, null));

  personal.push(make(PERSONAL.marathon, marathonMs,
    { value: Math.min(biggest, 26.2), goal: 26.2, text: `Longest entry: ${fmtMiles(biggest)} / 26.2 miles` }));

  // Consistency: 4 Monday-to-Sunday weeks in a row with an entry
  const weeks = [...new Set(mine.map((e) => e.at.weekIndex))].sort((a, b) => a - b);
  let consistencyMs = null, bestWeeks = 0; run = 0;
  for (let i = 0; i < weeks.length; i++) {
    run = i > 0 && weeks[i] === weeks[i - 1] + 1 ? run + 1 : 1;
    bestWeeks = Math.max(bestWeeks, run);
    if (consistencyMs == null && run >= PERSONAL.consistency.goal) consistencyMs = mine.find((e) => e.at.weekIndex === weeks[i]).ms;
  }
  personal.push(make(PERSONAL.consistency, consistencyMs,
    { value: Math.min(bestWeeks, 4), goal: 4, text: `Best run: ${Math.min(bestWeeks, 4)} / 4 weeks` }));

  return { team, personal, elfOfLastWeek };
}

// Awards that are earned in `after` but were not in `before`.
export function newlyEarned(before, after) {
  const was = new Set([...before.team, ...before.personal].filter((a) => a.earned).map((a) => a.id));
  return [...after.team.map((a) => ({ ...a, section: 'team' })), ...after.personal.map((a) => ({ ...a, section: 'personal' }))]
    .filter((a) => a.earned && !was.has(a.id));
}
