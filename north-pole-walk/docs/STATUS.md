# Stroll: status and build list

_Written Thu Oct 29, 2026, updated Wed Nov 4, on branch `claude/loving-cerf-7dwr4l`. Nothing here is live until Orion says "merge."_

## Nov 4: the new look, flow and mobile readiness

Twenty-two pushes in one day, each checked at 390px and 1366px with no console errors. Preview: https://claude-loving-cerf-7dwr4l.north-pole-walk.pages.dev (runs on the `stroll-test` database).

- **Identity.** Deep orange on near-black on design tokens; `docs/design-system.md` explains colors (WCAG AA figures), type (Fraunces + Inter, shipped in the repo), the 8pt grid, radii, depth, motion and the mobile rules. The storybook paper style is retired. Every screen converted: Journey, picker (cover cards, carousel), destination detail, Somewhere real, Add miles, Awards, You, Team, Settings, sign-in cover.
- **Journey art.** One premium dusk style for every destination (accent-tinted sky, ember horizon, silhouette hills, one warm light, particles, vignette). Single-board signposts with name and mile. The walker restyled for dusk with a proper stride. A route map card and milestone postcards (lazy-drawn) share the art.
- **Flow.** First run in three steps (sign in → pick → starter goal → Journey with the first-step prompt). Skeleton loaders, optimistic quick add with rollback, 220ms tab transitions, streaks that forgive one missed day, error toasts with "Try again" on a lost connection.
- **Mobile.** Offline queue for miles with no signal (synced on reconnect), a service worker that keeps the last good reads, icons and iPhone launch images in the new colors, safe areas, 44pt targets (checked by script), configurable API address for the wrapper. The plan for the December Capacitor build is in `docs/iphone-wrap.md`.
- **Office flow** (create a team the old way, elf scene, miles, awards, join by code) re-tested as two users on the new look; the "real route" notice now only shows to teams that already have miles.
- **Later (pushes 53–59), from the assistant's reviews:** single-column desktop feed, centered story card, start dot hidden near the marker, postcards with large centered landmarks and their own sky tints, the next stop as a hero heading, "you" wording for anyone walking alone; then the four launch items: a signed-out landing page (how it works, phone mockups, destination carousel, "Start walking free"), an opt-in daily reminder (Settings toggle and time; banner and notification while open; `docs/nudges-plan.md` for iPhone local notifications and web push), the weekly mini-goal (This week card, recap line, Steady Week badge) and Sign in with Apple behind the `APPLE_CLIENT_ID` flag.
- **Afternoon (pushes 26–42).** Link previews (Open Graph tags, social card) and an invite landing on the cover; the privacy page on the identity; kilometer-mode sweep; the You calendar's walked days as full discs; the assistant's review fixes (desktop pairs, feed rows, distinct postcards with per-stop hour and landmark, route-map start and labels, Scarecrow); header wordmark, ring track tint and start tick, desktop quick-add pills, ring sweep after the starter goal; a finale scene at every finish plus a shareable "I walked to ___" card drawn on the phone; pull to refresh; an optional chime with a Settings toggle (off by default); and the scene as a shared header that stays mounted across tabs.
- **Evening (pushes 61–64), from the assistant's 2 PM list:** two new journeys at full art quality, *To the Center of the Earth* (Verne, 1864; a cave roof, crystal galleries, the lit sea, Stromboli) and *The Great Wall* (real, Jiayuguan to the Old Dragon's Head; the wall rides the ridges the whole way), plus a fix that made every still picture show the right spot on the trail; `npm test`, a Playwright suite on a throwaway local D1 (first run, quick add, offline, the office flow, arrival, kilometres, launch counts; `tests/README.md`); launch measurement (Cloudflare Web Analytics behind `CF_ANALYTICS_TOKEN`, a daily sign-up funnel in `funnel_days` readable by `ADMIN_EMAILS`, the privacy page updated; migration 005). Not reached: the accessibility pass (screen-reader labels on the scene, route map, ring and postcards; focus order; 200% text) and the invited-friend welcome screen. Both are next.

Open questions for Orion: a third journey (Pacific Crest Trail) or not; the bundle id for the iPhone app (`com.orionmaxfield.stroll` is the placeholder), and the Apple developer setup that switches on Sign in with Apple (`docs/iphone-wrap.md`). Still open from October: whether award descriptions should convert to kilometers (miles for now).

## Where the app stands today

**Live (main, what the office uses):** one journey, Layton to the North Pole, 3,381 miles following the office poster. Google sign-in, teams with invite links, miles or calories logged by hand, a shared storybook scene with an elf, a mile marker, "Remember" self-care notes from the poster, team and personal badges with pop-ups, Elf of the Week, a celebration at the Pole. No known bugs reported in the channel.

