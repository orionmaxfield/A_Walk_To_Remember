// Badge icons for the Awards tab, drawn as simple inline SVG shapes.
// Each entry is the inside of a 48 × 48 viewBox. app.js wraps it in <svg>.

const BADGE_ICONS = {
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
};
