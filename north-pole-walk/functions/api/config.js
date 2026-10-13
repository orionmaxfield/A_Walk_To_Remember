// GET /api/config — tells the page whether setup is complete and which Google client ID to use.
// (The client ID is public by design; it is safe to send to the browser.)

export function onRequestGet({ env }) {
  const clientId = env.GOOGLE_CLIENT_ID || '';
  const body = {
    googleClientId: clientId.includes('PASTE-YOUR') ? '' : clientId,
    dbReady: Boolean(env.DB),
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
