# Tests

`npm test` runs the browser checks against a throwaway copy of the app:

1. builds a local D1 database under `tests/.state` from `schema.sql`, the migrations and `tests/seed.sql` (three walkers with fixed session cookies, the office's North Pole team, a finished Camino walk);
2. starts the place-lookup stub and `wrangler pages dev` on port 8799;
3. runs every `tests/specs/*.test.js` with Node's test runner and Playwright's Chromium;
4. stops the servers.

Nothing touches a real database or the network. Run one file with `npm test -- specs/offline.test.js`.

| Spec | What it proves |
| --- | --- |
| `first-run` | a new walker: picker → destination → solo walk → starter goal → Journey at mile 0 |
| `quick-add` | +2 moves the hero number and lands in the feed; the form takes a number and a note |
| `offline` | an entry made offline is queued, shown as pending, counted once, and sent when back online |
| `office` | the office's team flow: create with no destination (North Pole, elf), add miles, Team tab, a friend joins by code |
| `arrival` | a finished walk: celebration, finale layer and fireworks, the share card renders to a full-size PNG |
| `km` | kilometre mode on every main tab, no stray " mi" |
| `funnel` | launch counts: a front-page view and a first entry count as daily totals; only ADMIN_EMAILS can read them |

First time: `npm install` (wrangler and Playwright), then `npx playwright install chromium` once.
