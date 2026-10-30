// Badge icons for the Awards tab, drawn as simple inline SVG shapes.
// Each entry is the inside of a 48 × 48 viewBox. app.js wraps it in <svg>.

const BADGE_ICONS = {
  falls: `
    <path d="M4 14 h14 l2 6 h8 l2 -6 h14 v8 H4 z" fill="#8a7a6a"/>
    <rect x="18" y="18" width="12" height="20" fill="#6fb4ff"/>
    <path d="M21 19 v17 M25 19 v17 M28 19 v14" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M4 22 h14 v8 H4 z M30 22 h14 v8 H30 z" fill="#6b5f54"/>
    <ellipse cx="24" cy="39" rx="18" ry="5" fill="#6fb4ff"/>
    <path d="M12 39 q3 -2 6 0 M30 40 q3 -2 6 0" fill="none" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="20" cy="37" r="2" fill="#fbfbf7"/><circle cx="27" cy="38" r="2.2" fill="#fbfbf7"/>`,
  canoe: `
    <path d="M4 28 q20 14 40 0 q-20 4 -40 0 z" fill="#b8462f" stroke="#7b2f22" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M8 29 q16 4 32 0" fill="none" stroke="#e2b04c" stroke-width="1.5"/>
    <path d="M30 10 L18 34" stroke="#7b4a21" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M16 33 q-2 6 2 8 q4 -2 2 -8 z" fill="#8b5a2b"/>
    <path d="M4 40 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  swan: `
    <path d="M10 30 q2 10 16 10 q14 0 16 -12 q-10 5 -18 1 z" fill="#fbfbf7" stroke="#9aa4ad" stroke-width="1.2"/>
    <path d="M24 30 q-6 -3 -6 -11 q0 -8 6 -9 q5 0 6 4" fill="none" stroke="#fbfbf7" stroke-width="4" stroke-linecap="round"/>
    <path d="M24 30 q-6 -3 -6 -11 q0 -8 6 -9 q5 0 6 4" fill="none" stroke="#9aa4ad" stroke-width="1" stroke-linecap="round"/>
    <path d="M29 13 l5 1.5 l-5 1.5 z" fill="#2b241f"/>
    <circle cx="25.5" cy="12.5" r="1" fill="#2b241f"/>
    <path d="M4 42 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  highway: `
    <path d="M18 44 L22 8 h4 l4 36 z" fill="#6b5f54"/>
    <path d="M24 12 v4 M24 22 v5 M24 33 v6" stroke="#e2b04c" stroke-width="1.8" stroke-linecap="round"/>
    <rect x="30" y="6" width="14" height="18" rx="3" fill="#fbfbf7" stroke="#2f7a3f" stroke-width="2"/>
    <rect x="36" y="24" width="2" height="12" fill="#7b4a21"/>
    <text x="37" y="19" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="9" fill="#2f7a3f">47</text>
    <path d="M4 44 L10 30 L16 44 Z" fill="#2f7a3f"/><path d="M6 36 L11 24 L16 36 Z" fill="#3f9150"/>`,
  signforest: `
    <rect x="11" y="10" width="3" height="34" fill="#7b4a21"/><rect x="31" y="14" width="3" height="30" fill="#7b4a21"/>
    <rect x="3" y="11" width="16" height="6" rx="1" fill="#c9553d"/><rect x="8" y="19" width="14" height="5" rx="1" fill="#6fb4ff"/>
    <rect x="4" y="26" width="15" height="5" rx="1" fill="#e2b04c"/><rect x="9" y="33" width="12" height="5" rx="1" fill="#fbfbf7" stroke="#6b5f54" stroke-width="0.8"/>
    <rect x="25" y="15" width="16" height="6" rx="1" fill="#3f9150"/><rect x="27" y="23" width="15" height="5" rx="1" fill="#fbfbf7" stroke="#6b5f54" stroke-width="0.8"/>
    <rect x="24" y="30" width="13" height="5" rx="1" fill="#c9553d"/><rect x="28" y="37" width="14" height="4" rx="1" fill="#e2b04c"/>
    <path d="M38 4 L44 14 H32 Z" fill="#2f7a3f"/>`,
  sternwheeler: `
    <path d="M4 32 h36 l-4 6 h-30 z" fill="#fbfbf7" stroke="#6b5f54" stroke-width="1.2"/>
    <rect x="8" y="24" width="28" height="8" fill="#fbfbf7" stroke="#6b5f54" stroke-width="1.2"/>
    <rect x="14" y="17" width="16" height="7" fill="#fbfbf7" stroke="#6b5f54" stroke-width="1.2"/>
    <rect x="18" y="8" width="4" height="9" fill="#2b241f"/>
    <g fill="#e2b04c"><rect x="11" y="26" width="3" height="3"/><rect x="17" y="26" width="3" height="3"/><rect x="23" y="26" width="3" height="3"/><rect x="29" y="26" width="3" height="3"/></g>
    <circle cx="41" cy="33" r="5" fill="none" stroke="#c9553d" stroke-width="2.5"/>
    <path d="M41 28 v10 M36 33 h10" stroke="#c9553d" stroke-width="1.5"/>
    <circle cx="22" cy="5" r="2.5" fill="#c9c6d2"/>
    <path d="M2 42 q5 -3 10 0 t10 0 t10 0 t12 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  goldpan: `
    <ellipse cx="22" cy="28" rx="18" ry="10" fill="#8a8f99"/>
    <ellipse cx="22" cy="26" rx="14" ry="6.5" fill="#6b5f54"/>
    <path d="M38 24 l8 -4" stroke="#6b5f54" stroke-width="3" stroke-linecap="round"/>
    <g fill="#e2b04c" stroke="#b98624" stroke-width="0.8"><circle cx="16" cy="25" r="2.4"/><circle cx="22" cy="27" r="3"/><circle cx="28" cy="25" r="2"/><circle cx="19" cy="29" r="1.6"/></g>
    <path d="M10 10 l1.5 3 3 .4 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.4 z" fill="#ffeec2"/>
    <path d="M36 6 l1 2 2 .3 -1.5 1.4 .4 2 -1.9 -1 -1.9 1 .4 -2 -1.5 -1.4 2 -.3 z" fill="#ffeec2"/>`,
  igloo: `
    <path d="M6 38 a18 18 0 0 1 36 0 z" fill="#f4f7fb" stroke="#9cc6e0" stroke-width="1.5"/>
    <path d="M9 30 h30 M7 36 h34 M12 24 h24 M17 19 h14" stroke="#c6dcef" stroke-width="1.2"/>
    <path d="M15 24 v6 M24 19 v5 M33 24 v6 M20 30 v6 M28 30 v6" stroke="#c6dcef" stroke-width="1.2"/>
    <path d="M19 38 v-5 a5 5 0 0 1 10 0 v5 z" fill="#2b5fa8"/>
    <path d="M24 6 v8 M20 10 h8" stroke="#e2b04c" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M4 40 h40" stroke="#c6dcef" stroke-width="2" stroke-linecap="round"/>`,
  lantern: `
    <path d="M18 12 h12 l-2 -4 h-8 z" fill="#2b241f"/>
    <path d="M24 3 a3 3 0 1 1 0 .1" fill="none" stroke="#2b241f" stroke-width="1.5"/>
    <rect x="15" y="12" width="18" height="24" rx="3" fill="#ffd76a" stroke="#2b241f" stroke-width="2"/>
    <path d="M21 12 v24 M27 12 v24" stroke="#2b241f" stroke-width="1.2"/>
    <path d="M24 20 c2 3 3 5 0 9 c-3 -4 -2 -6 0 -9 z" fill="#ff7a2c"/>
    <rect x="13" y="36" width="22" height="5" rx="2" fill="#2b241f"/>
    <circle cx="24" cy="24" r="16" fill="#ffd76a" opacity="0.18"/>`,
  mountain: `
    <path d="M3 40 L18 14 L26 26 L33 18 L45 40 Z" fill="#6b5f54"/>
    <path d="M18 14 L22 21 L18 24 L14 21 Z" fill="#fbfbf7"/><path d="M33 18 L36 23 L33 25 L30 23 Z" fill="#fbfbf7"/>
    <path d="M3 40 L18 14 L26 26 L21 40 Z" fill="#8a7a6a"/>
    <circle cx="38" cy="9" r="4" fill="#e2b04c"/>`,
  compass: `
    <circle cx="24" cy="24" r="18" fill="#fbfbf7" stroke="#7b4a21" stroke-width="2.5"/>
    <circle cx="24" cy="24" r="13" fill="none" stroke="#e9dcbf" stroke-width="1.5"/>
    <path d="M24 9 L28 24 L24 39 L20 24 Z" fill="#c9553d"/><path d="M24 9 L28 24 L20 24 Z" fill="#c9553d"/><path d="M24 39 L20 24 L28 24 Z" fill="#6b5f54"/>
    <circle cx="24" cy="24" r="2.5" fill="#e2b04c"/>
    <text x="24" y="8" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="7" fill="#2b241f">N</text>`,
  lake: `
    <path d="M4 20 L14 8 L22 18 L30 10 L44 22 Z" fill="#8a7a6a"/>
    <path d="M14 8 L17 12 L14 15 L11 12 Z" fill="#fbfbf7"/><path d="M30 10 L33 14 L30 16 L27 14 Z" fill="#fbfbf7"/>
    <ellipse cx="24" cy="32" rx="20" ry="9" fill="#6fb4ff"/>
    <ellipse cx="24" cy="32" rx="20" ry="9" fill="none" stroke="#2b5fa8" stroke-width="1.5"/>
    <path d="M12 31 q4 -2 8 0 q4 2 8 0 q4 -2 8 0" fill="none" stroke="#dcefff" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M22 15 h4 l-2 -4 z" fill="#2f7a3f"/>`,
  wave: `
    <path d="M4 22 q5 -6 10 0 t10 0 t10 0 t10 0 v22 H4 z" fill="#6fb4ff"/>
    <path d="M4 30 q5 -6 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#dcefff" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 38 q5 -6 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2b5fa8" stroke-width="2" stroke-linecap="round"/>
    <path d="M26 20 L31 9 L37 20 Z" fill="#e4f2fb"/><path d="M31 9 L37 20 L31 20 Z" fill="#c6e1f2"/>
    <path d="M9 20 L13 14 L18 20 Z" fill="#e4f2fb"/>`,
  island: `
    <rect x="4" y="30" width="40" height="12" fill="#6fb4ff"/>
    <path d="M4 32 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#dcefff" stroke-width="1.5"/>
    <path d="M10 32 q14 -16 28 0 z" fill="#f4f7fb"/><path d="M14 31 q10 -8 20 0 z" fill="#dbe4f1"/>
    <rect x="23" y="12" width="2" height="18" fill="#7b4a21"/>
    <path d="M25 12 h10 l-3 4 l3 4 h-10 z" fill="#c9553d"/>
    <path d="M16 26 l3 -6 l3 6 z M28 27 l2.5 -5 l2.5 5 z" fill="#2f7a3f"/>`,
  globe: `
    <circle cx="24" cy="24" r="17" fill="#6fb4ff" stroke="#2b5fa8" stroke-width="2"/>
    <path d="M12 12 q12 -5 24 0 q-12 5 -24 0 z" fill="#f4f7fb"/>
    <path d="M9 19 h30 M8 26 h32 M11 33 h26" stroke="#dcefff" stroke-width="1.2"/>
    <path d="M24 7 v34 M12 11 q12 13 24 0 M12 37 q12 -13 24 0" fill="none" stroke="#dcefff" stroke-width="1.2"/>
    <path d="M9 19 h30" stroke="#c9553d" stroke-width="2.5" stroke-linecap="round"/>
    <text x="24" y="31" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="9" fill="#fbfbf7">80°</text>`,
  comet: `
    <path d="M6 40 L26 18" stroke="#ffeec2" stroke-width="6" stroke-linecap="round"/>
    <path d="M4 32 L20 16 M14 42 L28 28" stroke="#e2b04c" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
    <path d="M32 6 l3.6 7.9 8.6 .9 -6.4 5.9 1.8 8.5 -7.6 -4.3 -7.6 4.3 1.8 -8.5 -6.4 -5.9 8.6 -.9 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.2" stroke-linejoin="round"/>`,
  scales: `
    <rect x="22" y="8" width="4" height="30" rx="1" fill="#7b4a21"/>
    <rect x="12" y="38" width="24" height="4" rx="2" fill="#5a3415"/>
    <path d="M6 14 h36" stroke="#7b4a21" stroke-width="3" stroke-linecap="round"/>
    <path d="M6 14 l-4 12 h14 z" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
    <path d="M42 14 l-4 12 h14 z" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
    <circle cx="24" cy="8" r="3" fill="#e2b04c"/>
    <text x="24" y="31" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="9" fill="#2b241f">÷</text>`,
  train: `
    <rect x="8" y="14" width="26" height="18" rx="4" fill="#c9553d"/>
    <rect x="34" y="20" width="8" height="12" rx="2" fill="#7b4a21"/>
    <rect x="12" y="18" width="7" height="7" rx="1.5" fill="#ffeec2"/>
    <rect x="23" y="18" width="7" height="7" rx="1.5" fill="#ffeec2"/>
    <rect x="30" y="10" width="5" height="8" fill="#2b241f"/>
    <circle cx="14" cy="35" r="4" fill="#2b241f"/><circle cx="27" cy="35" r="4" fill="#2b241f"/><circle cx="38" cy="35" r="3" fill="#2b241f"/>
    <path d="M6 32 h38" stroke="#2b241f" stroke-width="2"/>
    <circle cx="34" cy="6" r="2.5" fill="#c9c6d2"/><circle cx="38" cy="4" r="2" fill="#c9c6d2"/>`,
  icecream: `
    <path d="M24 44 L13 22 h22 Z" fill="#e2b04c"/>
    <path d="M15 26 l18 0 M17 30 l14 0 M19 34 l10 0 M21 38 l6 0" stroke="#b98624" stroke-width="1.5"/>
    <circle cx="18" cy="17" r="7" fill="#f5c6c6"/><circle cx="30" cy="17" r="7" fill="#f6e3c2"/><circle cx="24" cy="11" r="7" fill="#7b4a21"/>
    <circle cx="24" cy="5" r="2.5" fill="#c9553d"/>`,
  potato: `
    <path d="M12 26 c-2 -10 8 -18 18 -14 c8 3 12 12 6 20 c-5 7 -16 8 -21 2 c-2 -2 -3 -5 -3 -8 z" fill="#b98624"/>
    <path d="M12 26 c-2 -10 8 -18 18 -14 c8 3 12 12 6 20 c-5 7 -16 8 -21 2 c-2 -2 -3 -5 -3 -8 z" fill="none" stroke="#7b4a21" stroke-width="1.5"/>
    <circle cx="20" cy="21" r="1.6" fill="#7b4a21"/><circle cx="30" cy="18" r="1.6" fill="#7b4a21"/><circle cx="27" cy="29" r="1.6" fill="#7b4a21"/><circle cx="18" cy="30" r="1.3" fill="#7b4a21"/>
    <path d="M33 10 l4 -6 M36 13 l6 -3" stroke="#2f7a3f" stroke-width="2.5" stroke-linecap="round"/>`,
  pickaxe: `
    <path d="M14 40 L34 14" stroke="#7b4a21" stroke-width="4" stroke-linecap="round"/>
    <path d="M22 10 q12 -4 22 6 q-10 -4 -18 2 q-4 -3 -4 -8 z" fill="#8a8f99"/>
    <circle cx="13" cy="38" r="5" fill="#e2b04c" stroke="#b98624" stroke-width="1.5"/>
    <circle cx="20" cy="42" r="3" fill="#e2b04c" stroke="#b98624" stroke-width="1.2"/>`,
  cowboyhat: `
    <path d="M6 30 q18 10 36 0 q2 6 -18 8 q-20 -2 -18 -8 z" fill="#7b4a21"/>
    <path d="M14 30 q0 -16 10 -18 q10 2 10 18 z" fill="#b98624"/>
    <path d="M14 29 h20" stroke="#c9553d" stroke-width="3"/>
    <path d="M19 14 q5 -6 10 0" stroke="#7b4a21" stroke-width="2" fill="none"/>`,
  star: `
    <path d="M24 5 l5.6 12.4 13.4 1.4 -10 9.2 2.8 13.4 -11.8 -6.8 -11.8 6.8 2.8 -13.4 -10 -9.2 13.4 -1.4 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 12 l3 7 7 1 -5 5" fill="none" stroke="#ffeec2" stroke-width="1.5" stroke-linecap="round"/>`,
  sun: `
    <circle cx="24" cy="24" r="9" fill="#e2b04c"/>
    <g stroke="#e2b04c" stroke-width="3" stroke-linecap="round">
      <path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2"/>
    </g>`,
  moose: `
    <path d="M18 6 q-10 0 -12 10 q6 0 10 -4 q-2 8 4 12" fill="none" stroke="#7b4a21" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M30 6 q10 0 12 10 q-6 0 -10 -4 q2 8 -4 12" fill="none" stroke="#7b4a21" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M17 22 q7 -6 14 0 q4 8 -1 20 h-12 q-5 -12 -1 -20 z" fill="#5a3415"/>
    <ellipse cx="24" cy="37" rx="6" ry="4" fill="#8b5a2b"/>
    <circle cx="20" cy="26" r="1.6" fill="#ffeec2"/><circle cx="28" cy="26" r="1.6" fill="#ffeec2"/>`,
  snowflake: `
    <g stroke="#6fb4ff" stroke-width="2.6" stroke-linecap="round">
      <path d="M24 5v38M7.5 14.5l33 19M7.5 33.5l33-19"/>
      <path d="M24 9l-4 4M24 9l4 4M24 39l-4-4M24 39l4-4M10 17l5-1M10 17l1 5M38 31l-5 1M38 31l-1-5M10 31l5 1M10 31l1-5M38 17l-5-1M38 17l-1 5"/>
    </g>`,
  volcano: `
    <path d="M4 42 L17 14 h14 L44 42 z" fill="#5a4742"/>
    <path d="M17 14 q7 -3 14 0 q-7 3 -14 0 z" fill="#ff7a2c"/>
    <path d="M20 15 l-3 14 l5 -8 z" fill="#ff6a24"/><path d="M28 15 l4 12 l-6 -6 z" fill="#ff8c3a"/>
    <circle cx="22" cy="8" r="3.5" fill="#c9c6d2"/><circle cx="27" cy="5" r="3" fill="#c9c6d2"/>`,
  gift: `
    <rect x="8" y="20" width="32" height="22" rx="3" fill="#c9553d"/>
    <rect x="6" y="14" width="36" height="8" rx="2" fill="#b8462f"/>
    <rect x="21" y="14" width="6" height="28" fill="#e2b04c"/>
    <rect x="6" y="17" width="36" height="3" fill="#e2b04c"/>
    <path d="M24 14 c-8 -2 -10 -8 -5 -9 c4 0 5 5 5 9 c0 -4 1 -9 5 -9 c5 1 3 7 -5 9 z" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>`,
  candycane: `
    <path d="M16 42 V18 a8 8 0 0 1 16 0 v4" fill="none" stroke="#7b2f22" stroke-width="10" stroke-linecap="round"/>
    <path d="M16 42 V18 a8 8 0 0 1 16 0 v4" fill="none" stroke="#fbfbf7" stroke-width="7" stroke-linecap="round"/>
    <path d="M12 28 l8 -3 M12 36 l8 -3 M19 14 l6 6 M29 16 l6 6" stroke="#c9553d" stroke-width="3"/>
    <circle cx="16" cy="6" r="3" fill="#e2b04c"/>`,
  roadsign: `
    <path d="M10 10 h24 l6 7 l-6 7 h-24 z" fill="#2f7a3f" stroke="#1f5a2c" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="21" y="24" width="4" height="20" fill="#7b4a21"/>
    <path d="M14 17 h14" stroke="#ffeec2" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M13 41 q11 4 22 0" fill="none" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>`,
  mapleleaf: `
    <path d="M24 44 V32 M24 32 L11 34 l2 -5 l-8 -6 l4 -2 l-2 -6 l6 2 l2 -3 l5 6 l-2 -11 l4 3 l2 -8 l2 8 l4 -3 l-2 11 l5 -6 l2 3 l6 -2 l-2 6 l4 2 l-8 6 l2 5 z" fill="#c9553d" stroke="#b8462f" stroke-width="1.2" stroke-linejoin="round"/>`,
  team: `
    <circle cx="24" cy="14" r="6" fill="#e2b04c"/><path d="M14 36 c0 -8 20 -8 20 0 v4 h-20 z" fill="#3f9150"/>
    <circle cx="11" cy="18" r="5" fill="#f6d6b8"/><path d="M3 37 c0 -7 16 -7 16 0 v3 h-16 z" fill="#c9553d"/>
    <circle cx="37" cy="18" r="5" fill="#f6d6b8"/><path d="M29 37 c0 -7 16 -7 16 0 v3 h-16 z" fill="#6fb4ff"/>`,
  bigday: `
    <rect x="7" y="10" width="34" height="32" rx="4" fill="#fbfbf7" stroke="#7b4a21" stroke-width="2"/>
    <rect x="7" y="10" width="34" height="9" rx="4" fill="#c9553d"/>
    <path d="M15 7 v6 M33 7 v6" stroke="#2b241f" stroke-width="2.5" stroke-linecap="round"/>
    <text x="24" y="37" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="15" fill="#2b241f">100</text>`,
  boots: `
    <path d="M12 8 h12 v18 h8 q6 0 8 6 v6 h-28 z" fill="#5a3415"/>
    <path d="M12 8 h12 v4 h-12 z" fill="#8b5a2b"/>
    <path d="M12 38 h28" stroke="#2b241f" stroke-width="3" stroke-linecap="round"/>
    <path d="M15 14 l6 2 M15 19 l6 2 M15 24 l6 2" stroke="#e2b04c" stroke-width="1.8" stroke-linecap="round"/>`,
  footprints: `
    <ellipse cx="16" cy="30" rx="6" ry="9" fill="#7b4a21"/>
    <g fill="#7b4a21"><circle cx="10" cy="18" r="2.2"/><circle cx="14.5" cy="16" r="2.2"/><circle cx="19" cy="16.5" r="2"/><circle cx="23" cy="19" r="1.8"/></g>
    <ellipse cx="33" cy="22" rx="5" ry="8" fill="#b98624"/>
    <g fill="#b98624"><circle cx="28" cy="11" r="2"/><circle cx="32" cy="9.5" r="2"/><circle cx="36" cy="10" r="1.8"/><circle cx="39.5" cy="12.5" r="1.6"/></g>`,
  medal: `
    <path d="M17 4 h6 l4 14 h-6 z" fill="#c9553d"/><path d="M25 4 h6 l-4 14 h-6 z" fill="#3f9150"/>
    <circle cx="24" cy="30" r="12" fill="#e2b04c" stroke="#b98624" stroke-width="2"/>
    <circle cx="24" cy="30" r="8" fill="none" stroke="#b98624" stroke-width="1.2"/>
    <text x="24" y="34" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="11" fill="#5a3415">100</text>`,
  backpack: `
    <rect x="11" y="12" width="26" height="30" rx="7" fill="#8b5a2b"/>
    <rect x="15" y="26" width="18" height="12" rx="3" fill="#6b4320"/>
    <rect x="17" y="6" width="14" height="8" rx="4" fill="#c9553d"/>
    <path d="M17 12 v30 M31 12 v30" stroke="#5a3415" stroke-width="2"/>
    <rect x="21" y="18" width="6" height="4" rx="1" fill="#e2b04c"/>`,
  crown: `
    <path d="M8 36 L6 14 l10 8 l8 -14 l8 14 l10 -8 l-2 22 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.5" stroke-linejoin="round"/>
    <rect x="8" y="34" width="32" height="6" fill="#c9553d"/>
    <circle cx="6" cy="13" r="2.5" fill="#c9553d"/><circle cx="24" cy="7" r="2.5" fill="#6fe3b4"/><circle cx="42" cy="13" r="2.5" fill="#c9553d"/>
    <circle cx="16" cy="28" r="2" fill="#6fb4ff"/><circle cx="24" cy="27" r="2.2" fill="#c9553d"/><circle cx="32" cy="28" r="2" fill="#6fb4ff"/>`,
  flame: `
    <path d="M24 4 c2 8 10 10 10 22 a10 10 0 0 1 -20 0 c0 -6 3 -8 4 -12 c2 3 3 4 4 6 c1 -5 -1 -10 2 -16 z" fill="#ff7a2c"/>
    <path d="M24 20 c1 5 5 6 5 11 a5 5 0 0 1 -10 0 c0 -3 2 -5 2 -7 c1 1 2 2 2 3 c0 -3 0 -5 1 -7 z" fill="#ffd54a"/>`,
  bolt: `
    <path d="M28 4 L12 27 h10 l-4 17 l18 -24 h-10 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.5" stroke-linejoin="round"/>`,
  trophy: `
    <path d="M14 6 h20 v12 a10 10 0 0 1 -20 0 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.5"/>
    <path d="M14 9 h-6 v5 a6 6 0 0 0 6 6 M34 9 h6 v5 a6 6 0 0 1 -6 6" fill="none" stroke="#b98624" stroke-width="2.5"/>
    <rect x="21" y="27" width="6" height="7" fill="#b98624"/>
    <rect x="14" y="34" width="20" height="6" rx="2" fill="#7b4a21"/>
    <path d="M24 10 l1.6 3.6 3.9 .4 -2.9 2.7 .8 3.8 -3.4 -2 -3.4 2 .8 -3.8 -2.9 -2.7 3.9 -.4 z" fill="#fbfbf7"/>`,
  sunrise: `
    <path d="M6 34 h36" stroke="#2b241f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M12 34 a12 12 0 0 1 24 0 z" fill="#e2b04c"/>
    <g stroke="#e2b04c" stroke-width="2.5" stroke-linecap="round"><path d="M24 10v5M11 15l3.5 3.5M37 15l-3.5 3.5M6 26h5M37 26h5"/></g>
    <path d="M10 42 q7 -4 14 0 q7 4 14 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  moon: `
    <path d="M30 6 a16 16 0 1 0 12 26 a13 13 0 0 1 -12 -26 z" fill="#ffeec2" stroke="#e2b04c" stroke-width="1.5"/>
    <circle cx="10" cy="12" r="1.5" fill="#ffeec2"/><circle cx="16" cy="6" r="1.2" fill="#ffeec2"/><circle cx="8" cy="24" r="1.2" fill="#ffeec2"/>
    <circle cx="19" cy="40" r="4" fill="#7b4a21"/><circle cx="17.5" cy="39" r="1" fill="#ffeec2"/><circle cx="20.5" cy="39" r="1" fill="#ffeec2"/>`,
  calendar: `
    <rect x="7" y="10" width="34" height="32" rx="4" fill="#fbfbf7" stroke="#7b4a21" stroke-width="2"/>
    <rect x="7" y="10" width="34" height="9" rx="4" fill="#3f9150"/>
    <path d="M15 7 v6 M33 7 v6" stroke="#2b241f" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="12" y="24" width="10" height="12" rx="2" fill="#e2b04c"/><rect x="26" y="24" width="10" height="12" rx="2" fill="#c9553d"/>
    <text x="17" y="33" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="8" fill="#2b241f">Sa</text>
    <text x="31" y="33" text-anchor="middle" font-family="Nunito, sans-serif" font-weight="700" font-size="8" fill="#fbfbf7">Su</text>`,
  ribbon: `
    <path d="M17 26 l-6 18 l8 -4 l5 6 l3 -14 z" fill="#c9553d"/><path d="M31 26 l6 18 l-8 -4 l-5 6 l-3 -14 z" fill="#b8462f"/>
    <circle cx="24" cy="18" r="13" fill="#6fb4ff" stroke="#2b5fa8" stroke-width="2"/>
    <circle cx="24" cy="18" r="9" fill="#fbfbf7"/>
    <text x="24" y="21.5" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="9" fill="#2b241f">26.2</text>`,
  checks: `
    <rect x="7" y="8" width="34" height="34" rx="4" fill="#fbfbf7" stroke="#7b4a21" stroke-width="2"/>
    <path d="M7 17 h34 M24 17 v25 M7 29.5 h34" stroke="#e9dcbf" stroke-width="1.5"/>
    <g fill="none" stroke="#3f9150" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 23 l3 3 l5 -5 M28 23 l3 3 l5 -5 M11 36 l3 3 l5 -5 M28 36 l3 3 l5 -5"/>
    </g>`,
  scarecrow: `
    <rect x="23" y="20" width="2" height="24" fill="#7b4a21"/>
    <path d="M8 24 h32" stroke="#7b4a21" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M14 22 h20 l-2 14 h-16 z" fill="#2b5fa8"/>
    <path d="M14 22 v-3 M34 22 v-3 M22 36 l-2 6 M26 36 l2 6" stroke="#e2b04c" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="24" cy="15" r="6" fill="#ffeec2"/>
    <circle cx="22" cy="14.5" r="1" fill="#2b241f"/><circle cx="26" cy="14.5" r="1" fill="#2b241f"/>
    <path d="M13 11 h22" stroke="#b98624" stroke-width="3" stroke-linecap="round"/>
    <path d="M18 11 l1 -6 h10 l1 6 z" fill="#e2b04c"/>`,
  oilcan: `
    <path d="M10 40 h18 v-12 h-18 z" fill="#8a8f99"/>
    <path d="M10 28 l9 -8 l9 8 z" fill="#6b5f54"/>
    <path d="M19 20 L40 6" stroke="#8a8f99" stroke-width="3" stroke-linecap="round"/>
    <circle cx="19" cy="20" r="3" fill="#6b5f54"/>
    <path d="M28 32 q8 0 8 -6" fill="none" stroke="#8a8f99" stroke-width="3" stroke-linecap="round"/>
    <path d="M42 8 c1 2 2 3.5 0 5 c-2 -1.5 -1 -3 0 -5 z" fill="#e2b04c"/>
    <path d="M12 38 h14" stroke="#6b5f54" stroke-width="1.2" stroke-linecap="round"/>`,
  lion: `
    <circle cx="24" cy="24" r="19" fill="#b98624"/>
    <circle cx="14" cy="13" r="3.5" fill="#e2b04c"/><circle cx="34" cy="13" r="3.5" fill="#e2b04c"/>
    <circle cx="24" cy="25" r="12" fill="#e2b04c"/>
    <circle cx="19.5" cy="23" r="1.6" fill="#2b241f"/><circle cx="28.5" cy="23" r="1.6" fill="#2b241f"/>
    <path d="M21 29 h6 l-3 3 z" fill="#5a3415"/>
    <path d="M24 32 v3 M24 35 q-3 3 -6 0 M24 35 q3 3 6 0" fill="none" stroke="#5a3415" stroke-width="1.5" stroke-linecap="round"/>`,
  bridge: `
    <path d="M4 44 v-16 h8 v16 z M36 44 v-16 h8 v16 z" fill="#6b5f54"/>
    <path d="M14 43 q10 -4 20 0" fill="none" stroke="#6fb4ff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 18 h40 v12 h-4 a16 10 0 0 0 -32 0 h-4 z" fill="#8a7a6a" stroke="#6b5f54" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M4 22 h40 M10 26 h6 M32 26 h6" stroke="#6b5f54" stroke-width="1"/>
    <rect x="4" y="14" width="40" height="4" fill="#6b5f54"/>`,
  stork: `
    <path d="M4 16 q8 -8 18 6 l4 0 q10 -14 18 -6 q-6 2 -14 12 h-12 q-8 -10 -14 -12 z" fill="#fbfbf7" stroke="#9aa4ad" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M4 16 q2 4 7 6 M44 16 q-2 4 -7 6" stroke="#2b241f" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="24" cy="25" rx="8" ry="4" fill="#fbfbf7" stroke="#9aa4ad" stroke-width="1.2"/>
    <path d="M30 25 q6 -2 8 -6" fill="none" stroke="#fbfbf7" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="38" cy="18" r="3" fill="#fbfbf7" stroke="#9aa4ad" stroke-width="1"/>
    <path d="M40 18 l6 1" stroke="#c9553d" stroke-width="2" stroke-linecap="round"/>
    <circle cx="38.5" cy="17.5" r="0.8" fill="#2b241f"/>
    <path d="M18 27 l-8 6 M20 28 l-7 7" stroke="#c9553d" stroke-width="1.5" stroke-linecap="round"/>`,
  poppy: `
    <path d="M24 28 v16" stroke="#2f7a3f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 38 q-6 -2 -8 -8" fill="none" stroke="#2f7a3f" stroke-width="2" stroke-linecap="round"/>
    <circle cx="16" cy="16" r="9" fill="#c9553d"/><circle cx="32" cy="16" r="9" fill="#c9553d"/>
    <circle cx="16" cy="26" r="8" fill="#b8462f"/><circle cx="32" cy="26" r="8" fill="#b8462f"/>
    <circle cx="24" cy="21" r="5" fill="#2b241f"/>
    <circle cx="24" cy="21" r="2" fill="#6b5f54"/>`,
  mouse: `
    <path d="M10 42 q-8 -2 -4 -10" fill="none" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>
    <circle cx="26" cy="18" r="5" fill="#6b5f54"/><circle cx="26" cy="18" r="2.5" fill="#f6d6b8"/>
    <circle cx="36" cy="22" r="4.5" fill="#6b5f54"/><circle cx="36" cy="22" r="2.2" fill="#f6d6b8"/>
    <path d="M8 32 q4 -14 20 -12 q12 2 16 12 q-4 6 -14 6 h-16 q-6 0 -6 -6 z" fill="#6b5f54"/>
    <circle cx="37" cy="29" r="1.3" fill="#2b241f"/>
    <circle cx="44" cy="32" r="1.8" fill="#c9553d"/>
    <path d="M40 33 l-6 2 M40 34 l-5 4" stroke="#2b241f" stroke-width="0.8" stroke-linecap="round"/>`,
  spectacles: `
    <circle cx="14" cy="24" r="9" fill="#6fe3b4" stroke="#e2b04c" stroke-width="2.5"/>
    <circle cx="34" cy="24" r="9" fill="#6fe3b4" stroke="#e2b04c" stroke-width="2.5"/>
    <path d="M23 23 q1 -4 2 0" fill="none" stroke="#e2b04c" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M5 24 l-2 -4 M43 24 l2 -4" stroke="#e2b04c" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M10 20 q2 -3 5 -3 M30 20 q2 -3 5 -3" fill="none" stroke="#fbfbf7" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>`,
  emerald: `
    <path d="M12 10 h24 l8 10 l-20 20 l-20 -20 z" fill="#3f9150" stroke="#2f7a3f" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M12 10 l6 10 h12 l6 -10 M4 20 h40 M18 20 l6 20 l6 -20" fill="none" stroke="#6fe3b4" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M14 12 l4 6" stroke="#fbfbf7" stroke-width="2" stroke-linecap="round" opacity="0.8"/>`,
  chimney: `
    <path d="M34 6 a8 8 0 1 0 6 13 a6.5 6.5 0 0 1 -6 -13 z" fill="#ffeec2"/>
    <circle cx="26" cy="10" r="1.2" fill="#ffeec2"/><circle cx="44" cy="20" r="1" fill="#ffeec2"/>
    <path d="M4 44 v-14 l10 -10 l10 10 v14 z" fill="#5a3415"/>
    <path d="M24 44 v-12 l8 -8 l12 8 v12 z" fill="#7b4a21"/>
    <rect x="8" y="14" width="5" height="9" fill="#b8462f"/>
    <rect x="7" y="13" width="7" height="2" fill="#c9553d"/>
    <circle cx="10" cy="9" r="2.5" fill="#c9c6d2"/><circle cx="13" cy="5" r="2" fill="#c9c6d2"/>`,
  cloud: `
    <path d="M38 5 l2.2 4.8 5.2 .6 -3.9 3.6 1.1 5.1 -4.6 -2.7 -4.6 2.7 1.1 -5.1 -3.9 -3.6 5.2 -.6 z" fill="#e2b04c" stroke="#b98624" stroke-width="1" stroke-linejoin="round"/>
    <circle cx="28" cy="8" r="1.2" fill="#ffeec2"/><circle cx="10" cy="12" r="1.2" fill="#ffeec2"/>
    <path d="M10 40 a7 7 0 0 1 1 -14 a9 9 0 0 1 17 -4 a7 7 0 0 1 9 8 a6 6 0 0 1 -1 10 z" fill="#fbfbf7" stroke="#9cc6e0" stroke-width="1.5" stroke-linejoin="round"/>`,
  spyglass: `
    <g transform="rotate(-40 24 24)">
      <rect x="4" y="19" width="16" height="10" rx="2" fill="#5a3415"/>
      <rect x="19" y="20" width="12" height="8" fill="#b98624"/>
      <rect x="30" y="21" width="12" height="6" fill="#e2b04c"/>
      <rect x="2" y="18" width="4" height="12" rx="1" fill="#2b241f"/>
      <rect x="41" y="20.5" width="3" height="7" rx="1" fill="#2b241f"/>
    </g>
    <path d="M40 6 l1 2 2 .3 -1.5 1.4 .4 2 -1.9 -1 -1.9 1 .4 -2 -1.5 -1.4 2 -.3 z" fill="#ffeec2"/>`,
  shell: `
    <path d="M24 42 L6 22 a18 16 0 0 1 36 0 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 42 L9 16 M24 42 L16 8 M24 42 V6 M24 42 L32 8 M24 42 L39 16" stroke="#b98624" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M20 44 h8" stroke="#7b4a21" stroke-width="3" stroke-linecap="round"/>`,
  rock: `
    <path d="M14 36 l4 -18 l8 -8 l10 10 l2 16 z" fill="#6b5f54"/>
    <path d="M18 18 l8 -8 l10 10 l-6 2 z" fill="#8a7a6a"/>
    <path d="M4 38 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 43 q5 -4 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2b5fa8" stroke-width="2" stroke-linecap="round"/>
    <circle cx="12" cy="33" r="1.8" fill="#fbfbf7"/><circle cx="38" cy="34" r="1.5" fill="#fbfbf7"/>`,
  tree: `
    <path d="M17 44 v-16 h14 v16 z" fill="#7b4a21"/>
    <circle cx="24" cy="18" r="14" fill="#2f7a3f"/>
    <circle cx="13" cy="22" r="8" fill="#3f9150"/><circle cx="35" cy="22" r="8" fill="#3f9150"/>
    <path d="M20 44 v-6 a4 4 0 0 1 8 0 v6 z" fill="#2b241f"/>
    <circle cx="26.5" cy="39" r="0.9" fill="#e2b04c"/>
    <path d="M4 44 h40" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>`,
  feather: `
    <path d="M10 40 C8 24 20 8 38 6 C40 22 28 36 10 40 z" fill="#ffeec2" stroke="#b98624" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M6 44 C12 34 24 20 38 6" fill="none" stroke="#b98624" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M18 30 l-2 -6 M22 26 l-1 -7 M27 21 v-7 M32 16 l2 -6" stroke="#b98624" stroke-width="1" stroke-linecap="round" opacity="0.6"/>`,
  ship: `
    <path d="M6 30 h36 l-5 8 h-26 z" fill="#7b4a21"/>
    <path d="M6 30 h36" stroke="#e2b04c" stroke-width="1.5"/>
    <rect x="23" y="4" width="2" height="26" fill="#5a3415"/>
    <path d="M25 10 q12 4 12 14 h-12 z" fill="#fbfbf7" stroke="#9aa4ad" stroke-width="1"/>
    <path d="M23 12 q-10 4 -10 12 h10 z" fill="#fbfbf7" stroke="#9aa4ad" stroke-width="1"/>
    <path d="M25 4 h10 l-3 3 l3 3 h-10 z" fill="#2b241f"/>
    <path d="M4 42 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  secondstar: `
    <circle cx="33" cy="17" r="13" fill="#e2b04c" opacity="0.18"/>
    <path d="M4 44 q6 -18 24 -20" fill="none" stroke="#ffeec2" stroke-width="3" stroke-linecap="round" opacity="0.8"/>
    <path d="M11 14 l2 4.4 4.8 .5 -3.6 3.3 1 4.7 -4.2 -2.5 -4.2 2.5 1 -4.7 -3.6 -3.3 4.8 -.5 z" fill="#c9c6d2"/>
    <path d="M33 6 l3.6 7.9 8.6 .9 -6.4 5.9 1.8 8.5 -7.6 -4.3 -7.6 4.3 1.8 -8.5 -6.4 -5.9 8.6 -.9 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.2" stroke-linejoin="round"/>`,
  sword: `
    <path d="M24 2 l4 6 v22 h-8 V8 z" fill="#8a8f99" stroke="#6b5f54" stroke-width="1"/>
    <path d="M24 8 v20" stroke="#fbfbf7" stroke-width="1.2"/>
    <rect x="12" y="29" width="24" height="4" rx="2" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
    <rect x="21.5" y="33" width="5" height="7" fill="#5a3415"/>
    <circle cx="24" cy="42" r="3" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>`,
  owl: `
    <path d="M4 42 q20 -4 40 0" fill="none" stroke="#7b4a21" stroke-width="3" stroke-linecap="round"/>
    <path d="M12 19 l3 -8 l5 5 h8 l5 -5 l3 8 v10 a12 12 0 0 1 -24 0 z" fill="#8b5a2b"/>
    <circle cx="18.5" cy="19" r="5" fill="#ffeec2"/><circle cx="29.5" cy="19" r="5" fill="#ffeec2"/>
    <circle cx="18.5" cy="19" r="2.2" fill="#2b241f"/><circle cx="29.5" cy="19" r="2.2" fill="#2b241f"/>
    <path d="M24 22 l-2.5 3 h5 z" fill="#e2b04c"/>
    <path d="M18 28 q3 3 6 0 q3 3 6 0 M19 32 q2.5 3 5 0 q2.5 3 5 0" fill="none" stroke="#5a3415" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M19 39 v3 M29 39 v3" stroke="#e2b04c" stroke-width="2" stroke-linecap="round"/>`,
  armsword: `
    <path d="M24 2 l3 5 v17 h-6 V7 z" fill="#8a8f99" stroke="#6b5f54" stroke-width="1"/>
    <rect x="15" y="24" width="18" height="3.5" rx="1.5" fill="#e2b04c" stroke="#b98624" stroke-width="0.8"/>
    <rect x="22.5" y="27" width="3" height="4" fill="#5a3415"/>
    <rect x="18" y="29" width="12" height="9" rx="4" fill="#f6d6b8"/>
    <rect x="19" y="36" width="10" height="8" fill="#f6d6b8"/>
    <rect x="17" y="37" width="14" height="4" fill="#c9c6d2"/>
    <path d="M4 40 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2b5fa8" stroke-width="2" stroke-linecap="round"/>`,
  holly: `
    <path d="M23 27 L15 30 L14 26 L7 26 L8 20 L4 15 L10 13 L13 9 L18 13 z" fill="#2f7a3f" stroke="#1f5a2c" stroke-width="1" stroke-linejoin="round"/>
    <path d="M25 27 L33 30 L34 26 L41 26 L40 20 L44 15 L38 13 L35 9 L30 13 z" fill="#3f9150" stroke="#1f5a2c" stroke-width="1" stroke-linejoin="round"/>
    <path d="M23 27 L8 17 M25 27 L40 17" stroke="#1f5a2c" stroke-width="1" stroke-linecap="round"/>
    <circle cx="24" cy="31" r="4" fill="#c9553d"/><circle cx="18" cy="35" r="3.5" fill="#b8462f"/><circle cx="30" cy="35" r="3.5" fill="#b8462f"/>`,
  grail: `
    <g stroke="#ffeec2" stroke-width="2" stroke-linecap="round"><path d="M24 2v5M10 7l3 4M38 7l-3 4M4 18h5M39 18h5"/></g>
    <path d="M12 12 h24 v6 a12 12 0 0 1 -24 0 z" fill="#e2b04c" stroke="#b98624" stroke-width="1.5"/>
    <circle cx="24" cy="18" r="2" fill="#c9553d"/>
    <path d="M24 30 v9" stroke="#b98624" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="24" cy="41" rx="10" ry="3" fill="#e2b04c" stroke="#b98624" stroke-width="1.5"/>`,
  apple: `
    <path d="M4 6 q12 0 24 8" fill="none" stroke="#7b4a21" stroke-width="3" stroke-linecap="round"/>
    <path d="M24 22 q0 -6 3 -9" fill="none" stroke="#5a3415" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 15 q4 -9 12 -7 q-3 9 -12 7 z" fill="#3f9150"/>
    <path d="M24 22 c-3 -4 -14 -4 -14 8 c0 8 6 14 10 14 c2 0 3 -1 4 -1 c1 0 2 1 4 1 c4 0 10 -6 10 -14 c0 -12 -11 -12 -14 -8 z" fill="#c9553d"/>
    <path d="M16 30 q0 -4 3 -6" fill="none" stroke="#ffeec2" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>`,
  roundtable: `
    <g fill="#5a3415"><circle cx="42" cy="24" r="3.5"/><circle cx="33" cy="8.4" r="3.5"/><circle cx="15" cy="8.4" r="3.5"/><circle cx="6" cy="24" r="3.5"/><circle cx="15" cy="39.6" r="3.5"/><circle cx="33" cy="39.6" r="3.5"/></g>
    <circle cx="24" cy="24" r="13" fill="#8b5a2b" stroke="#5a3415" stroke-width="2"/>
    <circle cx="24" cy="24" r="8" fill="none" stroke="#5a3415" stroke-width="1.2"/>
    <circle cx="24" cy="24" r="3" fill="#e2b04c"/>`,
  castle: `
    <rect x="23" y="2" width="2" height="20" fill="#5a3415"/>
    <path d="M25 3 h9 l-3 3 l3 3 h-9 z" fill="#c9553d"/>
    <rect x="14" y="22" width="20" height="20" fill="#8a7a6a"/>
    <path d="M14 22 v-3 h4 v2 h4 v-2 h4 v2 h4 v-2 h4 v3 z" fill="#8a7a6a"/>
    <rect x="6" y="14" width="10" height="28" fill="#6b5f54"/><rect x="32" y="14" width="10" height="28" fill="#6b5f54"/>
    <path d="M6 14 v-4 h3 v3 h4 v-3 h3 v4 z M32 14 v-4 h3 v3 h4 v-3 h3 v4 z" fill="#6b5f54"/>
    <path d="M20 42 v-8 a4 4 0 0 1 8 0 v8 z" fill="#2b241f"/>
    <g fill="#2b241f"><rect x="9" y="22" width="4" height="6" rx="2"/><rect x="35" y="22" width="4" height="6" rx="2"/></g>
    <path d="M4 42 h40" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>`,
  seaweed: `
    <path d="M4 36 q5 -4 10 0 t10 0 t10 0 t10 0 v8 H4 z" fill="#6fb4ff"/>
    <path d="M6 34 q6 -14 14 -4 q4 -12 10 -2 q6 -12 12 2 q-4 6 -8 4 q-8 6 -14 0 q-8 6 -14 0 z" fill="#b98624"/>
    <path d="M8 32 q8 -8 14 -2 M22 30 q6 -8 14 -2 M20 28 q-2 -10 4 -14 M30 26 q0 -8 6 -10" fill="none" stroke="#8b5a2b" stroke-width="1.5" stroke-linecap="round"/>
    <g fill="#e2b04c" stroke="#8b5a2b" stroke-width="0.8"><circle cx="14" cy="26" r="2.2"/><circle cx="26" cy="22" r="2.2"/><circle cx="36" cy="28" r="2.2"/><circle cx="21" cy="31" r="1.8"/></g>
    <path d="M4 42 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2b5fa8" stroke-width="1.8" stroke-linecap="round"/>`,
  anchor: `
    <circle cx="24" cy="8" r="4" fill="none" stroke="#2b5fa8" stroke-width="3"/>
    <path d="M24 12 v28" stroke="#2b5fa8" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M14 18 h20" stroke="#2b5fa8" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M8 30 a16 12 0 0 0 32 0" fill="none" stroke="#2b5fa8" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M8 30 l-4 -5 l9 1 z M40 30 l4 -5 l-9 1 z" fill="#2b5fa8"/>`,
  dolphin: `
    <path d="M9 35 l-6 -4 l1 7 z M9 35 l-2 8 l6 -3 z" fill="#2b5fa8"/>
    <path d="M8 36 q6 -24 30 -16" fill="none" stroke="#2b5fa8" stroke-width="9" stroke-linecap="round"/>
    <path d="M15 17 l4 -8 l4 7 z" fill="#2b5fa8"/>
    <path d="M28 26 l-2 7 l7 -4 z" fill="#2b5fa8"/>
    <path d="M38 20 l7 3" stroke="#2b5fa8" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 36 q6 -16 24 -14" fill="none" stroke="#dcefff" stroke-width="2.5" stroke-linecap="round" opacity="0.7"/>
    <circle cx="37" cy="18" r="1.3" fill="#fbfbf7"/>
    <path d="M4 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  coral: `
    <ellipse cx="24" cy="43" rx="18" ry="3" fill="#e9dcbf"/>
    <path d="M24 42 V22 M24 30 q-8 -2 -10 -12 M24 26 q8 -2 10 -12" fill="none" stroke="#c9553d" stroke-width="4" stroke-linecap="round"/>
    <path d="M14 18 q-4 -2 -6 -8 M14 18 q2 -6 8 -8 M34 14 q4 -2 6 -8 M34 14 q-2 -6 -6 -8 M24 22 q0 -8 -2 -12" fill="none" stroke="#c9553d" stroke-width="3" stroke-linecap="round"/>
    <circle cx="10" cy="30" r="1.5" fill="#dcefff"/><circle cx="40" cy="26" r="1.2" fill="#dcefff"/><circle cx="38" cy="34" r="1.8" fill="#dcefff"/>`,
  column: `
    <rect x="8" y="38" width="32" height="5" rx="1" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1.2"/>
    <rect x="12" y="33" width="24" height="5" rx="1" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1.2"/>
    <path d="M16 33 V14 l4 -4 l4 5 l4 -7 l4 4 l2 -3 V33 z" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M20 31 V13 M24 31 V18 M28 31 V11 M32 31 V15" stroke="#6b5f54" stroke-width="1" stroke-linecap="round" opacity="0.6"/>
    <path d="M4 38 l2 -5 M7 38 l1 -4 M41 38 l2 -4 M44 38 l1 -5" stroke="#3f9150" stroke-width="1.5" stroke-linecap="round"/>`,
  rings: `
    <circle cx="24" cy="24" r="21" fill="#6fb4ff"/>
    <circle cx="24" cy="24" r="17" fill="#2f7a3f" stroke="#2b5fa8" stroke-width="1"/>
    <circle cx="24" cy="24" r="13" fill="#6fb4ff"/>
    <circle cx="24" cy="24" r="9" fill="#2f7a3f" stroke="#2b5fa8" stroke-width="1"/>
    <circle cx="24" cy="24" r="5" fill="#6fb4ff"/>
    <path d="M24 24 V45" stroke="#6fb4ff" stroke-width="3"/>
    <circle cx="24" cy="24" r="2.5" fill="#e2b04c"/>`,
  trident: `
    <path d="M24 42 V6" stroke="#e2b04c" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M12 12 v6 q0 6 12 6 q12 0 12 -6 v-6" fill="none" stroke="#e2b04c" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M12 13 l-3 -2 l3 -8 l3 8 z M36 13 l-3 -2 l3 -8 l3 8 z M24 8 l-3 -1 l3 -6 l3 6 z" fill="#b98624"/>
    <path d="M19 32 h10" stroke="#b98624" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round"/>`,
  pearl: `
    <path d="M7 29 q0 -24 17 -25 q17 1 17 25 z" fill="#c9c6d2" stroke="#8a7a6a" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M24 29 L12 10 M24 29 V5 M24 29 L36 10" stroke="#fbfbf7" stroke-width="1.2" stroke-linecap="round" opacity="0.8"/>
    <circle cx="24" cy="24" r="7" fill="#e9dcbf" stroke="#c9c6d2" stroke-width="1"/>
    <circle cx="21.5" cy="21.5" r="2.5" fill="#fbfbf7"/>
    <path d="M6 29 a18 10 0 0 0 36 0 z" fill="#8a7a6a" stroke="#6b5f54" stroke-width="1.5"/>
    <path d="M12 36 l-2 -6 M24 39 V30 M36 36 l2 -6 M18 38.5 l-1 -8 M30 38.5 l1 -8" stroke="#6b5f54" stroke-width="1" stroke-linecap="round"/>`,
  thorn: `
    <path d="M4 38 q10 -2 16 -12 q6 -10 24 -14" fill="none" stroke="#5a3415" stroke-width="3" stroke-linecap="round"/>
    <path d="M7 37 l2 -6 l2 5 z M11 33 l2 6 l3 -4 z M15 31 l-2 -6 l5 3 z M22 21 l4 6 l1 -6 z M27 18 l1 -7 l3 5 z M39 13 l2 -7 l2 5 z" fill="#5a3415"/>
    <path d="M36 15 q0 8 8 8 q0 -7 -8 -8 z" fill="#2f7a3f"/>
    <circle cx="19" cy="24" r="2.2" fill="#2b241f"/><circle cx="22" cy="26.5" r="2" fill="#2b241f"/>`,
  wisp: `
    <circle cx="24" cy="17" r="14" fill="#6fe3b4" opacity="0.2"/>
    <path d="M4 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#2b5fa8" stroke-width="2" stroke-linecap="round"/>
    <path d="M8 42 V30 M12 42 V29 M16 42 V33 M34 42 V34 M38 42 V31 M42 42 V32" stroke="#2f7a3f" stroke-width="2" stroke-linecap="round"/>
    <path d="M12 29 v-4 M38 31 v-4" stroke="#5a3415" stroke-width="3.5" stroke-linecap="round"/>
    <path d="M24 6 c2 6 8 8 8 15 a8 8 0 0 1 -16 0 c0 -5 3 -7 4 -10 c1 2 2 3 3 4 c0 -4 -1 -6 1 -9 z" fill="#6fe3b4"/>
    <path d="M24 16 c1 3 4 4 4 7 a4 4 0 0 1 -8 0 c0 -2 2 -3 2 -5 c1 1 1 1 2 -2 z" fill="#fbfbf7"/>`,
  thistle: `
    <path d="M24 44 V30" stroke="#2f7a3f" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 40 l-8 -4 l2 -2 l-4 -3 M24 40 l8 -4 l-2 -2 l4 -3" fill="none" stroke="#2f7a3f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M16 20 l-4 -12 l6 6 l2 -10 l4 8 l4 -8 l2 10 l6 -6 l-4 12 z" fill="#a08fc9"/>
    <path d="M15 8 l2 7 M24 4 v8 M33 8 l-2 7" stroke="#c9c6d2" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M15 22 q1 -4 9 -4 q8 0 9 4 q-1 8 -9 10 q-8 -2 -9 -10 z" fill="#3f9150"/>
    <path d="M17 22 l2 4 M31 22 l-2 4 M24 19 v4 M20 20 l1 4 M28 20 l-1 4" stroke="#2f7a3f" stroke-width="1" stroke-linecap="round"/>`,
  gate: `
    <path d="M6 44 V16 a18 18 0 0 1 36 0 V44 z" fill="#2b241f"/>
    <path d="M10 12 h4 M34 12 h4 M8 24 h4 M36 24 h4 M8 34 h4 M36 34 h4 M20 6 h8" stroke="#6b5f54" stroke-width="1" stroke-linecap="round"/>
    <path d="M13 44 V20 a11 11 0 0 1 22 0 V44 z" fill="#dcefff"/>
    <path d="M13 44 h22 v-4 q-11 -2 -22 0 z" fill="#3f9150"/>
    <path d="M13 44 V20 l5 3 V44 z M35 44 V20 l-5 3 V44 z" fill="#7b4a21"/>
    <path d="M21 44 q3 -5 6 0" fill="none" stroke="#e2b04c" stroke-width="2" stroke-linecap="round"/>`,
  bull: `
    <path d="M14 22 q-12 -2 -10 -16 q2 8 10 10 z" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1" stroke-linejoin="round"/>
    <path d="M34 22 q12 -2 10 -16 q-2 8 -10 10 z" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1" stroke-linejoin="round"/>
    <path d="M14 14 q10 -6 20 0 q4 8 2 18 q-4 10 -12 10 q-8 0 -12 -10 q-2 -10 2 -18 z" fill="#5a3415"/>
    <ellipse cx="24" cy="34" rx="8" ry="5" fill="#8b5a2b"/>
    <circle cx="21" cy="34" r="1.3" fill="#2b241f"/><circle cx="27" cy="34" r="1.3" fill="#2b241f"/>
    <path d="M21 39 a3 3 0 0 0 6 0" fill="none" stroke="#e2b04c" stroke-width="1.8"/>
    <circle cx="18" cy="23" r="1.8" fill="#ffeec2"/><circle cx="30" cy="23" r="1.8" fill="#ffeec2"/>`,
  grapes: `
    <path d="M24 4 v8" stroke="#5a3415" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M24 10 q-14 -8 -18 2 q8 6 18 -2 z" fill="#3f9150"/>
    <g fill="#b8462f" stroke="#7b2f22" stroke-width="0.8">
      <circle cx="15" cy="17" r="5.5"/><circle cx="24" cy="17" r="5.5"/><circle cx="33" cy="17" r="5.5"/>
      <circle cx="19.5" cy="25" r="5.5"/><circle cx="28.5" cy="25" r="5.5"/>
      <circle cx="24" cy="33" r="5.5"/>
    </g>
    <g fill="#ffeec2" opacity="0.7"><circle cx="13" cy="15" r="1.3"/><circle cx="22" cy="15" r="1.3"/><circle cx="17.5" cy="23" r="1.3"/><circle cx="22" cy="31" r="1.3"/></g>`,
  cathedral: `
    <rect x="6" y="14" width="10" height="30" fill="#8a7a6a"/><rect x="32" y="14" width="10" height="30" fill="#8a7a6a"/>
    <path d="M6 14 l5 -9 l5 9 z M32 14 l5 -9 l5 9 z" fill="#6b5f54"/>
    <rect x="16" y="20" width="16" height="24" fill="#e9dcbf"/>
    <path d="M16 20 l8 -6 l8 6 z" fill="#6b5f54"/>
    <circle cx="24" cy="26" r="4" fill="#6fb4ff" stroke="#6b5f54" stroke-width="1.2"/>
    <path d="M20 26 h8 M24 22 v8" stroke="#e9dcbf" stroke-width="1"/>
    <path d="M20 44 v-7 a4 4 0 0 1 8 0 v7 z" fill="#5a3415"/>
    <g fill="#2b241f"><rect x="9.5" y="22" width="3" height="7" rx="1.5"/><rect x="35.5" y="22" width="3" height="7" rx="1.5"/></g>
    <path d="M4 44 h40" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>`,
  stainedglass: `
    <path d="M10 42 V22 q0 -14 14 -18 q14 4 14 18 V42 z" fill="#2b241f"/>
    <path d="M13 42 V23 q0 -11 11 -15 q11 4 11 15 V42 z" fill="#6fb4ff"/>
    <path d="M24 8 q11 4 11 15 V30 H24 z" fill="#c9c6d2"/>
    <rect x="13" y="30" width="11" height="12" fill="#c9553d"/><rect x="24" y="30" width="11" height="12" fill="#3f9150"/>
    <circle cx="24" cy="20" r="5" fill="#e2b04c"/>
    <path d="M24 10 V42 M13 30 h22" stroke="#2b241f" stroke-width="2"/>
    <rect x="8" y="41" width="32" height="4" rx="1" fill="#6b5f54"/>`,
  palace: `
    <rect x="6" y="22" width="8" height="22" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1"/>
    <rect x="34" y="22" width="8" height="22" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1"/>
    <rect x="19" y="19" width="10" height="25" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1"/>
    <rect x="14" y="28" width="20" height="16" fill="#f6d6b8" stroke="#6b5f54" stroke-width="1"/>
    <path d="M5 22 l5 -10 l5 10 z M33 22 l5 -10 l5 10 z M18 19 l6 -12 l6 12 z" fill="#2b5fa8"/>
    <path d="M10 12 v-5 l4 2 l-4 2 M24 7 v-4 l4 1.5 l-4 1.5 M38 12 v-5 l4 2 l-4 2" fill="#e2b04c" stroke="#e2b04c" stroke-width="1" stroke-linejoin="round"/>
    <path d="M21 44 v-6 a3 3 0 0 1 6 0 v6 z" fill="#5a3415"/>
    <g fill="#6fb4ff"><rect x="8.5" y="26" width="3" height="5" rx="1.5"/><rect x="36.5" y="26" width="3" height="5" rx="1.5"/><rect x="22.5" y="22" width="3" height="5" rx="1.5"/><rect x="16" y="32" width="3" height="4" rx="1.5"/><rect x="29" y="32" width="3" height="4" rx="1.5"/></g>`,
  hut: `
    <path d="M10 27 v11 a14 4 0 0 0 28 0 v-11 z" fill="#8a7a6a"/>
    <path d="M12 31 h6 M21 31 h6 M30 31 h6 M15 36 h7 M26 36 h7" stroke="#6b5f54" stroke-width="1.2" stroke-linecap="round"/>
    <path d="M20 42 v-8 a4 4 0 0 1 8 0 v8 z" fill="#2b241f"/>
    <path d="M3 27 L24 5 L45 27 z" fill="#b98624"/>
    <path d="M17 12 l-8 12 M24 7 v18 M31 12 l8 12" stroke="#8b5a2b" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M4 44 h40" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>`,
  dam: `
    <rect x="4" y="16" width="18" height="28" fill="#6fb4ff"/>
    <path d="M4 18 q4 -3 8 0 t8 0" fill="none" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M20 11 h6 l8 33 h-14 z" fill="#8a7a6a" stroke="#6b5f54" stroke-width="1.2" stroke-linejoin="round"/>
    <path d="M22 20 h6 M23 30 h8 M24 40 h10" stroke="#6b5f54" stroke-width="1" opacity="0.6"/>
    <rect x="18" y="8" width="10" height="3" fill="#6b5f54"/>
    <path d="M28 30 q6 2 8 8" fill="none" stroke="#dcefff" stroke-width="2" stroke-linecap="round"/>
    <rect x="34" y="38" width="10" height="6" fill="#6fb4ff"/>
    <path d="M34 40 q3 -2 6 0 t4 0" fill="none" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>`,
  hotspring: `
    <path d="M16 24 q-4 -6 0 -10 q4 -4 0 -10 M24 22 q-4 -6 0 -10 q4 -4 0 -10 M32 24 q-4 -6 0 -10 q4 -4 0 -10" fill="none" stroke="#c9c6d2" stroke-width="2.5" stroke-linecap="round" opacity="0.9"/>
    <ellipse cx="24" cy="34" rx="18" ry="7" fill="#6fb4ff" stroke="#2b5fa8" stroke-width="1.5"/>
    <path d="M12 34 q4 -2 8 0 q4 2 8 0 q4 -2 8 0" fill="none" stroke="#dcefff" stroke-width="1.8" stroke-linecap="round"/>
    <g fill="#6b5f54"><ellipse cx="7" cy="30" rx="4" ry="3"/><ellipse cx="41" cy="31" rx="4" ry="3"/><ellipse cx="16" cy="27" rx="3.5" ry="2.5"/><ellipse cx="34" cy="27" rx="3.5" ry="2.5"/><ellipse cx="25" cy="42" rx="4" ry="2.5"/></g>`,
  tent: `
    <path d="M38 3 l1.8 4 4.3 .5 -3.2 3 .9 4.2 -3.8 -2.2 -3.8 2.2 .9 -4.2 -3.2 -3 4.3 -.5 z" fill="#e2b04c"/>
    <path d="M4 42 L24 16 L44 42 z" fill="#c9553d"/>
    <path d="M4 42 L24 16 V42 z" fill="#b8462f"/>
    <path d="M24 22 l-6 20 h12 z" fill="#2b241f"/>
    <path d="M22 16 l-2 -5 M26 16 l2 -5" stroke="#5a3415" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M3 42 h42" stroke="#5a3415" stroke-width="2.5" stroke-linecap="round"/>`,
  bear: `
    <circle cx="11" cy="13" r="6" fill="#2b241f"/><circle cx="37" cy="13" r="6" fill="#2b241f"/>
    <circle cx="11" cy="13" r="2.8" fill="#6b5f54"/><circle cx="37" cy="13" r="2.8" fill="#6b5f54"/>
    <circle cx="24" cy="26" r="17" fill="#2b241f"/>
    <ellipse cx="24" cy="33" rx="8" ry="6" fill="#8b5a2b"/>
    <path d="M20 31 h8 l-4 3.5 z" fill="#2b241f"/>
    <path d="M24 34.5 v2.5 M24 37 q-2 2 -4 0 M24 37 q2 2 4 0" fill="none" stroke="#2b241f" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="17" cy="23" r="1.8" fill="#fbfbf7"/><circle cx="31" cy="23" r="1.8" fill="#fbfbf7"/>
    <circle cx="17.5" cy="23.3" r="0.9" fill="#2b241f"/><circle cx="31.5" cy="23.3" r="0.9" fill="#2b241f"/>`,
  camera: `
    <rect x="16" y="9" width="12" height="6" rx="2" fill="#2b241f"/>
    <rect x="6" y="14" width="36" height="26" rx="4" fill="#6b5f54"/>
    <rect x="6" y="20" width="36" height="14" fill="#e9dcbf"/>
    <circle cx="24" cy="27" r="9" fill="#2b241f"/>
    <circle cx="24" cy="27" r="6" fill="#6fb4ff"/>
    <circle cx="21.5" cy="24.5" r="2" fill="#dcefff"/>
    <rect x="33" y="16" width="5" height="3" rx="1" fill="#e2b04c"/>
    <rect x="9" y="16" width="5" height="3" rx="1" fill="#c9553d"/>`,
  whale: `
    <path d="M30 18 v-6 q-6 -4 -8 -8 M30 12 q6 -4 8 -8" fill="none" stroke="#dcefff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M8 32 q-4 -8 -4 -14 l6 6 l6 -6 q0 6 -4 14 z" fill="#2b5fa8"/>
    <path d="M6 34 q4 -16 20 -16 q14 0 18 8 q-4 8 -14 8 h-22 z" fill="#2b5fa8"/>
    <path d="M34 30 q6 -1 8 -4" fill="none" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>
    <circle cx="36" cy="23" r="1.4" fill="#fbfbf7"/>
    <path d="M4 40 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M4 44 q5 -3 10 0 t10 0 t10 0 t10 0" fill="none" stroke="#6fb4ff" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`,
  book: `
    <path d="M3 11 q10 -4 21 2 q11 -6 21 -2 v30 q-10 -4 -21 2 q-11 -6 -21 -2 z" fill="#b8462f"/>
    <path d="M4 12 q10 -4 20 2 v26 q-10 -6 -20 -2 z" fill="#fbfbf7" stroke="#7b4a21" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M44 12 q-10 -4 -20 2 v26 q10 -6 20 -2 z" fill="#fbfbf7" stroke="#7b4a21" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M8 18 q8 -2 13 1 M8 24 q8 -2 13 1 M8 30 q8 -2 13 1 M40 18 q-8 -2 -13 1 M40 24 q-8 -2 -13 1 M40 30 q-8 -2 -13 1" fill="none" stroke="#c9c6d2" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M27 14 v16 l2 -2 l2 2 v-15 z" fill="#c9553d"/>`,
  wind: `
    <path d="M6 16 h24 a4 4 0 1 0 -4 -4" fill="none" stroke="#6fb4ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M4 26 h32 a5 5 0 1 1 -5 5" fill="none" stroke="#2b5fa8" stroke-width="3" stroke-linecap="round"/>
    <path d="M10 36 h14 a3.5 3.5 0 1 0 -3.5 -3.5" fill="none" stroke="#6fb4ff" stroke-width="3" stroke-linecap="round"/>
    <path d="M36 8 q2 -6 8 -5 q-2 6 -8 5 z" fill="#3f9150"/>
    <path d="M38 42 q2 -6 8 -5 q-2 6 -8 5 z" fill="#e2b04c"/>`,
  summitsign: `
    <path d="M2 40 L18 10 L26 22 L32 16 L46 40 Z" fill="#6b5f54"/>
    <path d="M18 10 L21 15 L18 18 L15 15 Z" fill="#fbfbf7"/><path d="M32 16 L34 19 L32 21 L30 19 Z" fill="#fbfbf7"/>
    <rect x="22" y="20" width="4" height="24" fill="#7b4a21"/>
    <rect x="6" y="20" width="36" height="12" rx="2" fill="#8b5a2b" stroke="#5a3415" stroke-width="1.5"/>
    <path d="M12 25 h24 M16 29 h16" stroke="#ffeec2" stroke-width="2" stroke-linecap="round"/>
    <path d="M4 44 h40" stroke="#5a3415" stroke-width="2" stroke-linecap="round"/>`,
  pine: `
    <rect x="21" y="36" width="6" height="8" fill="#5a3415"/>
    <path d="M24 20 L40 38 H8 Z" fill="#2f7a3f"/>
    <path d="M24 12 L37 28 H11 Z" fill="#3f9150"/>
    <path d="M24 4 L34 18 H14 Z" fill="#2f7a3f"/>
    <path d="M4 44 h40" stroke="#6b5f54" stroke-width="2" stroke-linecap="round"/>`,
};
