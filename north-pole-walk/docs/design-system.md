# Stroll design system

_Nov 4, 2026. The source of truth is the token block at the top of `public/styles.css`; this page explains the choices._

## Identity

Deep orange on near-black. Orange is the accent, never the wallpaper: it marks the one thing that matters on a screen (the primary button, the progress fill, the active tab, the hero number). Everything else is black, charcoal and warm off-white.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#0B0B0C` | page background |
| `--surface` | `#141416` | cards |
| `--raised` | `#1C1C1F` | raised elements inside cards (inputs, chips, list rows) |
| `--hairline` | `rgba(255,255,255,0.08)` | card and row borders |
| `--accent` | `#E85D04` | primary buttons, progress, active tab, hero numbers |
| `--accent-press` | `#C2410C` | hover and pressed |
| `--accent-glow` | `rgba(255,122,26,0.18)` | soft glow behind hero cards, focus rings |
| `--text` | `#F5F1EA` | body text |
| `--text-2` | `#A8A29E` | secondary text, labels |
| `--text-3` | `#78716C` | tertiary, placeholders |
| `--success` | `#4ADE80` | done states |
| `--danger` | `#F87171` | destructive actions, errors |

Contrast (WCAG AA): `--text` on `--surface` 15.6:1; `--text-2` on `--surface` 7.0:1; `--accent` on `--bg` 5.1:1 (fine for large text, icons and hero numbers, and for 15px+ bold); body-size regular text in orange is avoided. Black text on an orange button: `#0B0B0C` on `#E85D04` is 5.4:1, so primary buttons use black text.

## Type

- Display: **Fraunces** (500–600 weight) for titles and hero numbers. Tabular numerals on anything that counts.
- Body: **Inter**, 400/500/600.
- Both ship in the repo (`public/fonts/`, variable weight, Latin subset, SIL OFL) and are preloaded; nothing is fetched from Google, so type is identical offline and inside the iPhone wrapper.
- Scale (px / line-height): 34/40 display, 28/34 title, 22/28 heading, 17/24 body-large, 15/22 body, 13/18 caption. Tokens `--fs-34` … `--fs-13`.
- One hero number per card, set in display at 34–44px with `font-variant-numeric: tabular-nums`.

## Space, shape, depth

- 8pt grid: `--s1` 4, `--s2` 8, `--s3` 12, `--s4` 16, `--s5` 24, `--s6` 32, `--s7` 48.
- Radius: `--r-card` 20px, `--r-control` 14px, `--r-pill` 999px.
- Depth: cards sit flat on the background with a hairline border; `--shadow-card` is a soft, low shadow (`0 8px 24px rgba(0,0,0,0.35)`); hero cards add `--glow` (`0 0 0 1px rgba(255,122,26,0.18), 0 12px 40px rgba(232,93,4,0.14)`).
- Icons: 24px, 1.75px stroke, round caps, `currentColor`. No filled icons except the active tab.
- Award badges: the badge art is drawn in many colors; earned badges are tinted to the warm orange with a CSS filter so the trophy case reads as one set, and locked ones are dim gray.
- Scenes: one premium dusk style for every destination (sky tinted by the destination's accent, ember horizon, silhouette hills, one warm light, vignette). Signposts are a single dark board with the name and the mile. The walker is muted with a rim light and an orange scarf as its one accent. At the finish a finale adds an accent glow and fireworks.
- The scene is a shared header: it sits above the tab content, stays mounted across tab changes, folds to a strip centered on the walker off the Journey (118px phone, 150px desktop, 260ms ease) and rebuilds only when the walk or the mile changes.
- Postcards render each stop at its own hour of the day with a landmark silhouette picked from the stop's name, so a strip of them reads as different places.

## Motion

- Taps feel instant: optimistic UI, then reconcile. Pressed state scales to 0.98 in 90ms.
- Page transitions: 220ms fade-and-rise. Progress fills: 900ms with `cubic-bezier(0.22, 1, 0.36, 1)`.
- Everything respects `prefers-reduced-motion: reduce`.
- Scenes animate with CSS transforms only (no layout work per frame).

## Mobile rules

- Tap targets at least 44px; primary actions in the thumb zone (bottom half).
- Safe-area insets on the tab bar and page padding.
- No hover-only interactions; `touch-action: manipulation` on controls.
- Skeleton blocks (`.skeleton`) while loading, never spinners.
- The bottom tab bar is the only global navigation: Journey, Log, Friends, Awards, You. Settings lives behind a gear.

## Screens

All converted on Nov 4: Journey, destination picker, destination detail, Somewhere real, Add miles, Awards, You, Team/Friends, Settings, sign-in cover, privacy page. Every push is checked at 390px and 1366px with no console errors, and the tap-target sweep (`targets.js` in the build session's scratchpad; any element under 40px is listed) runs after layout changes.
