// GET /api/config — tells the page whether setup is complete and which Google client ID to use.
// (The client ID is public by design; it is safe to send to the browser.)

export function onRequestGet({ env }) {
  const clientId = env.GOOGLE_CLIENT_ID || '';
  const body = {
    googleClientId: clientId.includes('PASTE-YOUR') ? '' : clientId,
    dbReady: Boolean(env.DB),
    // Sign in with Apple switches on when APPLE_CLIENT_ID (the web Services ID) is set.
    appleClientId: (String(env.APPLE_CLIENT_ID || '').split(',')[0] || '').trim(),
    // Which build this is (Cloudflare Pages sets the commit on every deploy); 'dev' locally.
    build: env.CF_PAGES_COMMIT_SHA ? String(env.CF_PAGES_COMMIT_SHA).slice(0, 7) : 'dev',
    branch: env.CF_PAGES_BRANCH || '',
  };
  return new Response(JSON.stringify(body), {
    headers: { 'Content-Type': 'application/json' },
  });
}
