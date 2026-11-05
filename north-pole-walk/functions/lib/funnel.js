// Launch funnel: daily totals only. Four steps are counted, one number per day each:
//   landing      someone saw the signed-out front page (once per browser per day)
//   signin       a new account was created
//   first_entry  a walker logged their first miles ever
//   day2         a walker came back on a day after the one they signed up on
// Nothing here says who; the table has a date, a step and a count. The only per-account
// mark is users.returned_on, the one date a walker first came back, so day2 counts once.
// Until migration 005 has run, every call here quietly does nothing.

export const STEPS = ['landing', 'signin', 'first_entry', 'day2'];

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export async function bump(env, step) {
  if (!env.DB || !STEPS.includes(step)) return;
  try {
    await env.DB.prepare(
      `INSERT INTO funnel_days (day, step, count) VALUES (?, ?, 1)
       ON CONFLICT(day, step) DO UPDATE SET count = count + 1`
    ).bind(today(), step).run();
  } catch (err) { /* the table is not there yet */ }
}

// Mark a walker's first return visit (a later day than sign-up) and count it once.
export async function noteReturn(env, userId) {
  if (!env.DB) return;
  try {
    const r = await env.DB.prepare(
      `UPDATE users SET returned_on = ? WHERE id = ? AND returned_on IS NULL AND substr(created_at, 1, 10) < ?`
    ).bind(today(), userId, today()).run();
    if (r.meta && r.meta.changes === 1) await bump(env, 'day2');
  } catch (err) { /* column missing until migration 005 */ }
}

// Who may read the numbers: the emails in ADMIN_EMAILS (comma-separated).
export function isAdmin(env, user) {
  if (!user || !env.ADMIN_EMAILS) return false;
  const list = String(env.ADMIN_EMAILS).split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
  return list.includes(String(user.email || '').toLowerCase());
}