**Safety catch found and fixed on this branch:** `wrangler.toml` had a single database binding, so every deploy (branch previews included) talked to the office's real database. The branch now has a separate `[env.preview]` section that points previews at the `stroll-test` database. Previews cannot reach the office's data once that is in place.

**Built today on this branch (preview only):**

- Solo journeys. A new walker picks a destination and walks it alone. An invite link is always there; the moment a friend joins, the walk becomes a group walk. The office's existing team keeps working exactly as before.
- Seven polished preset destinations with their own scenery, stops, "Did you know?" facts and badges: the Yellow Brick Road (Oz), the Camino de Santiago, Second Star to the Right (Neverland), the Road to Camelot, Across the Sea to Atlantis, the Quest to the Dark Mountain (our own wink), and the Appalachian Trail. No trademarked names. The office's North Pole route is kept private to the office.
- A hiker walker for the new trails (the elf stays on the North Pole walk).
- Awards adapt: "Walker of the Week" instead of "Elf of the Week" off the North Pole route; solo walks skip the team-only awards.
- Cover page now says Stroll.
- Rename a walk (creator only) and delete your account from the app.
- Activity feed with cheers: tap the heart on anyone's miles; "You and Sam cheered" lines; "Show more" for the full list.
- Leaderboard with an off switch: all-time and this-week miles per walker; the organizer can hide it for everyone. (Needs `migrations/002_cheers_leaderboard.sql`; until it runs, both features hide themselves.)
- Faster miles entry: one-tap quick add (+0.5/1/2/3), steps as a unit, back-dating a missed day, editing any of your own entries.
- Daily rhythm: streak, a daily or weekly goal with a progress ring (needs `migrations/004_goals.sql`), and "X mi to the next stop" on the Journey tab.
- Progress feel: a "you are here" banner and mile-post pulse after every entry, confetti at every stop, and a You tab with a month calendar and the month's walks.
- Visual polish: readable gold text on paper (5:1), thumb-friendly tabs and 40px+ tap targets, light native controls on paper cards, a Stroll signpost mark on the cover, card lift and art fades on the destination cards.

**Decided but not built:** automatic step syncing (Apple Health first). See `docs/step-sync-plan.md`.

## Build list, in order

Each item is small enough to preview and check on its own. Items 1 to 4 are what the public launch needs; 5 onward are polish and growth.

1. _(built, needs a decision)_ **Custom real-world destination.** "Somewhere real" on the destination screen: type a start and a finish, pick the right match, and the app measures the road (straight-line distance plus a fifth) and builds a journey with distance-based milestones. Uses OpenStreetMap's free Nominatim lookup for now (no key, one lookup per new walk, attribution shown). Orion's call whether to keep it or move to a paid map service before the launch ads; the provider lives in one file. Needs `migrations/003_custom_destinations.sql`.
2. **The iPhone app shell, then step syncing.** Wrap the web app with Capacitor (plan and what must change in `docs/iphone-wrap.md`: native Google sign-in, the session cookie across origins, deep links, Sign in with Apple), then read daily steps from HealthKit and post them as mile entries (`docs/step-sync-plan.md`). Needs Orion's Apple developer account.
3. **Public sign-up polish.** Landing page copy on the cover and a short "how it works" for first-timers. (Account deletion and renaming are done.)
4. **App Store readiness.** Screenshots, privacy labels, support page (icon and launch images are done). Checklist reusable for Earmark. Target submission mid-December.
5. **Nudges.** Weekly streak nudges or email digests, to keep New Year walkers consistent through February. (The feed, cheers, streak and goal ring are done.)
6. _(done: leaderboard with an off switch)_
7. _(merged into 5)_
8. **More destinations.** The Great Wall (3,890 miles of actual wall; good for big teams), Land's End to John o' Groats, the Pacific Crest Trail, Around the World in Eighty Days (team epic). Plus a public edition of the North Pole walk if Orion wants one.
9. **Fitbit, Garmin and Strava sync.** Server-side connections after the iPhone app ships.
10. **Android (Health Connect).** Phase two unless it turns out cheap once Capacitor is in place.
11. **Monetization hooks (no paywall).** Data shapes for optional journey packs, a supporter tier and sponsored journeys, so they can be added later without a rebuild. Free users keep everything.

## Flags for Orion (no answer needed today)

- **Neverland in the UK.** Barrie's Peter Pan is public domain in the US. In the UK, Great Ormond Street Hospital holds a permanent right to royalties on performances and publications of the play. A walking app that uses place names from the book is almost certainly outside that, but it is the one destination with any question mark. Easy to swap out if you'd rather.
- **The office walk's "Mount Doom" stop** is a Tolkien name. It stays private to the office, so it is fine as is; it just should not go into a public preset.
- **Real-route mileages** (Camino, Appalachian Trail) are approximate, and say so in the blurb.
