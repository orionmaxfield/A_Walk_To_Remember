# Step syncing plan (Apple Health first)

_Plan only. Nothing in this document is built yet._

## What we're building

Steps counted by the phone turn into miles on the walk automatically, every day, with no typing. Apple Health (HealthKit) on iPhone first, because it is required at launch. Fitbit, Garmin and Strava follow. Manual entry stays as the fallback for everyone.

## How it works

1. **Stroll becomes a real iPhone app** by wrapping the existing web app with Capacitor. The web app keeps running at the same address; the iPhone app is the same pages inside a native shell. One codebase, no rewrite.
2. **Reading steps.** A small native plugin asks for permission to read step counts from HealthKit (read-only, steps only). Each time the app opens, and once a day in the background, it reads the daily step totals since the last sync.
3. **Posting steps.** The app sends each day's steps to a new endpoint, `POST /api/steps`, with the date and the count. The server converts steps to miles (2,000 steps per mile by default; the walker can set their stride later) and stores one entry per day, per walk, marked `source = 'healthkit'`. Re-syncing the same day updates that entry instead of adding a second one, so a day is never counted twice.
4. **Choosing walks.** Synced steps go to the walker's chosen walk (default: their solo journey). A toggle on each walk says "count my synced steps here."
5. **Manual entries stay separate.** Hand-logged miles are additional, for activities a step counter misses (swimming, biking, calories). The Add miles screen shows the synced total for the day so nobody double-logs a walk.

## Database changes (later, with a migration)

- `mile_entries`: add `source TEXT NOT NULL DEFAULT 'manual'` and `day TEXT` (the local calendar day a synced entry covers), with a unique index on `(team_id, user_id, source, day)` for synced rows.
- `users`: add `steps_per_mile INTEGER DEFAULT 2000`.

## Privacy

Only daily step counts leave the phone, nothing else from Health. The privacy page gets a line saying so. Apple requires a clear purpose string for Health access ("Stroll reads your step count to move you along your walk").

## Timeline

- Nov 3: Apple developer account ready. Create the app record, bundle id, and the Health capability.
- Week of Nov 10: Capacitor shell, sign-in working inside the app (Google sign-in inside a native shell needs the iOS client id added to the same Google project).
- Week of Nov 17: HealthKit plugin, `/api/steps`, daily sync, duplicate protection.
- Week of Dec 1: icon, splash, screenshots, TestFlight to the office.
- Mid-December: App Store submission. First review can take days to a couple of weeks.

## Reusable App Store checklist (Stroll and Earmark)

1. App record in App Store Connect: name, bundle id, SKU, primary category.
2. Icons (1024 px master) and splash screen.
3. Privacy: policy URL, App Privacy "nutrition label" answers, purpose strings for any permission.
4. Screenshots for 6.7" and 6.1" iPhones (and iPad if supported).
5. Description, keywords, support URL, marketing URL.
6. Sign in with Apple is required if the app offers Google sign-in (Apple's rule). Add it.
7. Account deletion inside the app (Apple's rule since 2022).
8. Age rating questionnaire.
9. TestFlight build to a few testers first.
10. Submit for review; answer any questions within a day to keep the queue spot.

## Later: Fitbit, Garmin, Strava, Android

Each is a server-side connection (the walker signs in to the service once; Stroll pulls daily totals). They need developer accounts with each service and a small nightly job on Cloudflare (a scheduled Worker). Android uses Health Connect through the same Capacitor shell.
