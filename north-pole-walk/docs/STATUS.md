# Stroll: status and build list

_Written Thu Oct 29, 2026, on branch `claude/loving-cerf-7dwr4l`. Nothing here is live until Orion says "merge."_

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
2. **Step syncing, phase one: the iPhone app shell.** Wrap the web app with Capacitor, read daily steps from HealthKit, and post them as mile entries (about 2,000 steps per mile, configurable). Manual entry stays as the fallback. Plan in `docs/step-sync-plan.md`. Needs Orion's Apple developer account (Nov 3).
3. **Public sign-up polish.** Landing page copy on the cover and a short "how it works" for first-timers. (Account deletion and renaming are done.)
4. **App Store readiness.** App icon, splash screen, screenshots, privacy labels, support page. Checklist reusable for Earmark. Target submission mid-December.
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
