# Stroll review, Nov 18, 2026

Branch `claude/stroll-polish-nov18` (from `claude/loving-cerf-7dwr4l`). Preview only, test database only.
Read `public/` and `functions/`, ran `npm test` (7 of 8 passing at the start; the one failure was console noise from Google's sign-in script on localhost, not an app bug), and looked at every main screen at 390x844.

The app is in good shape visually. The problems worth fixing are mostly about what happens when something goes wrong.

## Top 10 problems

| # | Problem | Where | Status |
| --- | --- | --- | --- |
| 1 | **A failed first load leaves the grey loading boxes up for good.** If `/api/journey` fails the app never recovers, and if `/api/me` fails for any reason other than "signed out" (no signal, server error) a signed-in walker is shown the sign-in page. | `app.js` `boot()` | Fixed |
| 2 | **Miles saved offline can be thrown away silently.** When the queue is sent, any refusal that is not "no signal" (sign-in expired while offline, a server error) drops the entry, and the toast still says "Your walk is saved." | `app.js` `flushQueue()` | Fixed: an entry is dropped only on a final refusal (400, 403, 404) and the message says so; an expired sign-in or server error keeps it on the phone. |
| 3 | **The pencil on the You tab can open a blank form.** Edit looks the entry up in the walk's latest 30 entries only. On a busy team an entry from a few days back is not there, so the walker lands on an empty "Log a walk" form and adds a duplicate instead of editing. | `app.js` `edit-entry` | Fixed |
| 4 | **Editing an entry can move it to another day.** The edit form always re-sends the day, worked out in the phone's time zone, while the server keeps days in Denver time. Outside Mountain time a late-evening entry shifts a day, or is refused with "That day hasn't happened yet." | `app.js` add-miles submit | Fixed for a plain edit: the day is sent only when the walker changes it. Picking a new day from another time zone still goes by Denver days (see 10). |
| 5 | **Route map: the road ahead is almost invisible.** The unwalked trail and upcoming stops are `#242428` on `#141416` (about 1.2:1), and the map shows no distances. | `styles.css` `.route-map`, `routeMapCard()` | Fixed |
| 6 | **Leaderboard is hard to scan.** Long names wrap to three lines, rank numbers are 3.8:1, there is no sense of how far apart people are, and it only sorts by all-time miles, so someone who joins late can never climb. | `standingsCard()` | Partly fixed (names, ranks, bars). A "This week" sort is next. |
| 7 | **You tab: a failed diary load also leaves loading boxes forever** (a toast flashes, then nothing). Same when changing month with no signal. | `loadHistory()` | Fixed with 1 |
| 8 | **"Remove" deletes an entry in one tap**, with no confirm and no undo, right next to "Edit". | `delete-entry` | Fixed (asks "Remove this entry?" first). An Undo on the toast would be nicer; not done. |
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

## Checks

`npm test` passes 11 of 11 at the end (8 existing specs plus 3 new ones in `tests/specs/resilience.test.js`: failed first load and Try again, a queued walk surviving a server error, an edit not re-sending its day).

## Second pass, Nov 18 evening

Branch `claude/stroll-polish-nov18b` (from `claude/stroll-polish-nov18`). Preview only, test database only. Walked every main screen again at 390 and 1366 wide with a script that measures text contrast, names on controls, tap sizes and sideways scroll.

| # | What changed | Where |
| --- | --- | --- |
| 1 | **Keyboard focus is easy to see.** The old ring was a 45% orange glow (about 2.5:1 on black, nearly invisible around an orange button), it changed a pill's corners while focused, and it replaced the control's own shadow. Now a solid light-orange outline (10:1) a hair off the control; inside the control on the tab bar and the scrolling strips so nothing clips it. | `styles.css` `:focus-visible` |
| 2 | **Small grey text passes AA.** `--text-3` went from `#78716C` (3.8:1 on a card, 4.1:1 on the page) to `#918A84` (5.4:1 and 5.8:1): tab-bar labels, weekday letters, the hints under the quick-add tiles, the build line. | `styles.css` tokens |
| 3 | **Pop-ups work from the keyboard and with a screen reader.** The postcard, new-award and arrival pop-ups take the focus, close with Escape (Enter or Space on the first two), and hand the focus back. The whole app is no longer one live region, which made a screen reader re-read the screen after every change; toasts and pop-ups still announce themselves. The You calendar is a list with a spoken name per day. | `app.js` pop-ups, `index.html`, `youScreen()` |
| 4 | **A failed Awards load says so.** It used to flash a toast and leave the loading boxes up for good (the same fault as problems 1 and 7, missed on this tab). Now: "Your awards could not load" with Try again. | `loadAwards()`, `awardsScreen()` |
| 5 | **Four small bugs from the list above.** Tied walkers share a rank (1, 1, 3). The calendar's day label follows the walker's unit. Every `localStorage` call is guarded, so private mode on older Safari can sign in, join and switch walks. Signing out with walks still waiting to send asks first. | `standingsCard()`, `youScreen()`, `lsGet/lsSet/lsDel`, `sign-out` |
| 6 | **Fonts and icons are kept by the phone.** A new `public/_headers` file: fonts for a year, icons for a week, `nosniff` on everything. Pages, scripts and styles keep the default check on every visit so a deploy shows up at once. | `public/_headers` |

Not done, still worth doing: the PNG icons and the social card could shrink by roughly a third with a lossless squeeze (no tool for it on this machine); the scene itself has no spoken description; text at 200% zoom has not been checked; and none of the screen-reader changes have been heard on a real phone with VoiceOver, only checked in the page structure.

`npm test` passes 16 of 16 (11 before, plus 5 in `tests/specs/polish.test.js`).
