// Stroll's service worker. It keeps the app shell (not the API) cached for a
// quick start and for "Add to Home Screen", and it makes the app tolerant of
// no signal: the last good copy of each API read is kept, and served only when
// the network fails. Writes (adding miles) never go through here; app.js queues
// them on the phone and sends them when the connection is back.

const SHELL_CACHE = 'stroll-shell-v3';
const API_CACHE = 'stroll-api-v1';
const SHELL = ['/', '/styles.css', '/app.js', '/journey.js', '/custom.js', '/scene.js', '/badges.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/fonts/fraunces-latin-wght.woff2', '/fonts/inter-latin-wght.woff2'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(SHELL_CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== SHELL_CACHE && k !== API_CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;

  // Signing out forgets the cached reads, so the next person on this phone never sees them.
  if (req.method === 'POST' && url.pathname === '/api/auth/logout') {
    event.respondWith(fetch(req).then((res) => { caches.delete(API_CACHE).catch(() => {}); return res; }));
    return;
  }
  if (req.method !== 'GET') return;

  if (url.pathname.startsWith('/api/')) {
    // Network first. Keep the last good copy; use it only when the network is gone.
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) { const copy = res.clone(); caches.open(API_CACHE).then((c) => c.put(req, copy)).catch(() => {}); }
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || new Response(JSON.stringify({ error: 'You seem to be offline.', offline: true }), { status: 503, headers: { 'Content-Type': 'application/json' } })))
    );
    return;
  }

  // App files: network first, cache as a fallback, so new deploys show up right away.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && (SHELL.includes(url.pathname) || url.pathname.startsWith('/icons/'))) {
          const copy = res.clone();
          caches.open(SHELL_CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/') : undefined)))
  );
});
