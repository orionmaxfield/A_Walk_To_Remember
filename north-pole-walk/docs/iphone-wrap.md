# Wrapping Stroll as an iPhone app (December)

_Plan for the Capacitor build. Nothing here is built yet; the web app is ready for it._

## The shape of it

One codebase. The website at north-pole-walk.pages.dev keeps serving everyone on the web; the iPhone app is the same `public/` folder inside a Capacitor shell, talking to the same Cloudflare API. The office's team and every walker's data stay where they are.

```
ios app (Capacitor, WKWebView)
  └─ public/ (index.html, app.js, scene.js, fonts, icons)  ← bundled, loads instantly
       └─ fetch → https://north-pole-walk.pages.dev/api/…      ← same server, same database
```

## What is already in place

- **Design and layout.** Safe-area insets for the notch and home bar, 44pt tap targets, no hover-only interactions, `viewport-fit=cover`, a black status bar, 220ms transitions. Nothing depends on a browser chrome.
- **Fonts in the bundle.** Fraunces and Inter ship in `public/fonts/`, so type is identical offline and in the wrapper.
- **Offline tolerance.** Miles logged with no signal queue in local storage and send on reconnect. (The service worker's API cache is a web-only extra: WKWebView does not run service workers for `capacitor://` pages, and the app does not need it to.)
- **Configurable API address.** `app.js` reads two optional globals, set by a one-line `<script>` in the wrapper's `index.html` before `app.js` loads:
  ```html
  <script>window.STROLL_API_BASE = 'https://north-pole-walk.pages.dev'; window.STROLL_WEB_ORIGIN = 'https://north-pole-walk.pages.dev';</script>
  ```
  `STROLL_API_BASE` prefixes every `/api/…` call (requests are sent with credentials); `STROLL_WEB_ORIGIN` is used for invite links so they open on the web, not `capacitor://localhost`. On the website both are unset and everything stays relative. Put that script **before** the small inline script already in the head: it fires the first API requests (config, sign-in, last walk) and reads `STROLL_API_BASE` too.
- **Icons and launch images** in the new colors live in `public/icons/` (1024px master can be rendered from `scratchpad`'s icon script; the 512 is the same art).

## What has to change for the wrapper

1. **Sign-in.** Google blocks its web sign-in inside embedded web views. Use the Capacitor Google Auth plugin (native sign-in sheet) to obtain the ID token, then post it to the existing `POST /api/auth/google { credential }`; that endpoint already verifies Google ID tokens, so the server needs only the iOS client id added to its accepted audiences (one more value in `GOOGLE_CLIENT_ID`, comma-separated, or a second var). The web keeps the current popup flow.
2. **Session cookie across origins.** The API sets `session` as `HttpOnly; Secure; SameSite=Lax`. From a `capacitor://localhost` page that is a cross-site request, so set `SameSite=None` when the request's Origin is the app's (keep `Lax` for the website), and answer CORS for that one origin: `Access-Control-Allow-Origin: capacitor://localhost`, `Access-Control-Allow-Credentials: true`, plus the preflight for `PATCH`/`DELETE`. About 15 lines in `functions/api/_middleware.js`. Alternative if cookies prove fiddly: have the auth endpoint also return the token and send it as a bearer header from the app.
3. **Deep links.** Invite links (`/join/CODE`) should open the app when it is installed: an `apple-app-site-association` file on the website and Associated Domains in the app. `rememberPendingJoin()` already reads the code from the path, so the app only needs to hand the URL to the web view.
4. **Native touches.** Status bar style, splash screen from `public/icons/splash-*.png` (Capacitor's splash plugin takes a single 2732px image), haptics on quick add (one line with the Haptics plugin, guarded so the web ignores it), and "Share" using the Share plugin where `navigator.share` is absent.
5. **Step sync** follows `docs/step-sync-plan.md` once the shell works.

## Build steps (when the time comes)

```
npm i @capacitor/core @capacitor/cli @capacitor/ios
npx cap init Stroll com.orionmaxfield.stroll --web-dir public
npx cap add ios
# add the two globals to a wrapper copy of index.html (or inject via a Capacitor config hook)
npx cap sync ios && npx cap open ios
```

Then in Xcode: bundle id, team, icons, splash, Associated Domains, the Google URL scheme for the sign-in plugin. TestFlight to the office before the store.

## Checklist against Apple's review

- Sign in with Apple is required when Google sign-in is offered. Plan one more button on the cover (Apple's JS SDK on the web, the native plugin in the app) and a `POST /api/auth/apple`; same `users` table.
- Account deletion is already in Settings (required since 2022).
- Privacy policy page exists at `/privacy.html`; the App Privacy answers are: name, email and photo from the sign-in; walking entries; no tracking.
