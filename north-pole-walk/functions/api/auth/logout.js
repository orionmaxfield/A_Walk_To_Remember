// POST /api/auth/logout — ends the session and clears the cookie.

export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([a-f0-9]{64})/);
  if (match && env.DB) {
    await env.DB.prepare(`DELETE FROM sessions WHERE token = ?`).bind(match[1]).run();
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0',
    },
  });
}
