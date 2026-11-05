# Daily reminders ("Walk today to keep your streak")

_Nov 4, 2026. The opt-in reminder is built on the web; this page says what it does today and how it becomes a real notification in the iPhone app and on the web._

## What is built

- **Settings → Daily reminder:** Off / On and a time (default 6:00 PM). Off by default. Stored on the device as `nudge = { on, time: "HH:MM" }` in local storage, the same shape the iPhone wrapper will read.
- **The check:** while Stroll is open, once a minute (and once right after the Journey loads) the app asks: is the reminder on, is it past the chosen time, has nothing been logged today, has today's reminder not been shown yet? If so, once per day:
  - a banner on the Journey ("Walk today to keep your 4-day streak." with a Later button), and
  - a system notification with the same words if the person allowed notifications (the toggle asks the first time it is switched on).
- **The words** come from the rhythm: a streak of 2 or more names the streak; a streak of 1 says "Walk today and you have a 2-day streak"; otherwise "A short walk today moves you along the trail."

So on a phone's home-screen install the reminder works whenever Stroll is in the foreground at that time, and on a desktop tab that is left open. It cannot wake a closed app yet; that needs one of the two pieces below.

## iPhone app (December): local notifications

The Capacitor Local Notifications plugin schedules a repeating notification at the chosen time on the device, no server involved:

1. When the preference is saved (on, time), schedule a daily local notification at that time with the streak wording (recompute and reschedule each time the app opens, so the streak number is fresh).
2. On each app open, if the person has already logged today, cancel today's pending notification.
3. Tapping the notification opens the Journey.

The web code reads and writes the same `nudge` preference, so no new UI is needed in the wrapper; a small bridge module maps the preference to the plugin.

## Web push (for people who stay on the website)

Needed to reach a closed browser: a server has to send the push.

1. **Keys:** generate a VAPID key pair; the public key goes to the client as `config.vapidPublicKey`, the private key to the sender as a secret.
2. **Subscribe:** when the toggle turns on and `config.vapidPublicKey` exists, `registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey })` and `POST /api/push` with the subscription and the chosen time. Table: `push_subscriptions (user_id, endpoint, p256dh, auth, remind_at, tz, created_at)` (migration 005, additive).
3. **Send:** a scheduled Worker (Pages Functions have no cron) runs every 15 minutes, selects subscriptions whose local time just passed `remind_at` and whose user has no entry today, and sends a Web Push with the streak wording (the `web-push` approach: VAPID JWT + aes128gcm payload encryption).
4. **Receive:** `sw.js` handles `push` (showNotification) and `notificationclick` (focus or open the Journey).

Rough size: a day of work once the keys exist, mostly the sender Worker and its deploy.

## Privacy

Reminders are opt-in and off by default. For web push, the only new data stored is the browser's push subscription and the chosen time; it is deleted on sign-out, on account deletion, and when the toggle goes off.
