// Runs before every /api/* request.
// Reads the "session" cookie and, if it's valid, attaches the user to context.data.user.

export async function onRequest(context) {
  const { request, env, data, next } = context;
  data.user = null;

  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/(?:^|;\s*)session=([a-f0-9]{64})/);

  if (match && env.DB) {
    const row = await env.DB.prepare(
      `SELECT u.id, u.email, u.name, u.picture
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = ? AND s.expires_at > datetime('now')`
    ).bind(match[1]).first();
    if (row) data.user = row;
  }

  const response = await next();
  // Never cache API responses.
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
