// POST /api/auth/apple  { id_token, name? }
// Sign in with Apple. The browser (Apple's JS on the web, the native sheet in the iPhone app)
// hands us Apple's identity token; we check its signature against Apple's public keys, make
// sure it was issued for this app, save the person, and hand back the same session cookie
// Google sign-in uses. Off until APPLE_CLIENT_ID is set (a comma-separated list is fine:
// the web Services ID and the iOS bundle id).

import { bump } from '../../lib/funnel.js';

const SESSION_DAYS = 90;
const APPLE_KEYS = 'https://appleid.apple.com/auth/keys';
const APPLE_ISS = 'https://appleid.apple.com';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ error: 'Setup needed: the database is not connected yet.' }, 500);
  const audiences = String(env.APPLE_CLIENT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!audiences.length) return json({ error: 'Sign in with Apple is not switched on yet.' }, 404);

  const body = await request.json().catch(() => ({}));
  const token = String(body.id_token || '');
  const parts = token.split('.');
  if (parts.length !== 3) return json({ error: 'No sign-in token was sent.' }, 400);

  let header, claims;
  try {
    header = JSON.parse(b64urlToString(parts[0]));
    claims = JSON.parse(b64urlToString(parts[1]));
  } catch (err) { return json({ error: 'That sign-in token could not be read.' }, 400); }

  // Signature: find Apple's key by kid and verify RS256 over header.payload
  let keys;
  try {
    const res = await fetch(APPLE_KEYS, { cf: { cacheTtl: 3600 } });
    keys = (await res.json()).keys || [];
  } catch (err) { return json({ error: 'Apple could not be reached to confirm the sign-in. Try again.' }, 502); }
  const jwk = keys.find((k) => k.kid === header.kid && k.alg === (header.alg || 'RS256'));
  if (!jwk) return json({ error: 'Apple did not recognise that sign-in. Try again.' }, 401);
  let valid = false;
  try {
    const key = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
    valid = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(parts[2]), new TextEncoder().encode(parts[0] + '.' + parts[1]));
  } catch (err) { valid = false; }
  if (!valid) return json({ error: 'Apple did not accept that sign-in. Try again.' }, 401);

  // Claims: issuer, audience, expiry
  const aud = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== APPLE_ISS || !aud.some((a) => audiences.includes(a))) {
    return json({ error: 'That sign-in token was issued for a different app.' }, 401);
  }
  if (!claims.exp || claims.exp * 1000 < Date.now()) return json({ error: 'That sign-in has expired. Try again.' }, 401);
  if (!claims.sub) return json({ error: 'That sign-in token is missing an id.' }, 401);

  // Apple sends the name only on the very first sign-in (the client passes it along), and the
  // email may be a private relay address or, on later sign-ins, absent. Keep what we have.
  const id = `apple:${claims.sub}`;
  const existing = await env.DB.prepare(`SELECT id, email, name FROM users WHERE id = ?`).bind(id).first();
  const givenName = body.name && typeof body.name === 'object' ? [body.name.firstName, body.name.lastName].filter(Boolean).join(' ') : String(body.name || '');
  const email = String(claims.email || (existing && existing.email) || '').slice(0, 200);
  const name = (givenName || (existing && existing.name) || (email ? email.split('@')[0] : 'Walker')).slice(0, 80);
  if (!email) return json({ error: 'Apple did not share an email address for this account.' }, 401);

  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, NULL)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name`
  ).bind(id, email, name).run();
  if (!existing) await bump(env, 'signin');

  const session = randomHex(32);
  const expires = sqlDate(Date.now() + SESSION_DAYS * 86400 * 1000);
  await env.DB.prepare(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`).bind(session, id, expires).run();

  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': `session=${session}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
    },
  });
}

function b64urlToBytes(s) {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function b64urlToString(s) { return new TextDecoder().decode(b64urlToBytes(s)); }

function randomHex(bytes) {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}
function sqlDate(ms) { return new Date(ms).toISOString().replace('T', ' ').slice(0, 19); }
function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}
