// POST /api/auth/google  { credential }
// The browser sends the Google sign-in token here. We ask Google to confirm it,
// save the person in the users table, and hand back a session cookie.

const SESSION_DAYS = 90;

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Setup needed: the database is not connected yet.' }, 500);
  if (!env.GOOGLE_CLIENT_ID || env.GOOGLE_CLIENT_ID.includes('PASTE-YOUR')) {
    return json({ error: 'Setup needed: GOOGLE_CLIENT_ID is not set in wrangler.toml.' }, 500);
  }

  const body = await request.json().catch(() => ({}));
  if (!body.credential) return json({ error: 'No sign-in token was sent.' }, 400);

  // Ask Google whether this token is real and meant for our app.
  const check = await fetch(
    'https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(body.credential)
  );
  if (!check.ok) return json({ error: 'Google did not accept that sign-in. Try again.' }, 401);
  const info = await check.json();

  const validIssuer = info.iss === 'accounts.google.com' || info.iss === 'https://accounts.google.com';
  if (!validIssuer || info.aud !== env.GOOGLE_CLIENT_ID) {
    return json({ error: 'That sign-in token was issued for a different app.' }, 401);
  }
  if (info.email_verified !== 'true' && info.email_verified !== true) {
    return json({ error: 'Your Google email is not verified.' }, 401);
  }

  const name = (info.name || info.email.split('@')[0]).slice(0, 80);

  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, picture = excluded.picture`
  ).bind(info.sub, info.email, name, info.picture || null).run();

  const token = randomHex(32);
  const expires = sqlDate(Date.now() + SESSION_DAYS * 86400 * 1000);
  await env.DB.prepare(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`
  ).bind(token, info.sub, expires).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
    },
  });
}

function randomHex(bytes) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

// SQLite's datetime('now') looks like "2026-10-12 22:40:00"; match that format so comparisons work.
function sqlDate(ms) {
  return new Date(ms).toISOString().replace('T', ' ').slice(0, 19);
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
