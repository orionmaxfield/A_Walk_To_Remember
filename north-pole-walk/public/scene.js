/* The storybook scene at the top of the Journey tab.
   A side-scrolling world drawn as inline SVG, with a cartoon walker in the middle.
   The world is built once per render; three parallax layers are slid to the
   current mile. Colours, weather and the sky blend with progress.

   Every destination has a THEME (see THEMES below) that decides the palette, the
   kind of trees, the walker (the office's elf or a hiker), the finish landmark and
   a few signature touches along the way. The 'arctic' theme is the office's
   original North Pole scene.

   Plain JavaScript, no libraries. app.js calls:
     JourneyScene.mount(host, options)   — the live scene
     JourneyScene.thumbnail(journey)     — a still picture for the destination cards */

(function () {
  'use strict';

  const H = 280;                                  // scene height in SVG units
  const PPM = 1.8;                                // SVG units per mile (near layer)
  const MIN_SEG = 130;                            // least room between two neighbouring signposts
  const SPEED = { far: 0.22, mid: 0.5, near: 1 }; // parallax speeds
  const HORIZON = 214;                            // where the ground meets the sky
  const FEET = 238;                               // the walker's feet, on the path
  const SIGN_BASE = 226;                          // signposts stand just behind the path
  const SIGN_GAP = 26;                            // gap between a sign's right edge and the walker

  // Every id inside the SVG is prefixed, so several scenes can share one page.
  let UID = 'sc';
  const id = (name) => `${UID}-${name}`;
  const ref = (name) => `url(#${UID}-${name})`;

  /* ---------- Small helpers ---------- */

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const lerp = (a, b, t) => a + (b - a) * t;
  function smooth(a, b, x) { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function rng(seed) {
    let s = (seed >>> 0) || 1;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  // Piecewise colour ramp: stops are [[t, '#hex'], ...] sorted by t.
  function ramp(stops, t) {
    if (t <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const k = (t - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]);
        const a = rgb(stops[i - 1][1]), b = rgb(stops[i][1]);
        return `rgb(${Math.round(lerp(a[0], b[0], k))},${Math.round(lerp(a[1], b[1], k))},${Math.round(lerp(a[2], b[2], k))})`;
      }
    }
    return stops[stops.length - 1][1];
  }
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const f2 = (n) => Number(n).toFixed(2);

  /* ---------- World geometry ----------
     Miles map to near-layer x almost linearly (PPM), except that the stretch between
     two neighbouring stops is never shorter than MIN_SEG, so signs that sit a few
     miles apart still get room of their own. The last stretch into the finish gets
     twice that, so the finish landmark never crowds the last signpost. */

  let SEGS = [];
  function setWorld(J) {
    const miles = [...new Set(J.waypoints.map((w) => w.mile))].sort((a, b) => a - b);
    SEGS = [];
    let x = 0;
    for (let i = 1; i < miles.length; i++) {
      const least = i === miles.length - 1 ? MIN_SEG * 2 : MIN_SEG;
      const len = Math.max(least, (miles[i] - miles[i - 1]) * PPM);
      SEGS.push({ m0: miles[i - 1], m1: miles[i], x0: x, x1: x + len });
      x += len;
    }
  }
  function worldX(m) {
    if (!SEGS.length) return m * PPM;
    const first = SEGS[0], last = SEGS[SEGS.length - 1];
    if (m <= first.m0) return first.x0 + (m - first.m0) * PPM;
    if (m >= last.m1) return last.x1 + (m - last.m1) * PPM;
    for (const sg of SEGS) if (m <= sg.m1) return sg.x0 + ((m - sg.m0) / (sg.m1 - sg.m0)) * (sg.x1 - sg.x0);
    return m * PPM;
  }
  function mileAt(x) {
    if (!SEGS.length) return x / PPM;
    const first = SEGS[0], last = SEGS[SEGS.length - 1];
    if (x <= first.x0) return first.m0 + (x - first.x0) / PPM;
    if (x >= last.x1) return last.m1 + (x - last.x1) / PPM;
    for (const sg of SEGS) if (x <= sg.x1) return sg.m0 + ((x - sg.x0) / (sg.x1 - sg.x0)) * (sg.m1 - sg.m0);
    return x / PPM;
  }

  /* ---------- Shared shapes (defs) ---------- */

  const SUN = [[0, '#fff1b8'], [0.6, '#ffd86e'], [1, '#ff9b4c']];

  function defs(c) {
    return `<defs>
      <linearGradient id="${id('sky')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.skyTop}"/><stop offset="0.45" stop-color="${c.skyMid}"/><stop offset="0.78" stop-color="${c.skyBot}"/>
      </linearGradient>
      <linearGradient id="${id('snowcap')}" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="${HORIZON}">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="${c.snowLine.toFixed(3)}" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="${(c.snowLine + 0.09).toFixed(3)}" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${id('aur1')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6fe3b4" stop-opacity="0"/><stop offset="0.35" stop-color="#6fe3b4" stop-opacity="0.8"/>
        <stop offset="0.72" stop-color="#b48cf0" stop-opacity="0.55"/><stop offset="1" stop-color="#b48cf0" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="${id('aur2')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9ff0c8" stop-opacity="0"/><stop offset="0.4" stop-color="#8ad7ff" stop-opacity="0.6"/>
        <stop offset="0.75" stop-color="#c58cf5" stop-opacity="0.6"/><stop offset="1" stop-color="#c58cf5" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="${id('lava')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ff9a3c" stop-opacity="0.85"/><stop offset="0.5" stop-color="#ff6a2a" stop-opacity="0.4"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id('glow')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ffe9a0" stop-opacity="0.75"/><stop offset="1" stop-color="#ffe9a0" stop-opacity="0"/>
      </radialGradient>
      <radialGradient id="${id('emglow')}" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#8ff2b8" stop-opacity="0.55"/><stop offset="1" stop-color="#8ff2b8" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="${id('candy')}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="9" y2="9" spreadMethod="repeat">
        <stop offset="0" stop-color="#fbfbf7"/><stop offset="0.5" stop-color="#fbfbf7"/><stop offset="0.5" stop-color="#c9553d"/><stop offset="1" stop-color="#c9553d"/>
      </linearGradient>
      <linearGradient id="${id('seafade')}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.seaFar || '#2f8fc9'}"/><stop offset="1" stop-color="${c.sea || '#3aa0d8'}"/>
      </linearGradient>
      <pattern id="${id('bricks')}" patternUnits="userSpaceOnUse" width="22" height="12">
        <rect width="22" height="12" fill="${c.path}"/>
        <path d="M0 6 H22 M11 0 V6 M0 6 V12 M22 6 V12 M0 12 H22" stroke="rgba(120,80,0,0.35)" stroke-width="1" fill="none"/>
        <path d="M0 0 V6 M22 0 V6" stroke="rgba(120,80,0,0.35)" stroke-width="1"/>
      </pattern>
      <pattern id="${id('planks')}" patternUnits="userSpaceOnUse" width="14" height="24">
        <rect width="14" height="24" fill="${c.path}"/>
        <path d="M0 0 V24 M7 0 V24" stroke="rgba(60,40,20,0.35)" stroke-width="1.2"/>
      </pattern>
      <g id="${id('pine')}">
        <rect x="-2.5" y="-10" width="5" height="11" fill="#5a3415"/>
        <path d="M0 -24 L19 -1 L-19 -1Z" style="fill:var(--tree)"/>
        <path d="M0 -34 L16 -12 L-16 -12Z" style="fill:var(--tree)"/>
        <path d="M0 -45 L13 -24 L-13 -24Z" style="fill:var(--tree)"/>
        <g fill="#ffffff" style="opacity:var(--tree-snow)">
          <path d="M0 -24 L9 -12 L-9 -12Z"/><path d="M0 -34 L8 -23 L-8 -23Z"/><path d="M0 -45 L7 -34 L-7 -34Z"/>
        </g>
      </g>
      <g id="${id('round')}">
        <rect x="-2.5" y="-16" width="5" height="17" fill="#6b4320"/>
        <circle cx="0" cy="-26" r="13" style="fill:var(--leaf)"/>
        <circle cx="-9" cy="-19" r="9" style="fill:var(--leaf)"/>
        <circle cx="9" cy="-19" r="9" style="fill:var(--leaf)"/>
        <circle cx="-4" cy="-30" r="6" fill="#ffffff" opacity="0.14"/>
      </g>
      <g id="${id('palm')}">
        <path d="M0 0 q-3 -22 4 -40" stroke="#8b5a2b" stroke-width="4" fill="none" stroke-linecap="round"/>
        <g style="fill:var(--leaf)">
          <path d="M4 -40 q-18 -4 -26 8 q14 -6 26 -2z"/><path d="M4 -40 q18 -4 26 8 q-14 -6 -26 -2z"/>
          <path d="M4 -40 q-14 -12 -20 -4 q10 -2 20 6z"/><path d="M4 -40 q14 -12 20 -4 q-10 -2 -20 6z"/>
          <path d="M4 -40 q-2 -14 6 -18 q-2 10 -2 20z"/>
        </g>
        <circle cx="2" cy="-37" r="2.5" fill="#6b4320"/><circle cx="7" cy="-36" r="2.5" fill="#6b4320"/>
      </g>
      <g id="${id('dead')}" stroke="#4a3a2f" stroke-width="2.5" fill="none" stroke-linecap="round">
        <path d="M0 0 V-30 M0 -16 L-10 -26 M0 -22 L9 -32 M-10 -26 L-14 -34 M9 -32 L13 -35"/>
      </g>
      <g id="${id('bush')}" fill="#8aa06a"><ellipse rx="9" ry="6"/><ellipse cx="-7" cy="1" rx="6" ry="4.5"/><ellipse cx="7" cy="1" rx="6" ry="4.5"/></g>
      <g id="${id('rock')}" fill="#9b8c7c"><path d="M-10 0 L-6 -7 L3 -9 L10 -3 L8 0Z"/><path d="M-6 -7 L3 -9 L4 -3 L-4 -2Z" fill="#b3a494"/></g>
      <ellipse id="${id('patch')}" rx="16" ry="4.5" fill="#fbfdff" style="opacity:var(--patch)"/>
      <g id="${id('mound')}"><path d="M-24 0 Q0 -15 24 0Z" fill="#f8fbff"/><path d="M-24 0 Q0 -15 24 0" fill="none" stroke="#c3d4e8" stroke-width="1.2"/></g>
      <path id="${id('ice')}" d="M-14 0 L-10 -8 L6 -9 L14 0Z" fill="#d6ecf9" stroke="#9cc6e0" stroke-width="1"/>
      <g id="${id('berg')}"><path d="M-30 0 L-18 -22 L-6 -14 L8 -30 L22 -10 L32 0Z" fill="#e4f2fb"/><path d="M-6 -14 L8 -30 L22 -10 L10 -6Z" fill="#c6e1f2"/></g>
      <g id="${id('cloud')}" fill="#ffffff"><ellipse rx="26" ry="10"/><circle cx="-10" cy="-6" r="11"/><circle cx="6" cy="-9" r="13"/><circle cx="18" cy="-3" r="9"/></g>
      <g id="${id('sheep')}"><ellipse cx="0" cy="-6" rx="8" ry="5.5" fill="#fbfbf7"/><circle cx="7" cy="-8" r="3" fill="#2b241f"/><path d="M-5 -1 v3 M-1 -1 v3 M3 -1 v3" stroke="#2b241f" stroke-width="1.5"/></g>
      <g id="${id('poppy')}"><path d="M0 0 v-9" stroke="#3f8a3c" stroke-width="1.2"/><circle cx="0" cy="-11" r="3.6" fill="#d9442b"/><circle cx="0" cy="-11" r="1.2" fill="#2b241f"/></g>
      <g id="${id('corn')}"><path d="M0 0 v-30" stroke="#6f9d2f" stroke-width="2.2"/><path d="M0 -12 q-9 -3 -12 -12 q8 2 12 8z M0 -18 q9 -3 12 -12 q-8 2 -12 8z M0 -6 q-8 -1 -10 -8 q6 1 10 5z" fill="#86b43f"/><path d="M0 -30 l-2 -7 l2 -2 l2 2z" fill="#e2b04c"/></g>
      <g id="${id('vine')}"><path d="M0 0 v-14" stroke="#6b4320" stroke-width="2"/><path d="M-12 -10 H12" stroke="#6b4320" stroke-width="1"/><circle cx="-6" cy="-14" r="4" fill="#5e8f3a"/><circle cx="4" cy="-16" r="4.5" fill="#5e8f3a"/><circle cx="0" cy="-9" r="2.2" fill="#7b2f68"/></g>
      <g id="${id('thistle')}"><path d="M0 0 v-13" stroke="#6b7a4a" stroke-width="1.5"/><path d="M0 -13 l-4 -2 l4 -1 l4 1z" fill="#6b7a4a"/><ellipse cx="0" cy="-18" rx="3.2" ry="4.5" fill="#8a5aa8"/></g>
      <g id="${id('reed')}" stroke="#6f7f4a" stroke-width="1.5" fill="none" stroke-linecap="round"><path d="M0 0 v-18 M-4 0 v-13 M4 0 v-15"/><ellipse cx="0" cy="-19" rx="1.4" ry="4" fill="#5a4a2f" stroke="none"/></g>
      <g id="${id('coral')}"><path d="M0 0 v-10 M0 -5 l-6 -8 M0 -7 l6 -7 M-6 -13 l-3 -4 M6 -14 l3 -5" stroke="#f08a7a" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>
      <g id="${id('fire')}"><path d="M0 0 c3 -6 7 -8 7 -16 a7 7 0 0 1 -14 0 c0 -5 3 -6 4 -9 c1 3 3 4 3 7 c1 -4 0 -7 0 -12 c3 6 4 8 0 30z" fill="#ff7a2c"/><path d="M0 0 c1 -4 4 -5 4 -9 a4 4 0 0 1 -8 0 c0 -2 2 -4 2 -6 c1 1 2 2 2 4z" fill="#ffd54a"/></g>
    </defs>`;
  }

  /* ---------- Sky ---------- */

  function sky(c, VW, theme) {
    const r = rng(5);
    let stars = '';
    for (let i = 0; i < 46; i++) {
      const x = (r() * VW).toFixed(0), y = (8 + r() * 150).toFixed(0), rad = (0.7 + r() * 1).toFixed(1);
      const tw = i % 5 === 0 ? ` class="star-tw" style="animation-delay:${(-r() * 3).toFixed(1)}s"` : '';
      stars += `<circle cx="${x}" cy="${y}" r="${rad}"${tw}/>`;
    }
    const sx = (VW / 390).toFixed(3);
    let clouds = '';
    if (c.clouds > 0.02) {
      const cr = rng(31);
      for (let i = 0; i < 5; i++) {
        clouds += `<use href="#${id('cloud')}" transform="translate(${(cr() * VW).toFixed(0)} ${(30 + cr() * 90).toFixed(0)}) scale(${(0.6 + cr() * 0.7).toFixed(2)})"/>`;
      }
      clouds = `<g class="clouds" opacity="${f2(c.clouds * 0.85)}">${clouds}</g>`;
    }
    return `
      <rect x="0" y="0" width="${VW}" height="${H}" fill="${ref('sky')}"/>
      <g opacity="${f2(c.sunOp)}">
        <circle cx="${(VW * 0.76).toFixed(0)}" cy="${c.sunY.toFixed(0)}" r="34" fill="${c.sunColor}" opacity="0.28"/>
        <circle cx="${(VW * 0.76).toFixed(0)}" cy="${c.sunY.toFixed(0)}" r="17" fill="${c.sunColor}"/>
      </g>
      <g opacity="${f2(c.moonOp)}" transform="translate(${(VW * 0.2).toFixed(0)} ${c.moonY.toFixed(0)})">
        <circle r="26" fill="#fff6d6" opacity="0.14"/><circle r="14" fill="#fff6d6"/>
        <circle cx="-4" cy="-3" r="3" fill="#efe4c4"/><circle cx="5" cy="4" r="2" fill="#efe4c4"/><circle cx="2" cy="-7" r="1.5" fill="#efe4c4"/>
      </g>
      <g class="stars" fill="#fff4d6" opacity="${f2(c.stars)}">${stars}</g>
      ${theme.sky ? theme.sky(c, VW) : ''}
      <g class="aurora" opacity="${f2(c.aurora)}" transform="scale(${sx} 1)">
        <path class="ribbon r1" d="M-40 76 C 60 36, 130 100, 210 60 S 350 20, 430 66 L430 118 C 350 76, 260 142, 180 100 S 50 76, -40 128 Z" fill="${ref('aur1')}"/>
        <path class="ribbon r2" d="M-40 42 C 90 12, 150 72, 240 32 S 360 2, 430 38 L430 80 C 350 48, 250 104, 160 68 S 60 42, -40 84 Z" fill="${ref('aur2')}"/>
        <path class="ribbon r3" d="M-40 104 C 70 68, 170 130, 260 90 S 380 58, 430 100 L430 142 C 360 106, 240 172, 150 132 S 60 104, -40 150 Z" fill="${ref('aur1')}"/>
      </g>
      ${clouds}`;
  }

  /* ---------- Far layer: mountains ---------- */

  function mountains(x0, x1, base, hMin, hMax, r) {
    let d = `M${x0} ${base + 40} L${x0} ${base - hMin * 0.5}`;
    let x = x0;
    while (x < x1) {
      const w = 70 + r() * 90, h = hMin + r() * (hMax - hMin);
      d += ` L${(x + w * 0.38).toFixed(0)} ${(base - h).toFixed(0)}`
        + ` L${(x + w * 0.5).toFixed(0)} ${(base - h * 0.84).toFixed(0)}`
        + ` L${(x + w * 0.6).toFixed(0)} ${(base - h * 0.92).toFixed(0)}`
        + ` L${(x + w).toFixed(0)} ${(base - hMin * 0.3 - r() * 24).toFixed(0)}`;
      x += w;
    }
    return d + ` L${x.toFixed(0)} ${base + 40} Z`;
  }

  function farLayer(total, VW, c, theme) {
    const r = rng(7);
    const x0 = -VW * 2, x1 = worldX(total) * SPEED.far + VW * 2;
    const scale = theme.farScale == null ? 1 : theme.farScale; // 0 = no mountains at all
    if (scale === 0) return '';
    const back = mountains(x0, x1, HORIZON + 8, 55 * scale, 100 * scale, r);
    const front = mountains(x0, x1, HORIZON + 4, 60 * scale, 140 * scale, r);
    return `<path d="${back}" fill="${c.rockBack}"/><path d="${back}" fill="${ref('snowcap')}" opacity="0.8"/>
            <path d="${front}" fill="${c.rock}"/><path d="${front}" fill="${ref('snowcap')}"/>`;
  }

  /* ---------- Mid layer: hills, forest, and the theme's landmarks ---------- */

  function hills(x0, x1, base, amp, r) {
    let x = x0, y = base - 4 - r() * amp;
    let d = `M${x0} ${base + 70} L${x0} ${y.toFixed(0)}`;
    while (x < x1) {
      const w = 110 + r() * 120, ny = base - 4 - r() * amp;
      d += ` C${(x + w / 2).toFixed(0)} ${y.toFixed(0)} ${(x + w / 2).toFixed(0)} ${ny.toFixed(0)} ${(x + w).toFixed(0)} ${ny.toFixed(0)}`;
      x += w; y = ny;
    }
    return d + ` L${x.toFixed(0)} ${base + 70} Z`;
  }

  // Forest by fraction of the trail: each entry is [from, to, density, kind].
  // kind is 'pine', 'round', 'palm' or 'dead'; density 1 is a thick wood.
  function forest(r, total, table) {
    let out = '';
    for (const [a, b, density, kind] of table) {
      const xEnd = worldX(b * total) * SPEED.mid;
      for (let x = worldX(a * total) * SPEED.mid; x < xEnd; x += 9) {
        if (r() > density * 0.8) continue;
        const s = (0.7 + r() * 0.6).toFixed(2);
        const y = HORIZON + 2 + Math.round(r() * 6);
        out += `<use href="#${id(kind || 'pine')}" transform="translate(${(x + r() * 7).toFixed(0)} ${y}) scale(${s})"/>`;
      }
    }
    return out;
  }

  function volcano(x, big) {
    const s = big ? 1.35 : 1;
    return `<g transform="translate(${x.toFixed(0)} ${HORIZON + 6}) scale(${s})">
      <ellipse class="lava-glow" cx="0" cy="-116" rx="80" ry="36" fill="${ref('lava')}"/>
      <path d="M-135 0 L-30 -118 L30 -118 L135 0 Z" fill="#5a4742"/>
      <path d="M-30 -118 L30 -118 L135 0 L60 0 Z" fill="#4a3a37"/>
      <path d="M-30 -118 Q0 -128 30 -118 Q0 -108 -30 -118 Z" fill="#ff7a2c"/>
      <path d="M-8 -116 L-18 -78 L-30 -48 L-18 -62 L-10 -90 Z" fill="#ff6a24"/>
      <path d="M12 -116 L18 -84 L34 -52 L22 -70 L16 -100 Z" fill="#ff8c3a"/>
      <path d="M-26 -104 L-40 -70 L-48 -58 L-36 -80 Z" fill="#ffb347" opacity="0.8"/>
      <g fill="#a9a6b4" opacity="0.75"><circle cx="-8" cy="-140" r="12"/><circle cx="10" cy="-156" r="15"/><circle cx="-4" cy="-176" r="18"/><circle cx="16" cy="-194" r="14"/></g>
    </g>`;
  }

  function house(x, base, w, h, wall, roof, lit) {
    const half = w / 2, peak = -h - w * 0.5;
    return `<g transform="translate(${x.toFixed(0)} ${base})">
      <rect x="${-half}" y="${-h}" width="${w}" height="${h}" fill="${wall}"/>
      <path d="M${-half - 5} ${-h} L0 ${peak} L${half + 5} ${-h} Z" fill="${roof}"/>
      <path d="M${-half - 5} ${-h} L0 ${peak} L${half + 5} ${-h}" fill="none" stroke="#fbfbf7" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="${-half + 4}" y="${-h + 6}" width="${Math.max(5, w * 0.22)}" height="${Math.max(5, h * 0.35)}" rx="1.5" fill="${lit ? '#ffd76a' : '#6b4320'}"/>
      <rect x="${half - 4 - Math.max(5, w * 0.22)}" y="${-h + 6}" width="${Math.max(5, w * 0.22)}" height="${Math.max(5, h * 0.35)}" rx="1.5" fill="${lit ? '#ffd76a' : '#6b4320'}"/>
      <rect x="${-Math.max(3, w * 0.1)}" y="${-h * 0.55}" width="${Math.max(6, w * 0.2)}" height="${h * 0.55}" rx="2" fill="#6b4320"/>
    </g>`;
  }

  // A plain cottage (no snow on the roof) for the greener trails.
  function cottage(x, base, w, h, wall, roof, lit) {
    const half = w / 2, peak = -h - w * 0.45;
    return `<g transform="translate(${x.toFixed(0)} ${base})">
      <rect x="${-half}" y="${-h}" width="${w}" height="${h}" fill="${wall}"/>
      <path d="M${-half - 4} ${-h} L0 ${peak} L${half + 4} ${-h} Z" fill="${roof}"/>
      <rect x="${-half + 4}" y="${-h + 6}" width="${Math.max(5, w * 0.22)}" height="${Math.max(5, h * 0.35)}" rx="1.5" fill="${lit ? '#ffd76a' : '#4a3a2f'}"/>
      <rect x="${-Math.max(3, w * 0.1)}" y="${-h * 0.55}" width="${Math.max(6, w * 0.2)}" height="${h * 0.55}" rx="2" fill="#4a3a2f"/>
      <rect x="${half * 0.45}" y="${peak + 6}" width="5" height="${h * 0.6}" fill="#6b5f54"/>
    </g>`;
  }

  // A sagging string of lights between two points, with twinkling bulbs.
  function lights(x1, y1, x2, y2, sag) {
    const cx = (x1 + x2) / 2, cy = Math.max(y1, y2) + sag;
    const n = Math.max(3, Math.round(Math.abs(x2 - x1) / 11));
    const colors = ['#ff5f5f', '#ffd54a', '#6fe3b4', '#79b8ff'];
    let bulbs = '';
    for (let i = 1; i < n; i++) {
      const k = i / n, mk = 1 - k;
      const bx = mk * mk * x1 + 2 * mk * k * cx + k * k * x2;
      const by = mk * mk * y1 + 2 * mk * k * cy + k * k * y2;
      bulbs += `<circle class="bulb-${i % 2 ? 'a' : 'b'}" cx="${bx.toFixed(1)}" cy="${(by + 2.5).toFixed(1)}" r="2.2" fill="${colors[i % 4]}"/>`;
    }
    return `<path d="M${x1} ${y1} Q${cx.toFixed(0)} ${cy.toFixed(0)} ${x2} ${y2}" fill="none" stroke="#2b241f" stroke-width="1"/>${bulbs}`;
  }

  // A tower with a conical roof and a pennant, for castles.
  function tower(x, base, w, h, wall, roof, flag) {
    const half = w / 2;
    return `<g transform="translate(${x.toFixed(0)} ${base})">
      <rect x="${-half}" y="${-h}" width="${w}" height="${h}" fill="${wall}"/>
      <path d="M${-half - 3} ${-h} L0 ${-h - w * 0.9} L${half + 3} ${-h}Z" fill="${roof}"/>
      <rect x="${-half}" y="${-h}" width="${w}" height="4" fill="rgba(0,0,0,0.12)"/>
      <rect x="${-2}" y="${-h * 0.6}" width="4" height="7" rx="2" fill="#2b241f"/>
      <path d="M0 ${-h - w * 0.9} v-12" stroke="#4a3a2f" stroke-width="1.5"/>
      <path d="M0 ${-h - w * 0.9 - 12} l10 3 l-10 3z" fill="${flag || '#c9553d'}"/>
    </g>`;
  }

  // Castle walls with battlements between two x positions.
  function wall(x1, x2, base, h, color) {
    let teeth = '';
    for (let x = x1 + 3; x < x2 - 4; x += 10) teeth += `<rect x="${x.toFixed(0)}" y="${-h - 5}" width="5" height="6" fill="${color}"/>`;
    return `<g transform="translate(0 ${base})"><rect x="${x1.toFixed(0)}" y="${-h}" width="${(x2 - x1).toFixed(0)}" height="${h}" fill="${color}"/>${teeth}</g>`;
  }

  function midLayer(total, VW, c, J, marks, theme) {
    const r = rng(11);
    const x0 = -VW * 2, x1 = worldX(total) * SPEED.mid + VW * 2;
    const mx = (mile) => worldX(mile) * SPEED.mid;
    const ctx = { J, VW, c, marks, total, r, mx, x0, x1 };
    const amp = theme.hillAmp == null ? 1 : theme.hillAmp;
    let out = '';
    if (c.sea != null) {
      // A sea behind the land: a band from the horizon up to a low "far shore".
      out += `<rect x="${x0}" y="${HORIZON - 26}" width="${x1 - x0}" height="40" fill="${ref('seafade')}"/>`;
      let waves = '';
      for (let x = x0; x < x1; x += 46 + r() * 40) waves += `M${x.toFixed(0)} ${(HORIZON - 16 + r() * 14).toFixed(0)} q6 -2 12 0`;
      out += `<path d="${waves}" fill="none" stroke="rgba(255,255,255,0.55)" stroke-width="1.2" stroke-linecap="round"/>`;
    }
    out += `<path d="${hills(x0, x1, HORIZON, 48 * amp, r)}" fill="${c.hillBack}"/>`;
    if (theme.midBehind) out += theme.midBehind(ctx);
    out += `<path d="${hills(x0, x1, HORIZON + 4, 26 * amp, r)}" fill="${c.hillFront}"/>`;
    if (theme.midHills) out += theme.midHills(ctx);
    out += forest(r, total, theme.forest || []);
    if (theme.midFront) out += theme.midFront(ctx);
    return out;
  }

  /* ---------- Near layer: ground, path, signs, and the theme's finish ---------- */

  function plankShape(w, small) {
    const h = small ? 15 : 18;
    if (small) return `M${-w / 2} 0 H${w / 2} V${h} H${-w / 2} Z`;
    return `M${-w / 2} 0 H${w / 2 - 8} L${w / 2} ${h / 2} L${w / 2 - 8} ${h} H${-w / 2} Z`;
  }

  // Where a sign's post stands: passed signs end a fixed gap behind the walker,
  // upcoming signs begin a fixed gap ahead of it, so neither ever overlaps the walker.
  function signX(mile, width, passed) {
    return passed ? worldX(mile) - (width / 2 + SIGN_GAP) : worldX(mile) + (width / 2 + SIGN_GAP + 10);
  }

  function signpost(wp, tall, passed) {
    const lines = wp.sign || [wp.name];
    const milesText = wp.mile === 0 ? 'Start' : `${Number(wp.mile).toLocaleString('en-US')} mi`;
    const top = tall ? 122 : 164;
    let y = top, out = '', maxW = 0;
    lines.forEach((line, i) => {
      const w = clamp(Math.round(line.length * 6.6 + 18), 44, 96);
      maxW = Math.max(maxW, w);
      out += `<g class="plank" transform="translate(0 ${y}) rotate(${i % 2 ? 1.4 : -1.6})"><path d="${plankShape(w, false)}"/><text x="-3" y="13">${esc(line)}</text></g>`;
      y += 20;
    });
    const mw = clamp(Math.round(milesText.length * 5.6 + 12), 36, 80);
    out += `<g class="plank plank-mi" transform="translate(0 ${y})"><path d="${plankShape(mw, true)}"/><text x="0" y="11">${esc(milesText)}</text></g>`;
    const star = wp.scene === 'halfway'
      ? `<path transform="translate(-4 ${top - 9})" d="M0 -8 L2.4 -2.5 L8 -2 L3.8 1.8 L5 7.5 L0 4.5 L-5 7.5 L-3.8 1.8 L-8 -2 L-2.4 -2.5Z" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>`
      : '';
    const x = signX(wp.mile, maxW, passed);
    return `<g class="sign" data-mile="${wp.mile}" data-passed="${passed ? 1 : 0}" data-w="${maxW}" data-x="${x.toFixed(1)}" transform="translate(${x.toFixed(1)} 0)">
      <rect class="post" x="-3.5" y="${top + 6}" width="7" height="${SIGN_BASE - top - 6}" rx="1"/>
      <rect x="-4" y="${SIGN_BASE - 3}" width="8" height="5" rx="2" fill="#fbfbf7" opacity="0.9"/>
      ${star}${out}
    </g>`;
  }

  function polarBear(x) {
    return `<g transform="translate(${x.toFixed(0)} ${SIGN_BASE})">
      <g fill="#edf1f5"><rect x="-17" y="-11" width="7" height="11" rx="3"/><rect x="-6" y="-11" width="7" height="11" rx="3"/><rect x="6" y="-11" width="7" height="11" rx="3"/></g>
      <ellipse cx="0" cy="-15" rx="21" ry="11" fill="#f6f8fa"/>
      <circle cx="19" cy="-22" r="8.5" fill="#f6f8fa"/>
      <circle cx="14" cy="-29" r="2.6" fill="#f6f8fa"/><circle cx="23" cy="-29" r="2.6" fill="#f6f8fa"/>
      <circle cx="26.5" cy="-21" r="1.9" fill="#2b241f"/><circle cx="21" cy="-24" r="1.2" fill="#2b241f"/>
      <rect x="11" y="-18" width="12" height="3" rx="1.5" fill="#2f7a3f"/>
    </g>`;
  }

  function blackBear(x) {
    return `<g transform="translate(${x.toFixed(0)} ${SIGN_BASE})">
      <g fill="#2b241f"><rect x="-15" y="-10" width="7" height="10" rx="3"/><rect x="-5" y="-10" width="7" height="10" rx="3"/><rect x="6" y="-10" width="7" height="10" rx="3"/></g>
      <ellipse cx="0" cy="-15" rx="19" ry="10" fill="#332a24"/>
      <circle cx="17" cy="-22" r="7.5" fill="#332a24"/>
      <circle cx="13" cy="-28" r="2.4" fill="#332a24"/><circle cx="21" cy="-28" r="2.4" fill="#332a24"/>
      <ellipse cx="22" cy="-20" rx="3.5" ry="2.6" fill="#8b5a2b"/><circle cx="23.5" cy="-20.5" r="1.3" fill="#2b241f"/>
      <circle cx="18" cy="-24" r="1" fill="#fbfbf7"/>
    </g>`;
  }

  function penguin(x, y, s, flip) {
    return `<g transform="translate(${x.toFixed(0)} ${y}) scale(${flip ? -s : s} ${s})">
      <ellipse cy="-11" rx="7" ry="11" fill="#1d2430"/>
      <ellipse cx="1" cy="-9" rx="4.5" ry="8" fill="#fbfbf7"/>
      <circle cx="2.4" cy="-17" r="1.4" fill="#fff"/><circle cx="2.8" cy="-17" r="0.7" fill="#1d2430"/>
      <path d="M4.5 -15 l5 1.6 l-5 1.6z" fill="#f4a234"/>
      <path d="M-6 -14 q-5 6 -1 11" stroke="#1d2430" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <rect x="-5.5" y="-19" width="11" height="3" rx="1.5" fill="#c9553d"/>
      <ellipse cx="-2.5" cy="0" rx="3" ry="1.4" fill="#f4a234"/><ellipse cx="3" cy="0" rx="3" ry="1.4" fill="#f4a234"/>
    </g>`;
  }

  function arch(x) {
    return `<g class="finish" transform="translate(${x.toFixed(0)} 230)">
      <g fill="#fbfbf7"><ellipse cx="-62" cy="0" rx="14" ry="5"/><ellipse cx="62" cy="0" rx="14" ry="5"/></g>
      <path d="M-62 0 V-90 A62 62 0 0 1 62 -90 V0" fill="none" stroke="#7b2f22" stroke-width="14" stroke-linecap="round"/>
      <path d="M-62 0 V-90 A62 62 0 0 1 62 -90 V0" fill="none" stroke="${ref('candy')}" stroke-width="11" stroke-linecap="round"/>
      <circle cx="-62" cy="-96" r="7" fill="#e2b04c" stroke="#b98624" stroke-width="1"/><circle cx="62" cy="-96" r="7" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
      ${lights(-56, -100, 56, -100, 26)}
      <path d="M0 -168 L3.2 -160 L11 -159 L5 -153 L7 -145 L0 -149 L-7 -145 L-5 -153 L-11 -159 L-3.2 -160Z" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
      <g class="finish-sign"><rect x="-46" y="-142" width="92" height="24" rx="4"/><text x="0" y="-125">NORTH POLE</text></g>
    </g>`;
  }

  // A big banner sign over the trail at the finish, for the other destinations.
  function finishBanner(x, text, color) {
    const w = Math.max(100, text.length * 9 + 30);
    return `<g class="finish" transform="translate(${x.toFixed(0)} 230)">
      <rect x="-${w / 2 + 6}" y="-150" width="7" height="150" rx="2" fill="#6b3f1d"/>
      <rect x="${w / 2 - 1}" y="-150" width="7" height="150" rx="2" fill="#6b3f1d"/>
      <path d="M-${w / 2} -146 Q0 -130 ${w / 2} -146 L${w / 2} -112 Q0 -96 -${w / 2} -112Z" fill="${color || '#c9553d'}" stroke="#4a2a10" stroke-width="2"/>
      <g class="finish-sign"><text x="0" y="-122" style="fill:#fbfbf7">${esc(text)}</text></g>
      ${lights(-w / 2, -148, w / 2, -148, 14)}
    </g>`;
  }

  function nearLayer(total, VW, c, J, marks, mile, theme) {
    const r = rng(19);
    const x0 = -VW * 3, x1 = worldX(total) + VW * 3;
    const nx = (mile) => worldX(mile);
    const ctx = { J, VW, c, marks, total, r, nx, x0, x1, mile };
    const pathFill = theme.path === 'bricks' ? ref('bricks') : theme.path === 'planks' ? ref('planks') : c.path;
    let out = `<rect x="${x0}" y="${HORIZON}" width="${x1 - x0}" height="${H - HORIZON + 10}" fill="${c.grass}"/>
      <rect x="${x0}" y="${HORIZON}" width="${x1 - x0}" height="3" fill="rgba(0,0,0,0.06)"/>
      <rect x="${x0}" y="228" width="${x1 - x0}" height="24" rx="2" fill="${pathFill}"/>
      <rect x="${x0}" y="228" width="${x1 - x0}" height="2" fill="rgba(0,0,0,0.07)"/>`;

    if (theme.brush) {
      // Foothills: sagebrush and rocks up to a certain mile
      const brushEnd = nx(theme.brush(marks, total));
      for (let x = x0; x < brushEnd; x += 32 + r() * 54) {
        const front = r() < 0.4;
        const s = (front ? 0.5 : 0.8 + r() * 0.5).toFixed(2);
        const y = front ? 262 + Math.round(r() * 10) : SIGN_BASE - Math.round(r() * 6);
        out += `<use href="#${id(r() < 0.3 ? 'rock' : 'bush')}" transform="translate(${x.toFixed(0)} ${y}) scale(${s})"/>`;
      }
    }
    if (c.patch > 0.01 || theme.patches) {
      // Snow patches everywhere (faded in with progress)
      for (let x = x0; x < x1; x += 25 + r() * 47) {
        const front = r() < 0.45;
        const y = front ? 258 + Math.round(r() * 14) : HORIZON + 4 + Math.round(r() * 8);
        out += `<use href="#${id('patch')}" transform="translate(${x.toFixed(0)} ${y}) scale(${(front ? 0.5 : 0.7 + r() * 0.7).toFixed(2)} 1)"/>`;
      }
    }
    if (theme.nearBehind) out += theme.nearBehind(ctx);

    // Signposts: alternate tall and short so close neighbours never collide
    J.waypoints.forEach((wp, i) => {
      if (wp.scene === 'finish') return;
      out += signpost(wp, i % 2 === 0, wp.mile <= mile);
    });

    if (theme.nearFront) out += theme.nearFront(ctx);
    return out;
  }

  /* ---------- The walkers ---------- */

  // A group that rotates around a pivot: an invisible circle makes the bounding
  // box symmetric around (px, py) so transform-origin 50% 50% lands on the pivot.
  function pivot(cls, px, py, rad, inner) {
    return `<g class="${cls}"><circle cx="${px}" cy="${py}" r="${rad}" fill="none"/>${inner}</g>`;
  }

  function elf(cx) {
    const leg = (cls, x) => pivot(cls, x, -32, 40,
      `<rect x="${x - 4}" y="-33" width="8" height="29" rx="3" fill="#2f7a3f"/>
       <path d="M${x - 5} -6 h9 q8 0 9 5 q-2 3 -6 1 h-12 z" fill="#5a3415"/>
       <circle cx="${x + 12}" cy="-3" r="1.6" fill="#e2b04c"/>`);
    return `<g class="elf" transform="translate(${cx} ${FEET})">
      <ellipse class="elf-shadow" cy="3" rx="18" ry="4" fill="rgba(0,0,0,0.18)"/>
      <g class="elf-walk">
        ${pivot('elf-arm-b', -9, -54, 34, `<path d="M-9 -54 L-15 -36" stroke="#3f9150" stroke-width="6" stroke-linecap="round"/><circle cx="-15.5" cy="-34" r="3.4" fill="#f6d6b8"/>`)}
        ${leg('elf-leg-b', -4)}
        ${leg('elf-leg-f', 4)}
        <rect x="-25" y="-61" width="15" height="25" rx="5" fill="#8b5a2b"/>
        <rect x="-25" y="-53" width="15" height="4" fill="#6b4320"/>
        <rect x="-27" y="-65" width="18" height="7" rx="3.5" fill="#c9553d"/>
        <path d="M-12 -58 L13 -58 L17 -28 L13 -24 L9 -28 L5 -24 L1 -28 L-3 -24 L-7 -28 L-11 -24 L-15 -28 Z" fill="#3f9150"/>
        <rect x="-15" y="-39" width="31" height="5" fill="#5a3415"/>
        <rect x="-3" y="-40" width="7" height="7" rx="1" fill="#e2b04c"/>
        <path d="M-12 -62 l-13 10 l6 3 l9 -9 z" fill="#b8462f"/>
        <rect x="-13" y="-63" width="26" height="8" rx="4" fill="#c9553d"/>
        <circle cy="-73" r="12" fill="#f6d6b8"/>
        <path d="M-12 -75 l-7 -3 l5 8 z" fill="#f6d6b8"/><path d="M12 -75 l7 -3 l-5 8 z" fill="#f6d6b8"/>
        <circle cx="1" cy="-69" r="2.4" fill="#f0a3a3" opacity="0.7"/><circle cx="11" cy="-69" r="2.2" fill="#f0a3a3" opacity="0.7"/>
        <circle cx="4" cy="-75" r="1.6" fill="#2b241f"/><circle cx="9.5" cy="-75" r="1.6" fill="#2b241f"/>
        <path d="M4 -67.5 q3.5 3.5 7 0" stroke="#8a4a3a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <circle cx="11.5" cy="-71.5" r="1.3" fill="#e8b89a"/>
        <clipPath id="${id('hat')}"><path d="M-15 -80 L15 -80 L5 -104 Q0 -114 -12 -114 Z"/></clipPath>
        <g clip-path="${ref('hat')}">
          <rect x="-30" y="-120" width="60" height="44" fill="#c9553d"/>
          <g fill="#2f7a3f"><rect x="-30" y="-92" width="60" height="6"/><rect x="-30" y="-104" width="60" height="6"/><rect x="-30" y="-116" width="60" height="6"/></g>
        </g>
        <rect x="-17" y="-85" width="34" height="8" rx="4" fill="#fbfbf7"/>
        <circle cx="-13" cy="-114" r="4.8" fill="#fbfbf7"/>
        ${pivot('elf-arm-f', 9, -54, 28, `<path d="M9 -54 L17 -46 L22 -46" stroke="#3f9150" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          ${pivot('elf-book', 22, -46, 14, `<path d="M15 -55 L24 -52 L33 -55 L33 -43 L24 -40 L15 -43 Z" fill="#fbfbf7" stroke="#6b5f54" stroke-width="1" stroke-linejoin="round"/>
            <path d="M24 -52 V-40" stroke="#c9c2b4" stroke-width="1"/>
            <path d="M17 -50 h5 M17 -47 h5 M26 -50 h5 M26 -47 h5" stroke="#9aa4ad" stroke-width="1" stroke-linecap="round"/>
            <path d="M26 -46 l5 -7" stroke="#e2b04c" stroke-width="2" stroke-linecap="round"/>`)}
          <circle cx="23" cy="-46" r="3.4" fill="#f6d6b8"/>`)}
      </g>
    </g>`;
  }

  // A hiker with a red pack, a brimmed hat and a trekking pole. Same moving parts
  // (and class names) as the elf, so the walk cycle in styles.css applies to both.
  function hiker(cx) {
    const leg = (cls, x) => pivot(cls, x, -32, 40,
      `<rect x="${x - 4.5}" y="-33" width="9" height="28" rx="3" fill="#6b7a4a"/>
       <path d="M${x - 5.5} -7 h10 q8 0 9 5 q-2 3 -6 1 h-13 z" fill="#5a3415"/>
       <path d="M${x - 5} -7 h10" stroke="#e2b04c" stroke-width="1.4"/>`);
    return `<g class="elf hiker" transform="translate(${cx} ${FEET})">
      <ellipse class="elf-shadow" cy="3" rx="18" ry="4" fill="rgba(0,0,0,0.18)"/>
      <g class="elf-walk">
        ${pivot('elf-arm-b', -9, -54, 34, `<path d="M-9 -54 L-16 -36" stroke="#3b6ea8" stroke-width="6" stroke-linecap="round"/><circle cx="-16.5" cy="-34" r="3.4" fill="#f6d6b8"/>`)}
        ${leg('elf-leg-b', -4)}
        ${leg('elf-leg-f', 4)}
        <rect x="-27" y="-64" width="16" height="28" rx="6" fill="#b8462f"/>
        <rect x="-27" y="-52" width="16" height="4" fill="#8a2f22"/>
        <rect x="-29" y="-40" width="20" height="7" rx="3.5" fill="#3b7a7a"/>
        <rect x="-13" y="-60" width="26" height="30" rx="5" fill="#3b6ea8"/>
        <rect x="-13" y="-37" width="26" height="5" fill="#5a3415"/>
        <rect x="-3" y="-38" width="7" height="6" rx="1" fill="#e2b04c"/>
        <path d="M-10 -58 h-4 v18" stroke="#8a2f22" stroke-width="3" fill="none"/>
        <circle cy="-72" r="11.5" fill="#f6d6b8"/>
        <path d="M-11 -74 q11 -14 22 0 v4 h-22z" fill="#5a3415"/>
        <circle cx="4" cy="-73" r="1.6" fill="#2b241f"/><circle cx="9.5" cy="-73" r="1.6" fill="#2b241f"/>
        <path d="M4 -66 q3.5 3.5 7 0" stroke="#8a4a3a" stroke-width="1.3" fill="none" stroke-linecap="round"/>
        <circle cx="1" cy="-68" r="2.2" fill="#f0a3a3" opacity="0.6"/><circle cx="11" cy="-68" r="2" fill="#f0a3a3" opacity="0.6"/>
        <ellipse cx="0" cy="-80" rx="19" ry="4.5" fill="#b98624"/>
        <path d="M-11 -80 q0 -12 11 -12 q11 0 11 12z" fill="#e2b04c"/>
        <path d="M-11 -81 h22" stroke="#8a2f22" stroke-width="2.5"/>
        ${pivot('elf-arm-f', 9, -54, 28, `<path d="M9 -54 L17 -46 L20 -44" stroke="#3b6ea8" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <path d="M21 -52 L25 -2" stroke="#8b5a2b" stroke-width="2.5" stroke-linecap="round"/>
          <circle cx="21" cy="-53" r="2.2" fill="#2b241f"/>
          <circle cx="21" cy="-44" r="3.4" fill="#f6d6b8"/>`)}
      </g>
    </g>`;
  }

  /* ---------- Falling snow, or embers ---------- */

  function snowfall(VW, c, color) {
    const groups = [[20, c.snowA, 9, 1.5], [26, c.snowB, 7.5, 1.8], [34, c.snowC, 6, 2.2]];
    const r = rng(23);
    return groups.map(([n, op, dur, rad], i) => {
      if (op < 0.02) return '';
      let dots = '';
      for (let k = 0; k < n; k++) {
        const x = (r() * VW).toFixed(0), y = Math.round(r() * H), rr = (rad * (0.6 + r() * 0.7)).toFixed(1);
        dots += `<circle cx="${x}" cy="${y}" r="${rr}"/><circle cx="${x}" cy="${y - H}" r="${rr}"/>`;
      }
      return `<g class="snow-sway" style="animation-duration:${4 + i * 1.5}s"><g class="snow-fall${color ? ' embers' : ''}" style="animation-duration:${dur}s" fill="${color || '#ffffff'}" opacity="${f2(op * 0.9)}">${dots}</g></g>`;
    }).join('');
  }

  /* ---------- Themes ---------- */

  // Palette pieces shared by the themes with plain daylight and no weather.
  const CLEAR = { stars: 0, aurora: 0, snowA: 0, snowB: 0, snowC: 0, moonY: 44, moonOp: 0, snowLine: 1.2, treeSnow: 0, patch: 0, clouds: 0 };

  const THEMES = {};

  /* --- Arctic: the office's North Pole walk (unchanged) --- */
  THEMES.arctic = {
    walker: 'elf',
    fracs: { canada: 0.16, edmonton: 0.26, north60: 0.39, arctic: 0.52 },
    palette(t, k) {
      const dusk = (k.edmonton + k.north60) / 2;           // sunset halfway through Alberta
      const night = k.north60 + 0.06;                       // full dark soon after the 60th parallel
      const sunset = smooth(k.canada, k.north60 - 0.02, t); // 0 by day, 1 once the sun is down
      return {
        skyTop: ramp([[0, '#4a9be0'], [k.canada, '#4f8fd2'], [dusk, '#3a3a78'], [night, '#0d1a3c'], [1, '#070f28']], t),
        skyMid: ramp([[0, '#9ccff2'], [k.canada, '#cfaebb'], [dusk, '#9a4f7e'], [night, '#182a55'], [1, '#111f45']], t),
        skyBot: ramp([[0, '#dcf0fb'], [k.canada, '#f6c988'], [dusk, '#f08a58'], [night, '#30416e'], [1, '#213460']], t),
        rock: ramp([[0, '#8d7a66'], [k.edmonton, '#7f7078'], [night, '#4b5679'], [1, '#3a4869']], t),
        rockBack: ramp([[0, '#a5978a'], [k.edmonton, '#9a8f9c'], [night, '#5a6688'], [1, '#475579']], t),
        hillBack: ramp([[0, '#c9ad52'], [k.canada, '#c6b878'], [k.north60, '#e4e9ee'], [1, '#cfd9eb']], t),
        hillFront: ramp([[0, '#6f9d49'], [k.canada, '#8aa75b'], [k.north60, '#eef2f6'], [1, '#dbe4f1']], t),
        grass: ramp([[0, '#86b457'], [k.canada, '#9bb35a'], [k.edmonton, '#b9c290'], [k.north60, '#eaf0f5'], [1, '#e3ebf6']], t),
        path: ramp([[0, '#c9a46f'], [k.canada, '#cbb48f'], [k.north60, '#dfe6ee'], [1, '#d4ddea']], t),
        tree: ramp([[0, '#2f6e3b'], [k.north60, '#2b6140'], [1, '#1f3f44']], t),
        snowLine: lerp(0.26, 1.05, smooth(0.02, k.north60, t)),
        treeSnow: smooth(k.canada, dusk, t),
        patch: smooth(k.canada, k.edmonton, t),
        stars: smooth(dusk, night, t),
        aurora: smooth(k.edmonton - 0.03, k.edmonton + 0.04, t) * 0.18
          + smooth(k.north60 - 0.02, k.north60 + 0.08, t) * 0.32
          + smooth(k.arctic - 0.02, k.arctic + 0.04, t) * 0.5,
        sunY: lerp(48, 150, sunset),
        sunOp: 1 - smooth(k.north60 - 0.05, k.north60, t),
        sunColor: ramp(SUN, sunset),
        moonY: lerp(130, 44, smooth(k.north60 - 0.02, k.north60 + 0.12, t)),
        moonOp: smooth(k.north60 - 0.03, k.north60 + 0.05, t),
        snowA: smooth(k.canada, k.canada + 0.06, t),
        snowB: smooth(k.edmonton, k.north60, t),
        snowC: smooth(k.arctic - 0.03, k.arctic + 0.05, t),
        clouds: 0,
      };
    },
    // Sagebrush through Utah and Idaho, pines through Montana, thick boreal forest across
    // Alberta, thinning taiga in the Northwest Territories, bare tundra and sea ice past the
    // Arctic Circle, a few decorated trees around the workshop. (Fractions of 3,381 miles.)
    forest: [[-500 / 3381, 65 / 3381, 0.2], [65 / 3381, 242 / 3381, 0.3], [242 / 3381, 548 / 3381, 0.6], [548 / 3381, 1309 / 3381, 1],
      [1309 / 3381, 1600 / 3381, 0.55], [1600 / 3381, 1900 / 3381, 0.25], [3290 / 3381, 3372 / 3381, 0.35], [3420 / 3381, 3800 / 3381, 0.15]],
    brush: (marks) => (marks.canada != null ? Math.min(marks.canada, 242) : 242),
    patches: true,
    midBehind({ marks, mx }) { return marks.volcano != null ? volcano(mx(marks.volcano - 6)) : ''; },
    midHills({ marks, mx, x1, r }) {
      let out = '';
      const iceFrom = marks.coast != null ? marks.coast : marks.arctic;
      if (iceFrom != null) {
        for (let x = mx(iceFrom) + 20; x < x1; x += 60 + r() * 80) {
          out += `<use href="#${id('berg')}" transform="translate(${x.toFixed(0)} ${HORIZON + 8}) scale(${(0.8 + r() * 0.8).toFixed(2)})"/>`;
        }
      }
      return out;
    },
    midFront({ marks, mx }) {
      let out = '';
      if (marks.lake != null) {
        const lx = mx(marks.lake);
        out += `<g transform="translate(${lx.toFixed(0)} ${HORIZON + 9})">
          <ellipse rx="170" ry="9" fill="#8fbfe6"/><ellipse rx="170" ry="9" fill="none" stroke="#dcefff" stroke-width="2"/>
          <ellipse cx="-60" cy="1" rx="34" ry="3.5" fill="#e4f2fb"/><ellipse cx="70" cy="-1" rx="26" ry="3" fill="#e4f2fb"/>
        </g>`;
      }
      if (marks.finish != null) {
        const v = mx(marks.finish);
        out += house(v - 60, HORIZON + 8, 26, 16, '#b35b4a', '#4e7a5a', true);
        out += house(v - 31, HORIZON + 10, 34, 20, '#d9c29a', '#8a3b30', true);
        out += house(v - 5, HORIZON + 8, 22, 15, '#4e7a5a', '#b35b4a', true);
        out += house(v + 20, HORIZON + 10, 30, 18, '#8a3b30', '#4e7a5a', true);
      }
      return out;
    },
    nearBehind({ marks, nx, x1, r }) {
      let out = '';
      const driftFrom = marks.north60 != null ? marks.north60 : marks.arctic;
      const seaIceFrom = marks.coast != null ? marks.coast : marks.arctic;
      if (driftFrom != null) {
        for (let x = nx(driftFrom); x < x1; x += 47 + r() * 90) {
          const ice = seaIceFrom != null && x >= nx(seaIceFrom) - 60 && r() < 0.55;
          const y = r() < 0.5 ? SIGN_BASE - 2 : 264 + Math.round(r() * 8);
          out += `<use href="#${id(ice ? 'ice' : 'mound')}" transform="translate(${x.toFixed(0)} ${y}) scale(${(y > 240 ? 0.5 : 0.8 + r() * 0.6).toFixed(2)})"/>`;
        }
      }
      if (marks.finish != null) {
        const fx = nx(marks.finish);
        out += house(fx - 99, SIGN_BASE, 76, 34, '#b35b4a', '#4e7a5a', true);
        out += `<g transform="translate(${(fx - 99).toFixed(0)} ${SIGN_BASE})"><rect x="-26" y="-54" width="8" height="18" fill="#6b4320"/><circle cx="-22" cy="-62" r="7" fill="#c9c6d2" opacity="0.6"/></g>`;
        out += house(fx - 34, SIGN_BASE, 34, 24, '#d9c29a', '#8a3b30', true);
        out += lights(fx - 143, SIGN_BASE - 58, fx - 24, SIGN_BASE - 36, 22);
      }
      return out;
    },
    nearFront({ marks, nx }) {
      let out = '';
      if (marks.arctic != null) out += polarBear(nx(marks.arctic + 75));
      if (marks.volcano != null) out += penguin(nx(marks.volcano + 44), 250, 0.75, false) + penguin(nx(marks.volcano + 56), 250, 0.6, false);
      if (marks.finish != null) {
        const f = marks.finish;
        out += `<g transform="translate(${nx(f + 42).toFixed(0)} ${SIGN_BASE})"><ellipse rx="12" ry="4" fill="#fbfbf7"/><rect x="-5" y="-72" width="10" height="72" rx="3" fill="${ref('candy')}"/><rect x="-5" y="-72" width="10" height="72" rx="3" fill="none" stroke="#7b2f22" stroke-width="1"/><circle cy="-77" r="7" fill="#e2b04c" stroke="#b98624" stroke-width="1"/></g>`;
        out += arch(nx(f));
        out += penguin(nx(f) - 43, 256, 0.7, false) + penguin(nx(f) - 13, 254, 0.7, true) + penguin(nx(f) + 43, 258, 0.8, true);
      }
      return out;
    },
  };

  /* --- Oz: yellow bricks from the blue Munchkin farms to the green city --- */
  THEMES.oz = {
    walker: 'hiker',
    path: 'bricks',
    hillAmp: 0.8,
    farScale: 0.6,
    palette(t) {
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#5aa6e8'], [0.75, '#4fa6c9'], [1, '#3f9c8a']], t),
        skyMid: ramp([[0, '#a8d6f5'], [0.75, '#a9dcd0'], [1, '#8fd8b8']], t),
        skyBot: ramp([[0, '#e6f3fb'], [1, '#d6f2e4']], t),
        rock: ramp([[0, '#7f93b8'], [1, '#4f8f7a']], t),
        rockBack: ramp([[0, '#a3b3cf'], [1, '#7fb3a0']], t),
        hillBack: ramp([[0, '#9fcb6a'], [0.6, '#8ec56a'], [1, '#5fb584']], t),
        hillFront: ramp([[0, '#79b24e'], [1, '#4fa36c']], t),
        grass: ramp([[0, '#8dc45a'], [1, '#63b878']], t),
        path: ramp([[0, '#f0c93e'], [1, '#f2cf4a']], t),
        tree: '#3f8a3c',
        leaf: ramp([[0, '#59a73e'], [1, '#3f9a6a']], t),
        sunY: 54, sunOp: 1, sunColor: '#fff1b8',
        clouds: 0.6,
      });
    },
    forest: [[0.14, 0.3, 0.9, 'round'], [0.3, 0.42, 0.4, 'round'], [0.5, 0.62, 0.5, 'round'], [0.78, 0.9, 0.6, 'round']],
    sky(c, VW) {
      // The Wizard's hot-air balloon drifting over the city at journey's end
      return `<g opacity="${f2(smooth(0.8, 1, c.t))}" transform="translate(${(VW * 0.3).toFixed(0)} 60)">
        <ellipse rx="16" ry="19" fill="#c9553d"/><path d="M-16 0 a16 19 0 0 1 32 0" fill="#e2b04c" opacity="0.6"/>
        <path d="M-9 16 L-5 30 M9 16 L5 30" stroke="#5a3415" stroke-width="1.2"/><rect x="-7" y="30" width="14" height="8" rx="2" fill="#8b5a2b"/>
      </g>`;
    },
    midBehind({ marks, mx }) {
      let out = '';
      if (marks.finish != null) {
        // The Emerald City: a cluster of green towers behind the gates
        const v = mx(marks.finish);
        out += `<g transform="translate(${v.toFixed(0)} ${HORIZON + 2})">
          <ellipse cx="0" cy="-70" rx="120" ry="80" fill="${ref('emglow')}"/>
          ${[[-70, 60, 18], [-44, 96, 22], [-14, 130, 26], [18, 110, 22], [46, 84, 18], [72, 56, 16]].map(([x, h, w]) => `
            <rect x="${x - w / 2}" y="${-h}" width="${w}" height="${h}" rx="3" fill="#2f9a6a"/>
            <path d="M${x - w / 2 - 2} ${-h} q${w / 2 + 2} -${w * 0.9} ${w + 4} 0z" fill="#56c08e"/>
            <path d="M${x} ${-h - w * 0.45} v-14" stroke="#e2b04c" stroke-width="2"/>
            ${[0.2, 0.45, 0.7].map((k) => `<rect x="${x - 3}" y="${-h * k - 4}" width="6" height="8" rx="1" fill="#d9ffe8" opacity="0.8"/>`).join('')}
          `).join('')}
        </g>`;
      }
      return out;
    },
    midFront({ marks, mx }) {
      // Blue Munchkin cottages near the start
      let out = '';
      if (marks.start != null) {
        const s = mx(marks.start);
        out += cottage(s - 70, HORIZON + 8, 26, 16, '#6fa6e8', '#2b5fa8', false) + cottage(s - 36, HORIZON + 10, 20, 14, '#8fbdf0', '#2b5fa8', false) + cottage(s + 8, HORIZON + 8, 24, 15, '#6fa6e8', '#2b5fa8', false);
      }
      return out;
    },
    nearBehind({ marks, nx, r }) {
      let out = '';
      if (marks.corn != null) {
        for (let x = nx(marks.corn) - 170; x < nx(marks.corn) + 120; x += 11 + r() * 6) {
          out += `<use href="#${id('corn')}" transform="translate(${x.toFixed(0)} ${SIGN_BASE - 2 - Math.round(r() * 5)}) scale(${(0.8 + r() * 0.4).toFixed(2)})"/>`;
        }
        // The Scarecrow on his pole
        const sx = nx(marks.corn) - 60;
        out += `<g transform="translate(${sx.toFixed(0)} ${SIGN_BASE})">
          <rect x="-2" y="-62" width="4" height="62" fill="#8b5a2b"/><rect x="-22" y="-50" width="44" height="4" fill="#8b5a2b"/>
          <path d="M-12 -48 h24 v24 h-24z" fill="#3b6ea8"/><path d="M-22 -48 h10 v6 h-10z M12 -48 h10 v6 h-10z" fill="#3b6ea8"/>
          <path d="M-14 -46 l-10 2 M14 -46 l10 2" stroke="#e2b04c" stroke-width="2"/>
          <circle cy="-58" r="9" fill="#ead9a8"/><circle cx="-3" cy="-60" r="1.3" fill="#2b241f"/><circle cx="3" cy="-60" r="1.3" fill="#2b241f"/><path d="M-3 -55 q3 2 6 0" stroke="#2b241f" stroke-width="1" fill="none"/>
          <path d="M-14 -66 h28 l-6 -3 h-16z" fill="#8b5a2b"/><path d="M-6 -69 h12 v-7 h-12z" fill="#8b5a2b"/>
        </g>`;
      }
      if (marks.poppies != null) {
        for (let x = nx(marks.poppies) - 190; x < nx(marks.poppies) + 110; x += 7 + r() * 8) {
          const front = r() < 0.5;
          out += `<use href="#${id('poppy')}" transform="translate(${x.toFixed(0)} ${front ? 262 + Math.round(r() * 12) : SIGN_BASE - Math.round(r() * 8)}) scale(${(front ? 0.7 : 1).toFixed(2)})"/>`;
        }
      }
      if (marks.finish != null) {
        // The city gates and wall, with the gatekeeper's green spectacles hanging up
        const g = nx(marks.finish) - 70;
        out += wall(g - 160, g - 24, SIGN_BASE, 54, '#3fa876');
        out += `<g transform="translate(${g.toFixed(0)} ${SIGN_BASE})">
          <rect x="-24" y="-84" width="48" height="84" rx="4" fill="#2f9a6a"/>
          <path d="M-14 0 v-48 a14 14 0 0 1 28 0 v48z" fill="#1b5a40"/>
          <path d="M-14 0 v-48 a14 14 0 0 1 28 0 v48" fill="none" stroke="#e2b04c" stroke-width="2.5"/>
          <rect x="-28" y="-90" width="56" height="8" fill="#56c08e"/>
          <g fill="#8ff2b8"><rect x="-26" y="-98" width="7" height="9"/><rect x="-10" y="-98" width="7" height="9"/><rect x="6" y="-98" width="7" height="9"/><rect x="20" y="-98" width="7" height="9"/></g>
        </g>`;
        out += wall(g + 24, g + 150, SIGN_BASE, 54, '#3fa876');
      }
      return out;
    },
    nearFront({ marks, nx }) {
      return marks.finish != null ? finishBanner(nx(marks.finish), 'EMERALD CITY', '#2f9a6a') : '';
    },
  };

  /* --- Neverland: London night, then the clouds, then the island at morning --- */
  THEMES.neverland = {
    walker: 'hiker',
    hillAmp: 0.9,
    farScale: 0.7,
    fracs: { rooftops: 0.09, clouds: 0.23, sea: 0.4, lagoon: 0.52 },
    palette(t, k) {
      const night = 1 - smooth(k.clouds, k.sea, t);          // 1 in London, 0 once morning comes
      const sea = smooth(k.sea - 0.04, k.sea + 0.04, t);        // land becomes island
      const cloud = smooth(k.rooftops, k.clouds, t) * (1 - sea); // walking on clouds in between
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#0b1636'], [k.clouds, '#1d2a5e'], [k.sea - 0.02, '#f08a58'], [k.sea + 0.1, '#4a9be0'], [1, '#3f9fd8']], t),
        skyMid: ramp([[0, '#182a55'], [k.clouds, '#4a4a88'], [k.sea - 0.02, '#f6b980'], [k.sea + 0.1, '#9ccff2'], [1, '#a9dcf0']], t),
        skyBot: ramp([[0, '#30416e'], [k.clouds, '#8a6aa0'], [k.sea - 0.02, '#ffd9a0'], [k.sea + 0.1, '#dcf0fb'], [1, '#e2f4fb']], t),
        rock: ramp([[0, '#2a3454'], [k.clouds, '#ffffff'], [k.sea, '#6f9d7a'], [1, '#5f8f6a']], t),
        rockBack: ramp([[0, '#3a4468'], [k.clouds, '#ffffff'], [k.sea, '#9fc3a8'], [1, '#8fb89a']], t),
        hillBack: ramp([[0, '#3a4468'], [k.rooftops, '#4a5478'], [k.clouds, '#f3f6fb'], [k.sea, '#8fc46a'], [1, '#7fbf6a']], t),
        hillFront: ramp([[0, '#2a3050'], [k.rooftops, '#38405f'], [k.clouds, '#ffffff'], [k.sea, '#6fb24e'], [1, '#62ad52']], t),
        grass: ramp([[0, '#3b4a5a'], [k.rooftops, '#5a6578'], [k.clouds, '#f6f8fc'], [k.sea, '#e8d9a8'], [1, '#e6d6a4']], t),
        path: ramp([[0, '#6a6f7c'], [k.rooftops, '#8a8f9c'], [k.clouds, '#e6ecf7'], [k.sea, '#d8c48c'], [1, '#d6c38a']], t),
        tree: '#2b6140',
        leaf: '#3f9a4c',
        stars: night,
        sunY: lerp(170, 60, smooth(k.sea - 0.03, k.sea + 0.12, t)),
        sunOp: smooth(k.sea - 0.05, k.sea, t),
        sunColor: ramp([[0, '#ff9b4c'], [1, '#fff1b8']], smooth(k.sea, k.sea + 0.15, t)),
        moonY: 44, moonOp: night,
        clouds: Math.max(cloud, smooth(k.rooftops, k.clouds, t) * 0.5),
        sea: sea > 0.02 ? ramp([[0, '#f6b980'], [1, '#3aa0d8']], smooth(k.sea, k.sea + 0.1, t)) : null,
        seaFar: '#2f8fc9',
        patch: 0,
      });
    },
    forest: [[0.46, 0.6, 0.45, 'palm'], [0.62, 0.78, 0.9, 'round'], [0.8, 0.9, 0.5, 'palm'], [0.96, 1.08, 0.5, 'palm']],
    sky(c, VW) {
      // The second star to the right, big and bright, while it's still night
      return `<g opacity="${f2(c.stars)}" transform="translate(${(VW * 0.82).toFixed(0)} 42)">
        <circle r="18" fill="#fff6d6" opacity="0.18"/><circle r="9" fill="#fff6d6" opacity="0.3"/>
        <path d="M0 -10 L2.8 -2.8 L10 0 L2.8 2.8 L0 10 L-2.8 2.8 L-10 0 L-2.8 -2.8Z" fill="#fff6d6"/>
        <path d="M-34 6 L-32 2 L-28 0 L-32 -2 L-34 -6 L-36 -2 L-40 0 L-36 2Z" fill="#fff6d6" opacity="0.8"/>
      </g>`;
    },
    midFront({ marks, mx, r }) {
      let out = '';
      if (marks.start != null) {
        // London rooftops with chimneys and lit windows
        const s = mx(marks.start);
        for (let x = s - 260; x < s + 140; x += 38 + r() * 30) {
          const h = 26 + r() * 30, w = 30 + r() * 20;
          out += `<g transform="translate(${x.toFixed(0)} ${HORIZON + 8})">
            <rect x="${-w / 2}" y="${-h}" width="${w}" height="${h}" fill="#2f3550"/>
            <path d="M${-w / 2 - 3} ${-h} L0 ${-h - w * 0.35} L${w / 2 + 3} ${-h}Z" fill="#3b4262"/>
            <rect x="${w / 4}" y="${-h - w * 0.3 - 8}" width="6" height="14" fill="#2a2f45"/>
            <rect x="${-w / 2 + 5}" y="${-h + 8}" width="6" height="8" fill="#ffd76a" opacity="${r() < 0.6 ? 0.9 : 0}"/>
            <rect x="${w / 2 - 11}" y="${-h + 8}" width="6" height="8" fill="#ffd76a" opacity="${r() < 0.6 ? 0.9 : 0}"/>
          </g>`;
        }
      }
      if (marks.ship != null) {
        // The pirate ship at anchor, flying a black flag
        const v = mx(marks.ship) + 40;
        out += `<g transform="translate(${v.toFixed(0)} ${HORIZON - 2})">
          <path d="M-60 0 q10 -8 20 -10 h80 q14 2 22 -14 l-10 24z" fill="#5a3415"/>
          <path d="M-40 -10 h80 v-6 h-80z" fill="#7b4a21"/>
          <g fill="#e2b04c"><rect x="-30" y="-15" width="4" height="4"/><rect x="-14" y="-15" width="4" height="4"/><rect x="2" y="-15" width="4" height="4"/><rect x="18" y="-15" width="4" height="4"/></g>
          <rect x="-20" y="-80" width="3" height="70" fill="#4a3a2f"/><rect x="18" y="-66" width="3" height="56" fill="#4a3a2f"/>
          <path d="M-18 -74 q22 10 0 34z" fill="#efe6cf"/><path d="M-18 -40 q26 8 0 26z" fill="#efe6cf"/>
          <path d="M20 -60 q18 8 0 28z" fill="#efe6cf"/>
          <path d="M-20 -80 h16 l-4 4 l4 4 h-16z" fill="#2b241f"/>
        </g>`;
      }
      return out;
    },
    nearBehind({ marks, nx, r }) {
      let out = '';
      if (marks.lagoon != null) {
        // Marooners' Rock out in the lagoon, and a mermaid's tail flicking
        const l = nx(marks.lagoon) + 80;
        out += `<g transform="translate(${l.toFixed(0)} ${SIGN_BASE - 6})">
          <path d="M-30 0 L-18 -22 L-4 -16 L10 -30 L24 -8 L32 0Z" fill="#6b6f7c"/><path d="M-4 -16 L10 -30 L24 -8 L8 -4Z" fill="#8a8f99"/>
          <path d="M-56 -2 q6 -14 14 -6 q-3 -10 6 -10 q-4 8 -8 14z" fill="#3f9a8a"/>
        </g>`;
      }
      if (marks.finish != null) {
        // Hangman's tree with the hollow door, Peter's lookout above
        const f = nx(marks.finish) - 70;
        out += `<g transform="translate(${f.toFixed(0)} ${SIGN_BASE})">
          <path d="M-12 0 q-4 -40 0 -80 h24 q4 40 0 80z" fill="#6b4320"/>
          <circle cx="0" cy="-96" r="34" fill="#3f9a4c"/><circle cx="-26" cy="-80" r="22" fill="#3f9a4c"/><circle cx="28" cy="-82" r="24" fill="#3f9a4c"/><circle cx="-8" cy="-112" r="16" fill="#56b05c" opacity="0.6"/>
          <path d="M-7 0 v-22 a7 7 0 0 1 14 0 v22z" fill="#2b241f"/>
          <rect x="-16" y="-62" width="32" height="5" fill="#8b5a2b"/>
          ${lights(-22, -62, 22, -62, 8)}
        </g>`;
      }
      return out;
    },
    nearFront({ marks, nx }) {
      return marks.finish != null ? finishBanner(nx(marks.finish), 'NEVERLAND', '#3b6ea8') : '';
    },
  };

  /* --- Camelot: green England, castles and a sword in a lake --- */
  THEMES.camelot = {
    walker: 'hiker',
    hillAmp: 1.1,
    farScale: 0.5,
    fracs: { wood: 0.22, lake: 0.35, tor: 0.85 },
    palette(t, k) {
      const gold = smooth(0.8, 1, t); // a golden evening as Camelot comes into view
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#6fb0e8'], [0.5, '#7fb3d8'], [0.8, '#8fb4d0'], [1, '#c98c6a']], t),
        skyMid: ramp([[0, '#b9dcf5'], [0.5, '#c0d8e8'], [1, '#f0c48a']], t),
        skyBot: ramp([[0, '#e8f3fb'], [0.5, '#e4edf3'], [1, '#ffe2b0']], t),
        rock: ramp([[0, '#7f8fa0'], [1, '#8a7a7a']], t),
        rockBack: ramp([[0, '#a6b4c2'], [1, '#b39a92']], t),
        hillBack: ramp([[0, '#9cc26a'], [0.8, '#95bd66'], [1, '#c4b45a']], t),
        hillFront: ramp([[0, '#6ea84c'], [0.8, '#6aa44a'], [1, '#9aa84a']], t),
        grass: ramp([[0, '#7fb757'], [0.8, '#7ab254'], [1, '#a9b15a']], t),
        path: ramp([[0, '#c9ae7a'], [1, '#d4b47e']], t),
        tree: '#2f6e3b',
        leaf: ramp([[0, '#3f8a3c'], [1, '#6f8a3c']], t),
        sunY: lerp(56, 150, gold), sunOp: 1, sunColor: ramp(SUN, gold),
        clouds: 0.5 * (1 - gold),
      });
    },
    forest: [[0.16, 0.3, 0.8, 'round'], [0.4, 0.56, 1, 'round'], [0.6, 0.68, 0.4, 'round'], [0.72, 0.8, 0.35, 'round'], [0.92, 0.99, 0.3, 'round']],
    midBehind({ marks, mx }) {
      let out = '';
      if (marks.start != null) {
        // Sea cliffs and the ruin at Tintagel, behind the start
        const s = mx(marks.start);
        out += `<rect x="${(s - 500).toFixed(0)}" y="${HORIZON - 20}" width="440" height="36" fill="#3aa0d8"/>
          <path d="M${(s - 80).toFixed(0)} ${HORIZON + 10} v-56 l30 -8 l30 10 l20 -6 v60z" fill="#6b6f7c"/>
          <rect x="${(s - 56).toFixed(0)}" y="${HORIZON - 70}" width="18" height="24" fill="#8a8f99"/><rect x="${(s - 56).toFixed(0)}" y="${HORIZON - 74}" width="4" height="5" fill="#8a8f99"/><rect x="${(s - 44).toFixed(0)}" y="${HORIZON - 74}" width="4" height="5" fill="#8a8f99"/>`;
      }
      if (marks.tor != null) {
        // Glastonbury Tor: a lone hill with a tower on top
        const g = mx(marks.tor);
        out += `<path d="M${(g - 130).toFixed(0)} ${HORIZON + 10} q130 -120 260 0z" fill="#7fb257"/>
          <rect x="${(g - 7).toFixed(0)}" y="${HORIZON - 96}" width="14" height="40" fill="#8a8f99"/><rect x="${(g - 9).toFixed(0)}" y="${HORIZON - 100}" width="18" height="5" fill="#6b6f7c"/>`;
      }
      if (marks.finish != null) {
        // Camelot on its hill: towers, walls and pennants
        const v = mx(marks.finish);
        out += `<path d="M${(v - 150).toFixed(0)} ${HORIZON + 10} q150 -70 300 0z" fill="#8fbd5f"/>`;
        out += wall(v - 70, v + 70, HORIZON - 36, 30, '#c9c6d2');
        out += tower(v - 74, HORIZON - 36, 22, 56, '#d8d6e0', '#3b6ea8', '#c9553d') + tower(v + 74, HORIZON - 36, 22, 56, '#d8d6e0', '#3b6ea8', '#e2b04c');
        out += tower(v - 30, HORIZON - 56, 18, 60, '#e6e4ec', '#3b6ea8', '#e2b04c') + tower(v + 30, HORIZON - 56, 18, 60, '#e6e4ec', '#3b6ea8', '#c9553d');
        out += tower(v, HORIZON - 64, 26, 86, '#efeef4', '#2b5fa8', '#e2b04c');
      }
      return out;
    },
    midFront({ marks, mx }) {
      let out = '';
      if (marks.lake != null) {
        // The Lake, and an arm in white samite holding Excalibur aloft
        const l = mx(marks.lake) + 30;
        out += `<g transform="translate(${l.toFixed(0)} ${HORIZON + 9})">
          <ellipse rx="150" ry="9" fill="#5f9fd8"/><ellipse rx="150" ry="9" fill="none" stroke="#dcefff" stroke-width="2"/>
          <path d="M-20 2 q10 -4 20 0 M50 1 q10 -4 20 0 M-90 1 q10 -4 20 0" fill="none" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M0 0 v-20" stroke="#efe6cf" stroke-width="6" stroke-linecap="round"/>
          <path d="M0 -24 v-34" stroke="#c9c6d2" stroke-width="3" stroke-linecap="round"/><path d="M-8 -26 h16" stroke="#e2b04c" stroke-width="3"/>
          <path d="M0 -58 l-3 4 h6z" fill="#fbfbf7"/>
        </g>`;
      }
      if (marks.castle != null) {
        const c = mx(marks.castle) - 20;
        out += wall(c - 30, c + 30, HORIZON + 6, 20, '#9a8f8a') + tower(c - 32, HORIZON + 6, 14, 34, '#b3a8a2', '#6b5f54') + tower(c + 32, HORIZON + 6, 14, 34, '#b3a8a2', '#6b5f54');
      }
      return out;
    },
    nearBehind({ marks, nx, r, x0, x1 }) {
      let out = '';
      // Sheep on the hillsides
      for (let x = x0; x < x1; x += 160 + r() * 420) {
        out += `<use href="#${id('sheep')}" transform="translate(${x.toFixed(0)} ${SIGN_BASE - Math.round(r() * 6)}) scale(${(0.8 + r() * 0.4).toFixed(2)})"/>`;
      }
      if (marks.wood != null) {
        // A ring of standing stones near Merlin's wood
        const s = nx(marks.wood) - 90;
        out += `<g fill="#8a8f99">${[-40, -24, -8, 8, 24, 40].map((x, i) => `<rect x="${s + x - 5}" y="${SIGN_BASE - 22 - (i % 2) * 6}" width="10" height="${22 + (i % 2) * 6}" rx="2"/>`).join('')}<rect x="${s - 14}" y="${SIGN_BASE - 32}" width="28" height="6" rx="1"/></g>`;
      }
      if (marks.finish != null) {
        // Camelot's gatehouse right by the trail
        const g = nx(marks.finish) - 72;
        out += wall(g - 150, g - 26, SIGN_BASE, 50, '#d8d6e0');
        out += `<g transform="translate(${g.toFixed(0)} ${SIGN_BASE})">
          <rect x="-26" y="-92" width="52" height="92" fill="#e6e4ec"/>
          ${[-22, -8, 6, 20].map((x) => `<rect x="${x}" y="-98" width="7" height="8" fill="#e6e4ec"/>`).join('')}
          <path d="M-14 0 v-44 a14 14 0 0 1 28 0 v44z" fill="#2b241f"/>
          <path d="M-14 0 v-44 a14 14 0 0 1 28 0 v44" fill="none" stroke="#8b5a2b" stroke-width="2"/>
          <path d="M-10 -40 v40 M-3 -46 v46 M4 -46 v46 M11 -40 v40 M-14 -30 h28 M-14 -16 h28" stroke="#6b5f54" stroke-width="1.2"/>
          <rect x="-3" y="-72" width="6" height="10" rx="1" fill="#2b241f"/>
          <path d="M-20 -100 v-14 l12 4 l-12 4z" fill="#c9553d"/><path d="M20 -100 v-14 l-12 4 l12 4z" fill="#e2b04c"/>
          <path d="M-20 -100 v-14 M20 -100 v-14" stroke="#4a3a2f" stroke-width="1.5"/>
        </g>`;
        out += wall(g + 26, g + 150, SIGN_BASE, 50, '#d8d6e0');
      }
      return out;
    },
    nearFront({ marks, nx }) {
      return marks.finish != null ? finishBanner(nx(marks.finish), 'CAMELOT', '#8a2f22') : '';
    },
  };

  /* --- Atlantis: a causeway across a bright sea to a sunken temple --- */
  THEMES.atlantis = {
    walker: 'hiker',
    hillAmp: 0.25,
    farScale: 0.35,
    palette(t) {
      const deep = smooth(0.6, 1, t);
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#3f94dc'], [0.6, '#2f7fc9'], [1, '#2a4f8a']], t),
        skyMid: ramp([[0, '#9fd2f2'], [0.6, '#8fc6ea'], [1, '#6f9fc8']], t),
        skyBot: ramp([[0, '#e2f3fb'], [0.6, '#d8eef9'], [1, '#b7d4e8']], t),
        rock: ramp([[0, '#7fa0b4'], [1, '#5f7f9a']], t),
        rockBack: ramp([[0, '#a9c4d2'], [1, '#8aa4b8']], t),
        hillBack: ramp([[0, '#d9cfa0'], [0.6, '#cfd3a8'], [1, '#9fc9b8']], t),
        hillFront: ramp([[0, '#e8dcac'], [0.6, '#dcdcae'], [1, '#aedbc8']], t),
        grass: ramp([[0, '#e9dfb2'], [0.6, '#e2ddb0'], [1, '#bfe3d2']], t),
        path: ramp([[0, '#d9c48c'], [1, '#c8d6c0']], t),
        tree: '#3f8a6a',
        leaf: '#4fa070',
        sunY: lerp(50, 70, deep), sunOp: 1 - deep * 0.3, sunColor: '#fff1b8',
        clouds: 0.35,
        sea: ramp([[0, '#3aa0d8'], [0.6, '#2f93cf'], [1, '#2a7fb8']], t),
        seaFar: ramp([[0, '#2f8fc9'], [1, '#1f5f98']], t),
      });
    },
    forest: [[0.3, 0.4, 0.35, 'palm'], [0.56, 0.66, 0.3, 'palm'], [0.9, 1.05, 0.4, 'palm']],
    midBehind({ marks, mx, r, x0, x1 }) {
      let out = '';
      // Sails on the horizon
      for (let x = x0; x < x1; x += 300 + r() * 500) {
        out += `<g transform="translate(${x.toFixed(0)} ${HORIZON - 14}) scale(${(0.6 + r() * 0.6).toFixed(2)})"><path d="M-10 0 h22 l-3 4 h-16z" fill="#5a3415"/><path d="M0 0 v-22 l12 18z" fill="#fbfbf7"/><path d="M-1 -4 v-18 l-9 14z" fill="#efe6cf"/></g>`;
      }
      if (marks.isle != null) {
        const i = mx(marks.isle) - 40;
        out += `<path d="M${(i - 70).toFixed(0)} ${HORIZON + 6} q70 -40 140 0z" fill="#cfbf86"/>
          <g fill="#f3e9c8">${[-24, -8, 8, 24].map((x) => `<rect x="${i + x - 3}" y="${HORIZON - 44}" width="6" height="30"/>`).join('')}</g>
          <rect x="${(i - 30).toFixed(0)}" y="${HORIZON - 48}" width="60" height="5" fill="#b98624"/>`;
      }
      if (marks.finish != null) {
        // Atlantis rising: the Temple of Poseidon and its gilded roofs
        const v = mx(marks.finish);
        out += `<path d="M${(v - 220).toFixed(0)} ${HORIZON + 8} q220 -60 440 0z" fill="#8fc9b4"/>`;
        out += `<g transform="translate(${v.toFixed(0)} ${HORIZON + 2})">
          <ellipse cx="0" cy="-60" rx="140" ry="70" fill="${ref('glow')}"/>
          <rect x="-90" y="-50" width="180" height="50" fill="#e7f0ea"/>
          <g fill="#f8fbf6">${[-78, -60, -42, -24, -6, 12, 30, 48, 66].map((x) => `<rect x="${x - 4}" y="-100" width="8" height="52"/>`).join('')}</g>
          <path d="M-96 -100 L0 -138 L96 -100Z" fill="#e2b04c"/><path d="M-96 -100 h192 v6 h-192z" fill="#f8fbf6"/>
          <path d="M-30 -138 q30 -34 60 0z" fill="#e2b04c"/><path d="M0 -162 v-16 M-6 -170 h12" stroke="#e2b04c" stroke-width="3"/>
          <path d="M-6 -176 q6 -8 12 0 M0 -176 v-10 M-6 -178 v-8 M6 -178 v-8" stroke="#e2b04c" stroke-width="2.5" fill="none"/>
          <g fill="#f8fbf6"><rect x="-130" y="-70" width="24" height="70"/><rect x="106" y="-70" width="24" height="70"/></g>
          <path d="M-134 -70 q16 -16 32 0z M102 -70 q16 -16 32 0z" fill="#e2b04c"/>
        </g>`;
      }
      return out;
    },
    nearBehind({ marks, nx, r, x0, x1 }) {
      let out = '';
      if (marks.start != null) {
        // The Pillars of Heracles flanking the start
        const s = nx(marks.start) - 70;
        out += `<g fill="#d8d6e0"><rect x="${s - 56}" y="${SIGN_BASE - 90}" width="16" height="90" rx="2"/><rect x="${s - 62}" y="${SIGN_BASE - 98}" width="28" height="9"/><rect x="${s + 40}" y="${SIGN_BASE - 90}" width="16" height="90" rx="2"/><rect x="${s + 34}" y="${SIGN_BASE - 98}" width="28" height="9"/></g>`;
      }
      // Shallow water pools and coral along the causeway
      for (let x = x0; x < x1; x += 90 + r() * 160) {
        out += `<ellipse cx="${x.toFixed(0)}" cy="${266 + Math.round(r() * 8)}" rx="${(22 + r() * 30).toFixed(0)}" ry="4" fill="#7fd0f0" opacity="0.7"/>`;
      }
      if (marks.shallows != null) {
        for (let x = nx(marks.shallows) - 160; x < nx(marks.shallows) + 120; x += 16 + r() * 22) {
          out += `<use href="#${id('coral')}" transform="translate(${x.toFixed(0)} ${(r() < 0.5 ? SIGN_BASE - 3 : 270).toFixed(0)}) scale(${(0.6 + r() * 0.6).toFixed(2)})"/>`;
        }
      }
      if (marks.rings != null) {
        // The ring walls, one behind another
        const q = nx(marks.rings) + 30;
        out += wall(q - 70, q + 70, SIGN_BASE - 6, 28, '#cfd6cf');
        out += `<rect x="${q - 10}" y="${SIGN_BASE - 34}" width="20" height="28" fill="#2a7fb8"/>`;
      }
      if (marks.finish != null) {
        const f = nx(marks.finish) - 70;
        out += `<g fill="#f3f6f3">${[-150, -118, -86].map((x) => `<rect x="${f + x - 5}" y="${SIGN_BASE - 70}" width="10" height="70"/><rect x="${f + x - 8}" y="${SIGN_BASE - 76}" width="16" height="7"/>`).join('')}</g>`;
        out += `<g fill="#f3f6f3">${[86, 118, 150].map((x) => `<rect x="${f + x - 5}" y="${SIGN_BASE - 70}" width="10" height="70"/><rect x="${f + x - 8}" y="${SIGN_BASE - 76}" width="16" height="7"/>`).join('')}</g>`;
        out += `<path d="M${f - 160} ${SIGN_BASE - 76} h86 v-6 h-86z M${f + 74} ${SIGN_BASE - 76} h86 v-6 h-86z" fill="#e2b04c"/>`;
      }
      return out;
    },
    nearFront({ marks, nx }) {
      let out = '';
      if (marks.dolphins != null) {
        const d = nx(marks.dolphins) + 60;
        out += `<g transform="translate(${d.toFixed(0)} 272)"><path d="M-20 0 q10 -26 30 -8 q-6 -4 -10 2 q-6 -10 -20 6z" fill="#5f7f9a"/><path d="M8 -12 l6 -8 l2 10z" fill="#5f7f9a"/></g>`;
      }
      if (marks.finish != null) out += finishBanner(nx(marks.finish), 'ATLANTIS', '#2a7fb8');
      return out;
    },
  };

  /* --- The Dark Mountain: green dales to ash plains to fire --- */
  THEMES.volcano = {
    walker: 'hiker',
    fracs: { wood: 0.19, pass: 0.3, lake: 0.53, marsh: 0.65, ash: 0.77, fires: 0.88 },
    palette(t, k) {
      const dark = smooth(k.marsh, k.fires, t);
      const fire = smooth(k.ash, 1, t);
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#5aa6e8'], [k.pass, '#7fa0c8'], [k.marsh, '#5a5f78'], [k.ash, '#3a2f3a'], [1, '#2a1418']], t),
        skyMid: ramp([[0, '#a8d6f5'], [k.pass, '#b9c6d8'], [k.marsh, '#8a8a9a'], [k.ash, '#6a4a48'], [1, '#8a3a2a']], t),
        skyBot: ramp([[0, '#e6f3fb'], [k.pass, '#e4e9ee'], [k.marsh, '#b9b4b8'], [k.ash, '#a0766a'], [1, '#ff8a4c']], t),
        rock: ramp([[0, '#7f8fa0'], [k.pass, '#8a8f99'], [k.ash, '#4a4042'], [1, '#3a2a2a']], t),
        rockBack: ramp([[0, '#a6b4c2'], [k.pass, '#b0b4bd'], [k.ash, '#6a6064'], [1, '#5a4040']], t),
        hillBack: ramp([[0, '#9cc26a'], [k.wood, '#7faa5a'], [k.pass, '#9aa8a0'], [k.lake, '#8aa06a'], [k.marsh, '#6f7f5a'], [k.ash, '#7a7470'], [1, '#4a3a38']], t),
        hillFront: ramp([[0, '#6ea84c'], [k.wood, '#5f8f44'], [k.pass, '#8c9a90'], [k.lake, '#6f8f52'], [k.marsh, '#5a6a48'], [k.ash, '#6a6460'], [1, '#3a2c2a']], t),
        grass: ramp([[0, '#7fb757'], [k.wood, '#6f9f4c'], [k.pass, '#b9c2c8'], [k.lake, '#7fa85a'], [k.marsh, '#6a7a4e'], [k.ash, '#8a8580'], [1, '#4a3c38']], t),
        path: ramp([[0, '#c9ae7a'], [k.pass, '#d4d8de'], [k.lake, '#c2a878'], [k.marsh, '#7b5a3a'], [k.ash, '#6a6260'], [1, '#3a3030']], t),
        tree: ramp([[0, '#2f6e3b'], [k.wood, '#1f4a30'], [k.marsh, '#2a3a2a'], [1, '#1a1a1a']], t),
        leaf: ramp([[0, '#3f8a3c'], [k.marsh, '#4a5a3a'], [1, '#3a3a2a']], t),
        snowLine: lerp(1.2, 0.3, smooth(k.wood, k.pass, t) * (1 - smooth(k.pass, k.lake, t))),
        treeSnow: smooth(k.wood, k.pass, t) * (1 - smooth(k.pass, k.lake, t)),
        patch: smooth(k.wood + 0.04, k.pass, t) * (1 - smooth(k.pass, k.lake, t)),
        stars: dark * 0.8,
        sunY: lerp(54, 160, smooth(k.lake, k.marsh, t)), sunOp: 1 - smooth(k.lake, k.marsh, t), sunColor: ramp(SUN, smooth(k.lake, k.marsh, t)),
        moonY: 50, moonOp: dark * (1 - fire * 0.6),
        snowA: smooth(k.pass - 0.04, k.pass + 0.02, t) * (1 - smooth(k.pass + 0.04, k.lake, t)),
        snowB: 0,
        snowC: fire, // embers
        clouds: smooth(k.lake, k.marsh, t) * 0.5 * (1 - fire),
        embers: fire > 0.02,
      });
    },
    forest: [[0.04, 0.16, 0.6, 'round'], [0.17, 0.28, 1, 'pine'], [0.36, 0.5, 0.55, 'pine'], [0.56, 0.64, 0.35, 'round'], [0.68, 0.78, 0.3, 'dead'], [0.8, 0.95, 0.15, 'dead']],
    midBehind({ marks, mx }) {
      let out = '';
      if (marks.finish != null) out += volcano(mx(marks.finish) + 20, true);
      return out;
    },
    midFront({ marks, mx, r }) {
      let out = '';
      if (marks.start != null) {
        const s = mx(marks.start);
        out += cottage(s - 60, HORIZON + 8, 26, 16, '#d9c29a', '#8a3b30', true) + cottage(s - 26, HORIZON + 10, 22, 14, '#e6d7b4', '#6b5f54', true) + cottage(s + 10, HORIZON + 8, 24, 15, '#d9c29a', '#5a3415', true);
      }
      if (marks.inn != null) {
        const i = mx(marks.inn) - 20;
        out += cottage(i, HORIZON + 8, 46, 24, '#8b5a2b', '#5a3415', true) + `<g transform="translate(${(i + 28).toFixed(0)} ${HORIZON - 10})"><rect x="-1" y="0" width="2" height="18" fill="#4a3a2f"/><rect x="-10" y="0" width="20" height="9" rx="1" fill="#e2b04c"/></g>`;
      }
      if (marks.lake != null) {
        const l = mx(marks.lake) + 30;
        out += `<g transform="translate(${l.toFixed(0)} ${HORIZON + 9})"><ellipse rx="150" ry="9" fill="#7fa8d0"/><ellipse rx="150" ry="9" fill="none" stroke="#dcefff" stroke-width="1.5"/><ellipse cx="-30" cy="1" rx="60" ry="3" fill="#aacbe8" opacity="0.7"/></g>`;
      }
      if (marks.fires != null) {
        const w = mx(marks.fires);
        for (const dx of [-120, -40, 50, 130]) out += `<use href="#${id('fire')}" transform="translate(${(w + dx).toFixed(0)} ${HORIZON + 4}) scale(0.9)"/><circle cx="${(w + dx).toFixed(0)}" cy="${HORIZON - 6}" r="18" fill="${ref('glow')}"/>`;
      }
      return out;
    },
    nearBehind({ marks, nx, r }) {
      let out = '';
      if (marks.river != null) {
        // The ferry at Dunmere: a raft on a river crossing the trail
        const f = nx(marks.river);
        out += `<rect x="${f - 44}" y="${HORIZON}" width="88" height="70" fill="#6f9fd0"/><path d="M${f - 30} 240 q8 -3 16 0 M${f + 6} 232 q8 -3 16 0" stroke="#dcefff" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <g transform="translate(${f} 252)"><rect x="-26" y="-6" width="52" height="7" rx="2" fill="#8b5a2b"/><path d="M-20 -6 v4 M-8 -6 v4 M4 -6 v4 M16 -6 v4" stroke="#5a3415" stroke-width="1.5"/><path d="M14 -6 l10 -34" stroke="#5a3415" stroke-width="2.5" stroke-linecap="round"/></g>`;
      }
      if (marks.marsh != null) {
        for (let x = nx(marks.marsh) - 170; x < nx(marks.marsh) + 120; x += 14 + r() * 20) {
          out += `<use href="#${id('reed')}" transform="translate(${x.toFixed(0)} ${(r() < 0.5 ? SIGN_BASE - 2 : 268).toFixed(0)})"/>`;
        }
        for (const dx of [-110, -40, 30, 90]) out += `<circle class="star-tw" cx="${(nx(marks.marsh) + dx).toFixed(0)}" cy="${(SIGN_BASE - 30 - (dx % 17)).toFixed(0)}" r="4" fill="#9ff0c8"/>`;
      }
      if (marks.ash != null) {
        for (let x = nx(marks.ash) - 160; x < nx(marks.ash) + 140; x += 30 + r() * 50) {
          out += `<use href="#${id('thistle')}" transform="translate(${x.toFixed(0)} ${(r() < 0.5 ? SIGN_BASE - 2 : 268).toFixed(0)})"/>`;
        }
      }
      if (marks.gate != null) {
        // Two black pillars and a lintel over the trail
        const g = nx(marks.gate) + 60;
        out += `<g fill="#1a1416"><rect x="${g - 60}" y="${SIGN_BASE - 110}" width="20" height="110" rx="2"/><rect x="${g + 40}" y="${SIGN_BASE - 110}" width="20" height="110" rx="2"/><rect x="${g - 68}" y="${SIGN_BASE - 122}" width="136" height="14" rx="2"/></g>
          <path d="M${g - 50} ${SIGN_BASE - 80} v-10 M${g + 50} ${SIGN_BASE - 80} v-10" stroke="#ff7a2c" stroke-width="3"/>`;
      }
      if (marks.finish != null) {
        // Lava rocks around the summit and glowing cracks
        const f = nx(marks.finish);
        for (const [dx, s] of [[-120, 1.2], [-70, 0.8], [60, 1], [120, 1.3]]) out += `<use href="#${id('rock')}" transform="translate(${(f + dx).toFixed(0)} ${SIGN_BASE}) scale(${s})" style="filter:brightness(0.45)"/>`;
        out += `<path d="M${f - 90} 262 q20 -4 40 2 M${f + 30} 268 q24 -6 50 0" stroke="#ff7a2c" stroke-width="2.5" fill="none" stroke-linecap="round" class="lava-glow"/>`;
      }
      return out;
    },
    nearFront({ marks, nx }) {
      return marks.finish != null ? finishBanner(nx(marks.finish), 'DARK MOUNTAIN', '#3a1a1a') : '';
    },
  };

  /* --- Camino: Pyrenees, vineyards, the golden meseta, green Galicia --- */
  THEMES.camino = {
    walker: 'hiker',
    fracs: { vines: 0.2, meseta: 0.36, galicia: 0.79 },
    palette(t, k) {
      const meseta = smooth(k.vines + 0.04, k.meseta, t) * (1 - smooth(k.galicia - 0.1, k.galicia, t));
      const galicia = smooth(k.galicia - 0.08, k.galicia, t);
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#5aa6e8'], [k.meseta, '#4f9fe0'], [k.galicia - 0.1, '#5aa6e8'], [k.galicia, '#8fa8bc'], [1, '#6f9bc8']], t),
        skyMid: ramp([[0, '#a8d6f5'], [k.meseta, '#bfe0f4'], [k.galicia, '#c8d3dc'], [1, '#b7d2ea']], t),
        skyBot: ramp([[0, '#e6f3fb'], [k.meseta, '#fff0cf'], [k.galicia, '#e6ecf0'], [1, '#e2f0fb']], t),
        rock: ramp([[0, '#7f8fa0'], [k.meseta, '#b89a6a'], [k.galicia, '#6f8a7a']], t),
        rockBack: ramp([[0, '#a6b4c2'], [k.meseta, '#d4bb8a'], [k.galicia, '#9fb8aa']], t),
        hillBack: ramp([[0, '#9cc26a'], [k.vines, '#a8c06a'], [k.meseta, '#e2c76a'], [k.galicia - 0.1, '#d8c070'], [k.galicia, '#8fbf6a'], [1, '#7fb862']], t),
        hillFront: ramp([[0, '#6ea84c'], [k.vines, '#86a84c'], [k.meseta, '#d4b45a'], [k.galicia - 0.1, '#c9ac56'], [k.galicia, '#5fa34a'], [1, '#56a04e']], t),
        grass: ramp([[0, '#7fb757'], [k.vines, '#98b45a'], [k.meseta, '#dcc06a'], [k.galicia - 0.1, '#d2b862'], [k.galicia, '#6fb257'], [1, '#68ad56']], t),
        path: ramp([[0, '#c9a46f'], [k.meseta, '#d9b57a'], [k.galicia, '#b89a6f']], t),
        tree: '#2f6e3b',
        leaf: ramp([[0, '#3f8a3c'], [k.meseta, '#7f9a3c'], [k.galicia, '#3f8a5a']], t),
        snowLine: lerp(0.35, 1.2, smooth(0.02, 0.12, t)),
        sunY: lerp(60, 40, meseta), sunOp: 1 - galicia * 0.5, sunColor: '#fff1b8',
        clouds: Math.max(0.25, galicia * 0.9),
      });
    },
    forest: [[0.0, 0.08, 0.7, 'pine'], [0.09, 0.19, 0.45, 'round'], [0.22, 0.3, 0.25, 'round'], [0.56, 0.62, 0.3, 'round'], [0.7, 0.78, 0.5, 'round'], [0.8, 0.96, 0.9, 'round']],
    midFront({ marks, mx, r }) {
      let out = '';
      if (marks.meseta != null) {
        // Burgos: the cathedral's spires on the plain
        const b = mx(marks.meseta) - 10;
        out += `<g transform="translate(${b.toFixed(0)} ${HORIZON + 6})"><rect x="-30" y="-36" width="60" height="36" fill="#d9c9a0"/><path d="M-20 -36 v-30 l5 -14 l5 14 v30z M10 -36 v-30 l5 -14 l5 14 v30z" fill="#d9c9a0"/><rect x="-6" y="-56" width="12" height="20" fill="#d9c9a0"/><path d="M-6 -56 l6 -10 l6 10z" fill="#b89a6f"/><path d="M-4 0 v-16 a4 4 0 0 1 8 0 v16z" fill="#6b5f54"/></g>`;
        // Sunflowers across the meseta
        for (let x = mx(marks.meseta) - 60; x < mx(marks.meseta) + 300; x += 9 + r() * 7) {
          out += `<g transform="translate(${x.toFixed(0)} ${HORIZON + 6 + Math.round(r() * 4)})"><path d="M0 0 v-9" stroke="#5f8f3a" stroke-width="1.2"/><circle cy="-11" r="3" fill="#f2c230"/><circle cy="-11" r="1.4" fill="#5a3415"/></g>`;
        }
      }
      if (marks.castle != null) {
        const c = mx(marks.castle) - 10;
        out += wall(c - 34, c + 34, HORIZON + 6, 22, '#b3a494') + tower(c - 36, HORIZON + 6, 14, 36, '#c9bca8', '#8a7a6a') + tower(c + 36, HORIZON + 6, 14, 36, '#c9bca8', '#8a7a6a') + tower(c, HORIZON + 6, 12, 42, '#c9bca8', '#8a7a6a', '#fbfbf7');
      }
      if (marks.galicia != null) {
        // Pallozas: round thatched huts on O Cebreiro
        const g = mx(marks.galicia);
        for (const [dx, s] of [[-50, 1], [-10, 0.8], [30, 1.1]]) out += `<g transform="translate(${(g + dx).toFixed(0)} ${HORIZON + 8}) scale(${s})"><rect x="-16" y="-14" width="32" height="14" fill="#8a8f99"/><path d="M-20 -14 q20 -26 40 0z" fill="#b89a6f"/><rect x="-3" y="-10" width="6" height="10" fill="#4a3a2f"/></g>`;
      }
      if (marks.finish != null) {
        // Santiago's cathedral: two baroque towers and the central façade
        const v = mx(marks.finish);
        out += `<g transform="translate(${v.toFixed(0)} ${HORIZON + 4})">
          <rect x="-70" y="-60" width="140" height="60" fill="#c9bca8"/>
          <rect x="-72" y="-124" width="30" height="64" fill="#d9ccb6"/><rect x="42" y="-124" width="30" height="64" fill="#d9ccb6"/>
          <path d="M-72 -124 h30 l-6 -12 h-18z M42 -124 h30 l-6 -12 h-18z" fill="#b3a494"/>
          <path d="M-57 -136 v-14 M57 -136 v-14" stroke="#b3a494" stroke-width="4"/><path d="M-62 -146 h10 M52 -146 h10" stroke="#b3a494" stroke-width="3"/>
          <rect x="-26" y="-98" width="52" height="38" fill="#d9ccb6"/><path d="M-30 -98 h60 l-30 -22z" fill="#b3a494"/>
          <circle cy="-78" r="9" fill="#6b5f54"/><circle cy="-78" r="6" fill="#e2b04c"/>
          ${[-60, -46, 46, 60].map((x) => `<rect x="${x - 3}" y="-112" width="6" height="12" rx="3" fill="#6b5f54"/>`).join('')}
          <path d="M-12 0 v-30 a12 12 0 0 1 24 0 v30z" fill="#6b5f54"/>
          <path d="M-70 -60 h140" stroke="#b3a494" stroke-width="3"/>
        </g>`;
      }
      return out;
    },
    nearBehind({ marks, nx, r, x0, x1 }) {
      let out = '';
      if (marks.vines != null) {
        for (let x = nx(marks.vines) - 190; x < nx(marks.vines) + 150; x += 24) {
          out += `<use href="#${id('vine')}" transform="translate(${x.toFixed(0)} ${SIGN_BASE - 2})"/><use href="#${id('vine')}" transform="translate(${(x + 12).toFixed(0)} 270) scale(0.7)"/>`;
        }
      }
      // Camino waymarkers: a stone post with a yellow arrow and a shell, every so often
      for (let x = x0 + 60; x < x1; x += 260 + r() * 300) {
        out += `<g transform="translate(${x.toFixed(0)} ${SIGN_BASE})"><rect x="-5" y="-22" width="10" height="22" rx="1" fill="#b3a494"/><path d="M-3 -17 h4 l-1.5 -2 M1 -17 l-1.5 2" stroke="#f2c230" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M-3 -8 q3 -5 6 0 M-2 -8 l2 -4 l2 4" stroke="#f2c230" stroke-width="1" fill="none"/></g>`;
      }
      if (marks.finish != null) {
        // The square in front of the cathedral, with its arcade
        const f = nx(marks.finish) - 70;
        out += `<g fill="#d9ccb6">${[-150, -118, -86, 86, 118, 150].map((x) => `<rect x="${f + x - 5}" y="${SIGN_BASE - 56}" width="10" height="56"/>`).join('')}<rect x="${f - 160}" y="${SIGN_BASE - 62}" width="86" height="8"/><rect x="${f + 74}" y="${SIGN_BASE - 62}" width="86" height="8"/></g>`;
        out += `<path d="M${f - 150} ${SIGN_BASE - 56} q16 -16 32 0 q16 -16 32 0 M${f + 86} ${SIGN_BASE - 56} q16 -16 32 0 q16 -16 32 0" fill="none" stroke="#b3a494" stroke-width="3"/>`;
      }
      return out;
    },
    nearFront({ marks, nx }) {
      return marks.finish != null ? finishBanner(nx(marks.finish), 'SANTIAGO', '#8a2f22') : '';
    },
  };

  /* --- Appalachian: green ridges turning to autumn, ending on a rocky summit --- */
  THEMES.appalachian = {
    walker: 'hiker',
    hillAmp: 1.3,
    farScale: 1.1,
    fracs: { autumn: 0.73, whites: 0.85, wilderness: 0.95 },
    palette(t, k) {
      const fall = smooth(k.autumn - 0.12, k.autumn + 0.05, t);
      const late = smooth(k.whites, 1, t);
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#5aa6e8'], [k.autumn, '#4f9bd8'], [1, '#6f9fc8']], t),
        skyMid: ramp([[0, '#a8d6f5'], [k.autumn, '#b9dcf0'], [1, '#c8d8e6']], t),
        skyBot: ramp([[0, '#e6f3fb'], [k.autumn, '#f6e8d4'], [1, '#e6edf2']], t),
        rock: ramp([[0, '#5f7fa8'], [k.autumn, '#7a6f8a'], [1, '#6a7080']], t),
        rockBack: ramp([[0, '#8fa8c8'], [k.autumn, '#a8a0b8'], [1, '#98a0b0']], t),
        hillBack: ramp([[0, '#6fa05a'], [k.autumn, '#c9924a'], [1, '#a88a6a']], t),
        hillFront: ramp([[0, '#4f8a44'], [k.autumn, '#b36a3a'], [1, '#8a7a5a']], t),
        grass: ramp([[0, '#5f9a4a'], [k.autumn, '#a88a3a'], [1, '#8f8a6a']], t),
        path: ramp([[0, '#a8865a'], [1, '#9a8a7a']], t),
        tree: ramp([[0, '#2f6e3b'], [1, '#2b5a40']], t),
        leaf: ramp([[0, '#3f8a3c'], [k.autumn - 0.12, '#4f9a3c'], [k.autumn, '#e0812e'], [k.whites, '#c9553d'], [1, '#8a6a4a']], t),
        snowLine: lerp(1.2, 0.5, late),
        treeSnow: late * 0.4,
        patch: late * 0.6,
        sunY: lerp(54, 80, late), sunOp: 1, sunColor: ramp([[0, '#fff1b8'], [1, '#ffd86e']], late),
        clouds: 0.3 + late * 0.4,
        fall,
      });
    },
    forest: [[-0.1, 0.09, 1, 'round'], [0.09, 0.14, 0.8, 'pine'], [0.14, 0.4, 1, 'round'], [0.4, 0.46, 0.9, 'round'], [0.47, 0.6, 1, 'round'], [0.6, 0.7, 0.9, 'round'],
      [0.7, 0.84, 1, 'round'], [0.84, 0.88, 0.7, 'pine'], [0.88, 0.97, 0.9, 'pine'], [0.97, 0.995, 0.3, 'pine'], [1.03, 1.2, 0.5, 'pine']],
    midBehind({ marks, mx }) {
      let out = '';
      if (marks.finish != null) {
        // Katahdin's rocky summit
        const v = mx(marks.finish);
        out += `<path d="M${(v - 260).toFixed(0)} ${HORIZON + 10} L${(v - 120).toFixed(0)} ${HORIZON - 70} L${(v - 40).toFixed(0)} ${HORIZON - 96} L${(v + 30).toFixed(0)} ${HORIZON - 104} L${(v + 120).toFixed(0)} ${HORIZON - 60} L${(v + 260).toFixed(0)} ${HORIZON + 10}Z" fill="#6a7080"/>
          <path d="M${(v - 40).toFixed(0)} ${HORIZON - 96} L${(v + 30).toFixed(0)} ${HORIZON - 104} L${(v + 60).toFixed(0)} ${HORIZON - 74} L${(v - 10).toFixed(0)} ${HORIZON - 70}Z" fill="#8a909c"/>`;
      }
      if (marks.whites != null) {
        const w = mx(marks.whites);
        out += `<path d="M${(w - 150).toFixed(0)} ${HORIZON + 10} L${(w - 30).toFixed(0)} ${HORIZON - 80} L${(w + 30).toFixed(0)} ${HORIZON - 64} L${(w + 150).toFixed(0)} ${HORIZON + 10}Z" fill="#7a8090"/><rect x="${(w - 34).toFixed(0)}" y="${HORIZON - 96}" width="6" height="18" fill="#4a3a2f"/><rect x="${(w - 44).toFixed(0)}" y="${HORIZON - 90}" width="26" height="10" fill="#c9bca8"/>`;
      }
      return out;
    },
    midFront({ marks, mx }) {
      let out = '';
      if (marks.shenandoah != null) {
        // A trail shelter (lean-to)
        const s = mx(marks.shenandoah) - 30;
        out += `<g transform="translate(${s.toFixed(0)} ${HORIZON + 8})"><path d="M-22 0 v-22 l44 -8 v30z" fill="#6b4320"/><path d="M-26 -22 l48 -9 l4 6 l-50 9z" fill="#4a3a2f"/><rect x="-18" y="-12" width="18" height="12" fill="#2b241f"/></g>`;
      }
      return out;
    },
    nearBehind({ marks, nx, r, x0, x1 }) {
      let out = '';
      // White blazes on posts along the way
      for (let x = x0 + 40; x < x1; x += 240 + r() * 320) {
        out += `<g transform="translate(${x.toFixed(0)} ${SIGN_BASE})"><rect x="-3" y="-30" width="6" height="30" fill="#6b4320"/><rect x="-2.5" y="-26" width="5" height="9" fill="#fbfbf7"/></g>`;
      }
      // Rocks and ferns
      for (let x = x0; x < x1; x += 70 + r() * 120) {
        out += `<use href="#${id('rock')}" transform="translate(${x.toFixed(0)} ${(r() < 0.5 ? SIGN_BASE - 1 : 268).toFixed(0)}) scale(${(0.5 + r() * 0.7).toFixed(2)})"/>`;
      }
      if (marks.rocks != null) {
        for (let x = nx(marks.rocks) - 160; x < nx(marks.rocks) + 120; x += 14 + r() * 10) {
          out += `<use href="#${id('rock')}" transform="translate(${x.toFixed(0)} ${(r() < 0.5 ? SIGN_BASE - 2 : 266 + r() * 6).toFixed(0)}) scale(${(0.4 + r() * 0.5).toFixed(2)})"/>`;
        }
      }
      if (marks.finish != null) {
        // The summit cairn and boulders
        const f = nx(marks.finish) - 60;
        out += `<g fill="#8a909c"><path d="M${f - 150} ${SIGN_BASE} l14 -30 l24 -6 l20 26 l10 10z"/><path d="M${f + 70} ${SIGN_BASE} l10 -22 l30 -10 l26 32z"/></g>
          <g transform="translate(${f.toFixed(0)} ${SIGN_BASE})" fill="#9aa0ac"><ellipse cy="-4" rx="18" ry="5"/><ellipse cy="-12" rx="14" ry="5"/><ellipse cy="-20" rx="11" ry="4.5"/><ellipse cy="-27" rx="8" ry="4"/><ellipse cy="-33" rx="5" ry="3.5"/></g>`;
      }
      return out;
    },
    nearFront({ marks, nx }) {
      if (marks.shenandoah != null) {
        return blackBear(nx(marks.shenandoah) + 70) + (marks.finish != null ? finishBanner(nx(marks.finish), 'KATAHDIN', '#5a3415') : '');
      }
      return marks.finish != null ? finishBanner(nx(marks.finish), 'KATAHDIN', '#5a3415') : '';
    },
  };

  /* --- Road: any real place to any other; plain countryside with a town at each end --- */
  THEMES.road = {
    walker: 'hiker',
    hillAmp: 1,
    farScale: 0.7,
    palette(t) {
      const evening = smooth(0.85, 1, t);
      return Object.assign({}, CLEAR, {
        skyTop: ramp([[0, '#5aa6e8'], [0.85, '#5a9fe0'], [1, '#c98c6a']], t),
        skyMid: ramp([[0, '#a8d6f5'], [0.85, '#b0d4ee'], [1, '#f0c48a']], t),
        skyBot: ramp([[0, '#e6f3fb'], [1, '#ffe2b0']], t),
        rock: '#7f8fa0', rockBack: '#a6b4c2',
        hillBack: ramp([[0, '#9cc26a'], [0.5, '#a9c46a'], [1, '#c4b45a']], t),
        hillFront: ramp([[0, '#6ea84c'], [0.5, '#78aa4e'], [1, '#9aa84a']], t),
        grass: ramp([[0, '#7fb757'], [0.5, '#8ab857'], [1, '#a9b15a']], t),
        path: '#c9a46f',
        tree: '#2f6e3b',
        leaf: ramp([[0, '#3f8a3c'], [1, '#6f8a3c']], t),
        sunY: lerp(56, 150, evening), sunOp: 1, sunColor: ramp(SUN, evening),
        clouds: 0.45,
      });
    },
    forest: [[0.04, 0.2, 0.6, 'round'], [0.22, 0.3, 0.9, 'pine'], [0.34, 0.48, 0.5, 'round'], [0.52, 0.6, 0.8, 'round'], [0.64, 0.78, 0.4, 'round'], [0.8, 0.9, 0.6, 'pine']],
    midFront({ marks, mx, J }) {
      let out = '';
      if (marks.start != null) {
        const s = mx(marks.start);
        out += cottage(s - 70, HORIZON + 8, 26, 16, '#d9c29a', '#8a3b30', false) + cottage(s - 36, HORIZON + 10, 22, 14, '#e6d7b4', '#6b5f54', false) + cottage(s + 4, HORIZON + 8, 24, 15, '#d9c29a', '#5a3415', false);
      }
      if (marks.finish != null) {
        const v = mx(marks.finish);
        out += cottage(v - 90, HORIZON + 8, 30, 18, '#e6d7b4', '#8a3b30', true) + cottage(v - 52, HORIZON + 10, 24, 16, '#d9c29a', '#6b5f54', true);
        out += `<g transform="translate(${(v - 14).toFixed(0)} ${HORIZON + 8})"><rect x="-14" y="-40" width="28" height="40" fill="#c9bca8"/><path d="M-18 -40 l18 -14 l18 14z" fill="#8a7a6a"/><rect x="-4" y="-62" width="8" height="12" fill="#c9bca8"/><path d="M-6 -62 l6 -8 l6 8z" fill="#8a7a6a"/><rect x="-4" y="-12" width="8" height="12" fill="#4a3a2f"/></g>`;
        out += cottage(v + 24, HORIZON + 8, 26, 16, '#d9c29a', '#8a3b30', true) + cottage(v + 58, HORIZON + 10, 30, 18, '#e6d7b4', '#5a3415', true);
      }
      return out;
    },
    nearBehind({ marks, nx, r, x0, x1 }) {
      let out = '';
      // Fence posts and the odd milestone along the road
      for (let x = x0 + 30; x < x1; x += 200 + r() * 260) {
        out += `<g transform="translate(${x.toFixed(0)} ${SIGN_BASE})"><rect x="-4" y="-18" width="8" height="18" rx="2" fill="#b3a494"/><rect x="-3" y="-15" width="6" height="3" fill="#2b241f" opacity="0.5"/></g>`;
      }
      for (let x = x0; x < x1; x += 60 + r() * 100) {
        out += `<use href="#${id(r() < 0.3 ? 'rock' : 'bush')}" transform="translate(${x.toFixed(0)} ${(r() < 0.5 ? SIGN_BASE - 1 : 266).toFixed(0)}) scale(${(0.5 + r() * 0.6).toFixed(2)})"/>`;
      }
      return out;
    },
    nearFront({ marks, nx, J }) {
      return marks.finish != null ? finishBanner(nx(marks.finish), (J.banner || J.end || 'FINISH').toUpperCase().slice(0, 14), '#2f7a3f') : '';
    },
  };

  /* ---------- Build, place, animate ---------- */

  function sceneMarks(J) {
    const marks = {};
    J.waypoints.forEach((wp) => { if (wp.scene) marks[wp.scene] = wp.mile; });
    return marks;
  }

  function themeFor(J) {
    return THEMES[J.theme] || THEMES.arctic;
  }

  // The full SVG for a journey at a given mile. VW is the viewBox width.
  function render(J, mile, VW, opts) {
    const theme = themeFor(J);
    const total = J.totalMiles;
    const t = clamp(mile / total, 0, 1);
    setWorld(J);
    const marks = sceneMarks(J);
    const k = {};
    for (const key in (theme.fracs || {})) k[key] = marks[key] != null ? marks[key] / total : theme.fracs[key];
    const c = theme.palette(t, k);
    c.t = t;
    const vars = `--tree:${c.tree};--leaf:${c.leaf || c.tree};--tree-snow:${f2(c.treeSnow || 0)};--patch:${f2(c.patch || 0)}`;
    const walker = theme.walker === 'hiker' ? hiker(VW / 2) : elf(VW / 2);
    const weather = opts.still ? '' : snowfall(VW, c, c.embers ? '#ffb347' : null);
    return `<svg class="scene-svg${opts.still ? ' still' : ''}" viewBox="0 0 ${VW} ${H}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${esc(opts.label || '')}" style="${vars}">
      ${defs(c)}
      ${sky(c, VW, theme)}
      <g class="layer" data-speed="${SPEED.far}">${farLayer(total, VW, c, theme)}</g>
      <g class="layer" data-speed="${SPEED.mid}">${midLayer(total, VW, c, J, marks, theme)}</g>
      <g class="layer" data-speed="${SPEED.near}">${nearLayer(total, VW, c, J, marks, clamp(mile, 0, total), theme)}</g>
      ${walker}
      ${weather}
    </svg>`;
  }

  function build(host, opts) {
    const J = opts.journey;
    const hostW = host.clientWidth || 358;
    const hostH = host.clientHeight || H;
    const VW = Math.round(hostW * H / hostH);
    UID = 'sc';
    host.innerHTML = render(J, opts.mile, VW, { label: opts.label });
    return VW;
  }

  function place(svg, VW, mile) {
    const layers = svg.querySelectorAll('.layer');
    for (let i = 0; i < layers.length; i++) {
      const s = Number(layers[i].getAttribute('data-speed'));
      layers[i].setAttribute('transform', `translate(${(VW / 2 - worldX(mile) * s).toFixed(2)} 0)`);
    }
    fadeSigns(svg, VW, mile);
  }

  // Once the web font has loaded, size each plank to its painted text and keep
  // the sign's right edge a fixed gap behind the walker.
  function fitPlanks(svg) {
    const signs = svg.querySelectorAll('.sign');
    for (let i = 0; i < signs.length; i++) {
      const g = signs[i];
      let maxW = 0;
      const planks = g.querySelectorAll('.plank');
      for (let k = 0; k < planks.length; k++) {
        const plank = planks[k];
        const text = plank.querySelector('text');
        let w = 0;
        try { w = text.getComputedTextLength(); } catch (e) { /* not laid out yet */ }
        if (!w) { maxW = 0; break; }
        const small = plank.classList.contains('plank-mi');
        const width = Math.max(small ? 34 : 44, Math.ceil(w + (small ? 12 : 20)));
        plank.querySelector('path').setAttribute('d', plankShape(width, small));
        if (!small) maxW = Math.max(maxW, width);
      }
      if (!maxW) continue;
      const x = signX(Number(g.getAttribute('data-mile')), maxW, g.getAttribute('data-passed') === '1');
      g.setAttribute('data-w', String(maxW));
      g.setAttribute('data-x', x.toFixed(1));
      g.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
    }
  }

  // Signs near the edge of the frame fade out instead of being cut in half.
  const FADE_EDGE = 44;
  function signOpacity(x, w, offset, VW) {
    const left = offset + x - w / 2 - 6, right = offset + x + w / 2 + 6;
    return clamp(Math.min((VW - right) / FADE_EDGE, left / FADE_EDGE), 0, 1);
  }
  function fadeSigns(svg, VW, mile) {
    const offset = VW / 2 - worldX(mile);
    const signs = svg.querySelectorAll('.sign');
    for (let i = 0; i < signs.length; i++) {
      const g = signs[i];
      const op = signOpacity(Number(g.getAttribute('data-x')), Number(g.getAttribute('data-w')), offset, VW);
      g.setAttribute('opacity', op.toFixed(2));
    }
  }

  let current = null;

  function mount(host, opts) {
    if (current && current.frame) cancelAnimationFrame(current.frame);
    host.classList.remove('arrived');
    const VW = build(host, opts);
    const svg = host.querySelector('svg');
    current = { host, opts, VW, frame: 0 };

    const total = opts.journey.totalMiles;
    const to = clamp(opts.mile, 0, total);
    // Walk in from a little way back (measured on screen, so it looks the same everywhere).
    let from = opts.fromMile == null ? mileAt(worldX(to) - 130) : clamp(opts.fromMile, 0, total);
    if (Math.abs(from - to) < 1) from = mileAt(worldX(to) - 60);
    from = Math.max(mileAt(-80), from);

    const finish = () => { current.frame = 0; if (opts.arrived) host.classList.add('arrived'); };

    fitPlanks(svg);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => { if (host.isConnected && host.querySelector('svg') === svg) fitPlanks(svg); });
    }

    if (reduceMotion() || opts.animate === false) { place(svg, VW, to); finish(); return; }

    place(svg, VW, from);
    const started = performance.now();
    const duration = 2000;
    const step = (now) => {
      const k = clamp((now - started) / duration, 0, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      place(svg, VW, from + (to - from) * eased);
      if (k < 1) current.frame = requestAnimationFrame(step); else finish();
    };
    current.frame = requestAnimationFrame(step);
  }

  // A still picture of a journey for the destination cards: the walker a little
  // way short of the finish, with the finish landmark in view. No animation.
  function thumbnail(J) {
    UID = 'th-' + String(J.id).replace(/[^a-z0-9]/gi, '');
    const VW = 720;
    setWorld(J);
    const mile = clamp(mileAt(worldX(J.totalMiles) - 150), 0, J.totalMiles);
    let svg = render(J, mile, VW, { still: true, label: '' });
    // Slide the layers into place, as mount() would, by baking the transforms in.
    svg = svg.replace(/<g class="layer" data-speed="([\d.]+)">/g, (m, s) => `<g class="layer" data-speed="${s}" transform="translate(${(VW / 2 - worldX(mile) * Number(s)).toFixed(2)} 0)">`);
    const offset = VW / 2 - worldX(mile);
    svg = svg.replace(/<g class="sign" data-mile="([^"]+)" data-passed="([^"]+)" data-w="([^"]+)" data-x="([^"]+)"/g,
      (m, mi, p, w, x) => `${m} opacity="${signOpacity(Number(x), Number(w), offset, VW).toFixed(2)}"`);
    UID = 'sc';
    return svg;
  }

  // Rebuild at the current spot if the scene's box changes size (rotation, desktop resize).
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (!current || !current.host.isConnected) return;
      const opts = Object.assign({}, current.opts, { animate: false });
      mount(current.host, opts);
    }, 150);
  });

  window.JourneyScene = { mount, thumbnail };
})();
