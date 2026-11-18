# Stroll review, Nov 18, 2026

Branch `claude/stroll-polish-nov18` (from `claude/loving-cerf-7dwr4l`). Preview only, test database only.
Read `public/` and `functions/`, ran `npm test` (7 of 8 passing at the start; the one failure was console noise from Google's sign-in script on localhost, not an app bug), and looked at every main screen at 390x844.

The app is in good shape visually. The problems worth fixing are mostly about what happens when something goes wrong.

## Top 10 problems

| # | Problem | Where | Status |
| --- | --- | --- | --- |
| 1 | **A failed first load leaves the grey loading boxes up for good.** If `/api/journey` fails the app never recovers, and if `/api/me` fails for any reason other than "signed out" (no signal, server error) a signed-in walker is shown the sign-in page. | `app.js` `boot()` | Fixed |
| 2 | **Miles saved offline can be thrown away silently.** When the queue is sent, any refusal that is not "no signal" (sign-in expired while offline, a server error) drops the entry, and the toast still says "Your walk is saved." | `app.js` `flushQueue()` | Fixed |
| 3 | **The pencil on the You tab can open a blank form.** Edit looks the entry up in the walk's latest 30 entries only. On a busy team an entry from a few days back is not there, so the walker lands on an empty "Log a walk" form and adds a duplicate instead of editing. | `app.js` `edit-entry` | Fixed |
| 4 | **Editing an entry can move it to another day.** The edit form always re-sends the day, worked out in the phone's time zone, while the server keeps days in Denver time. Outside Mountain time a late-evening entry shifts a day, or is refused with "That day hasn't happened yet." | `app.js` add-miles submit | Fixed |
| 5 | **Route map: the road ahead is almost invisible.** The unwalked trail and upcoming stops are `#242428` on `#141416` (about 1.2:1), and the map shows no distances. | `styles.css` `.route-map`, `routeMapCard()` | Fixed |
| 6 | **Leaderboard is hard to scan.** Long names wrap to three lines, rank numbers are 3.9:1, there is no sense of how far apart people are, and it only sorts by all-time miles, so someone who joins late can never climb. | `standingsCard()` | Partly fixed (names, ranks, bars). A "This week" sort is next. |
| 7 | **You tab: a failed diary load also leaves loading boxes forever** (a toast flashes, then nothing). Same when changing month with no signal. | `loadHistory()` | Fixed with 1 |
| 8 | **"Remove" deletes an entry in one tap**, with no confirm and no undo, right next to "Edit". | `delete-entry` | Fixed (Undo on the toast) |
| 9 | **A save whose reply is lost can be counted twice.** If the server stores the entry but the phone never hears back, the entry is queued and sent again. The real fix is a one-time key per entry, which needs a new column (a migration on both databases). | `addMiles()`, `functions/api/miles.js` | Not fixed: needs a migration, so it needs Orion's OK |
| 10 | **Days, weeks and streaks run on Denver time for everyone.** Right for the office; wrong for a public launch (a walker in New York loses their streak at 2 AM their time). Needs a time zone per walker. The launch-funnel "one count per day" also uses the UTC day. | `functions/lib/awards.js` | Not fixed: a design decision before the public launch |

## Smaller things noticed

- The feed is ordered by when an entry was typed in, not by its day, so a back-dated walk sits above today's.
- Signing out throws away miles still waiting to send, without a warning.
- The calendar's hover text says "mi" in kilometre mode.
- Tied walkers on the leaderboard get different ranks.
- The accessibility pass in `STATUS.md` (screen-reader labels on the scene, ring, postcards; 200% text) is still open.
- `rememberPendingJoin()` and a few sign-in paths touch `localStorage` without a guard (private mode on older Safari).

## What I would do next

1. "This week / All time" switch on the leaderboard.
2. The one-time key for entries (problem 9), with migration 006, once Orion OKs running it on `stroll-test` and then live.
3. Per-walker time zone (problem 10) before any public launch push.
4. The accessibility pass.
