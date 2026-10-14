/* The storybook scene at the top of the Journey tab.
   A side-scrolling world drawn as inline SVG, with a cartoon elf in the middle.
   The world is built once per render; three parallax layers are slid to the
   team's mile. Colours, snow, stars and the northern lights blend with progress.
   Plain JavaScript, no libraries. app.js calls JourneyScene.mount(host, options). */

(function () {
  'use strict';

  const H = 280;                                  // scene height in SVG units
  const PPM = 1.8;                                // SVG units per mile (near layer)
  const MIN_SEG = 130;                            // least room between two neighbouring signposts
  const SPEED = { far: 0.22, mid: 0.5, near: 1 }; // parallax speeds
  const HORIZON = 214;                            // where the ground meets the sky
  const FEET = 238;                               // the elf's feet, on the path
  const SIGN_BASE = 226;                          // signposts stand just behind the path
  const SIGN_GAP = 26;                            // gap between a sign's right edge and the elf

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

  /* ---------- World geometry ----------
     Miles map to near-layer x almost linearly (PPM), except that the stretch between
     two neighbouring stops is never shorter than MIN_SEG, so signs that sit a few
     miles apart (Ogden, Logan, Idaho Falls) still get room of their own. The last
     stretch into the finish gets twice that, so the arch and Santa's workshop never
     crowd the last signpost. */

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

  /* ---------- Palettes ----------
     t runs from 0 at Layton to 1 at the Pole, but the seasons turn at real places:
     k.canada (the first Canadian stop), k.edmonton, k.north60 (the 60th parallel) and k.arctic
     (the Arctic Circle), each given as a fraction of the whole trail. */

  const SUN = [[0, '#fff1b8'], [0.6, '#ffd86e'], [1, '#ff9b4c']];

  function palette(t, k) {
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
      // Faint around Edmonton, growing through the Northwest Territories, bold past the Arctic Circle
      aurora: smooth(k.edmonton - 0.03, k.edmonton + 0.04, t) * 0.18
        + smooth(k.north60 - 0.02, k.north60 + 0.08, t) * 0.32
        + smooth(k.arctic - 0.02, k.arctic + 0.04, t) * 0.5,
      sunY: lerp(48, 150, sunset),
      sunOp: 1 - smooth(k.north60 - 0.05, k.north60, t),
      sunColor: ramp(SUN, sunset),
      moonY: lerp(130, 44, smooth(k.north60 - 0.02, k.north60 + 0.12, t)),
      moonOp: smooth(k.north60 - 0.03, k.north60 + 0.05, t),
      // Flurries from the Canadian border, heavier through Alberta, steady past the Arctic Circle
      snowA: smooth(k.canada, k.canada + 0.06, t),
      snowB: smooth(k.edmonton, k.north60, t),
      snowC: smooth(k.arctic - 0.03, k.arctic + 0.05, t),
    };
  }

  /* ---------- Shared shapes (defs) ---------- */

  function defs(c, VW) {
    return `<defs>
      <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${c.skyTop}"/><stop offset="0.45" stop-color="${c.skyMid}"/><stop offset="0.78" stop-color="${c.skyBot}"/>
      </linearGradient>
      <linearGradient id="sc-snowcap" gradientUnits="userSpaceOnUse" x1="0" y1="60" x2="0" y2="${HORIZON}">
        <stop offset="0" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="${c.snowLine.toFixed(3)}" stop-color="#ffffff" stop-opacity="0.95"/>
        <stop offset="${(c.snowLine + 0.09).toFixed(3)}" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sc-aur1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6fe3b4" stop-opacity="0"/><stop offset="0.35" stop-color="#6fe3b4" stop-opacity="0.8"/>
        <stop offset="0.72" stop-color="#b48cf0" stop-opacity="0.55"/><stop offset="1" stop-color="#b48cf0" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sc-aur2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#9ff0c8" stop-opacity="0"/><stop offset="0.4" stop-color="#8ad7ff" stop-opacity="0.6"/>
        <stop offset="0.75" stop-color="#c58cf5" stop-opacity="0.6"/><stop offset="1" stop-color="#c58cf5" stop-opacity="0"/>
      </linearGradient>
      <radialGradient id="sc-lava" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stop-color="#ff9a3c" stop-opacity="0.85"/><stop offset="0.5" stop-color="#ff6a2a" stop-opacity="0.4"/><stop offset="1" stop-color="#ff5a1f" stop-opacity="0"/>
      </radialGradient>
      <linearGradient id="sc-candy" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="9" y2="9" spreadMethod="repeat">
        <stop offset="0" stop-color="#fbfbf7"/><stop offset="0.5" stop-color="#fbfbf7"/><stop offset="0.5" stop-color="#c9553d"/><stop offset="1" stop-color="#c9553d"/>
      </linearGradient>
      <g id="sc-pine">
        <rect x="-2.5" y="-10" width="5" height="11" fill="#5a3415"/>
        <path d="M0 -24 L19 -1 L-19 -1Z" style="fill:var(--tree)"/>
        <path d="M0 -34 L16 -12 L-16 -12Z" style="fill:var(--tree)"/>
        <path d="M0 -45 L13 -24 L-13 -24Z" style="fill:var(--tree)"/>
        <g fill="#ffffff" style="opacity:var(--tree-snow)">
          <path d="M0 -24 L9 -12 L-9 -12Z"/><path d="M0 -34 L8 -23 L-8 -23Z"/><path d="M0 -45 L7 -34 L-7 -34Z"/>
        </g>
      </g>
      <g id="sc-bush" fill="#8aa06a"><ellipse rx="9" ry="6"/><ellipse cx="-7" cy="1" rx="6" ry="4.5"/><ellipse cx="7" cy="1" rx="6" ry="4.5"/></g>
      <g id="sc-rock" fill="#9b8c7c"><path d="M-10 0 L-6 -7 L3 -9 L10 -3 L8 0Z"/><path d="M-6 -7 L3 -9 L4 -3 L-4 -2Z" fill="#b3a494"/></g>
      <ellipse id="sc-patch" rx="16" ry="4.5" fill="#fbfdff" style="opacity:var(--patch)"/>
      <g id="sc-mound"><path d="M-24 0 Q0 -15 24 0Z" fill="#f8fbff"/><path d="M-24 0 Q0 -15 24 0" fill="none" stroke="#c3d4e8" stroke-width="1.2"/></g>
      <path id="sc-ice" d="M-14 0 L-10 -8 L6 -9 L14 0Z" fill="#d6ecf9" stroke="#9cc6e0" stroke-width="1"/>
      <g id="sc-berg"><path d="M-30 0 L-18 -22 L-6 -14 L8 -30 L22 -10 L32 0Z" fill="#e4f2fb"/><path d="M-6 -14 L8 -30 L22 -10 L10 -6Z" fill="#c6e1f2"/></g>
    </defs>`;
  }

  /* ---------- Sky ---------- */

  function sky(c, VW) {
    const r = rng(5);
    let stars = '';
    for (let i = 0; i < 46; i++) {
      const x = (r() * VW).toFixed(0), y = (8 + r() * 150).toFixed(0), rad = (0.7 + r() * 1).toFixed(1);
      const tw = i % 5 === 0 ? ` class="star-tw" style="animation-delay:${(-r() * 3).toFixed(1)}s"` : '';
      stars += `<circle cx="${x}" cy="${y}" r="${rad}"${tw}/>`;
    }
    const sx = (VW / 390).toFixed(3);
    return `
      <rect x="0" y="0" width="${VW}" height="${H}" fill="url(#sc-sky)"/>
      <g opacity="${c.sunOp.toFixed(2)}">
        <circle cx="${(VW * 0.76).toFixed(0)}" cy="${c.sunY.toFixed(0)}" r="34" fill="${c.sunColor}" opacity="0.28"/>
        <circle cx="${(VW * 0.76).toFixed(0)}" cy="${c.sunY.toFixed(0)}" r="17" fill="${c.sunColor}"/>
      </g>
      <g opacity="${c.moonOp.toFixed(2)}" transform="translate(${(VW * 0.2).toFixed(0)} ${c.moonY.toFixed(0)})">
        <circle r="26" fill="#fff6d6" opacity="0.14"/><circle r="14" fill="#fff6d6"/>
        <circle cx="-4" cy="-3" r="3" fill="#efe4c4"/><circle cx="5" cy="4" r="2" fill="#efe4c4"/><circle cx="2" cy="-7" r="1.5" fill="#efe4c4"/>
      </g>
      <g class="stars" fill="#fff4d6" opacity="${c.stars.toFixed(2)}">${stars}</g>
      <g class="aurora" opacity="${c.aurora.toFixed(2)}" transform="scale(${sx} 1)">
        <path class="ribbon r1" d="M-40 76 C 60 36, 130 100, 210 60 S 350 20, 430 66 L430 118 C 350 76, 260 142, 180 100 S 50 76, -40 128 Z" fill="url(#sc-aur1)"/>
        <path class="ribbon r2" d="M-40 42 C 90 12, 150 72, 240 32 S 360 2, 430 38 L430 80 C 350 48, 250 104, 160 68 S 60 42, -40 84 Z" fill="url(#sc-aur2)"/>
        <path class="ribbon r3" d="M-40 104 C 70 68, 170 130, 260 90 S 380 58, 430 100 L430 142 C 360 106, 240 172, 150 132 S 60 104, -40 150 Z" fill="url(#sc-aur1)"/>
      </g>`;
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

  function farLayer(total, VW, c) {
    const r = rng(7);
    const x0 = -VW * 2, x1 = worldX(total) * SPEED.far + VW * 2;
    const back = mountains(x0, x1, HORIZON + 8, 55, 100, r);
    const front = mountains(x0, x1, HORIZON + 4, 60, 140, r);
    return `<path d="${back}" fill="${c.rockBack}"/><path d="${back}" fill="url(#sc-snowcap)" opacity="0.8"/>
            <path d="${front}" fill="${c.rock}"/><path d="${front}" fill="url(#sc-snowcap)"/>`;
  }

  /* ---------- Mid layer: hills, forest, volcano, village ---------- */

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

  // Forest density by mile: sagebrush country through Utah and Idaho, pines through
  // Montana, thick boreal forest across Alberta, thinning taiga in the Northwest
  // Territories, bare tundra and sea ice past the Arctic Circle, a few decorated
  // trees around the workshop.
  const FOREST = [[-500, 65, 0.2], [65, 242, 0.3], [242, 548, 0.6], [548, 1309, 1], [1309, 1600, 0.55], [1600, 1900, 0.25], [3290, 3372, 0.35], [3420, 3800, 0.15]];

  function forest(r) {
    let out = '';
    for (const [a, b, density] of FOREST) {
      const xEnd = worldX(b) * SPEED.mid;
      for (let x = worldX(a) * SPEED.mid; x < xEnd; x += 9) {
        if (r() > density * 0.8) continue;
        const s = (0.7 + r() * 0.6).toFixed(2);
        const y = HORIZON + 2 + Math.round(r() * 6);
        out += `<use href="#sc-pine" transform="translate(${(x + r() * 7).toFixed(0)} ${y}) scale(${s})"/>`;
      }
    }
    return out;
  }

  function volcano(x) {
    return `<g transform="translate(${x.toFixed(0)} ${HORIZON + 6})">
      <ellipse class="lava-glow" cx="0" cy="-116" rx="80" ry="36" fill="url(#sc-lava)"/>
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

  function midLayer(total, VW, c, marks) {
    const r = rng(11);
    const x0 = -VW * 2, x1 = worldX(total) * SPEED.mid + VW * 2;
    const mx = (mile) => worldX(mile) * SPEED.mid;
    let out = `<path d="${hills(x0, x1, HORIZON, 48, r)}" fill="${c.hillBack}"/>`;
    if (marks.volcano != null) out += volcano(mx(marks.volcano - 6));
    out += `<path d="${hills(x0, x1, HORIZON + 4, 26, r)}" fill="${c.hillFront}"/>`;
    // Icebergs once the trail reaches the Arctic Ocean
    const iceFrom = marks.coast != null ? marks.coast : marks.arctic;
    if (iceFrom != null) {
      for (let x = mx(iceFrom) + 20; x < x1; x += 60 + r() * 80) {
        out += `<use href="#sc-berg" transform="translate(${x.toFixed(0)} ${HORIZON + 8}) scale(${(0.8 + r() * 0.8).toFixed(2)})"/>`;
      }
    }
    out += forest(r);
    // Great Slave Lake: a wide, half-frozen lake behind the trail
    if (marks.lake != null) {
      const lx = mx(marks.lake);
      out += `<g transform="translate(${lx.toFixed(0)} ${HORIZON + 9})">
        <ellipse rx="170" ry="9" fill="#8fbfe6"/><ellipse rx="170" ry="9" fill="none" stroke="#dcefff" stroke-width="2"/>
        <ellipse cx="-60" cy="1" rx="34" ry="3.5" fill="#e4f2fb"/><ellipse cx="70" cy="-1" rx="26" ry="3" fill="#e4f2fb"/>
        <path d="M-120 2 q10 -3 20 0 M20 3 q10 -3 20 0 M110 1 q10 -3 20 0" fill="none" stroke="#dcefff" stroke-width="1.5" stroke-linecap="round"/>
      </g>`;
    }
    // Santa's village behind the North Pole arch (placed in screen units around the finish)
    if (marks.finish != null) {
      const v = mx(marks.finish);
      out += house(v - 60, HORIZON + 8, 26, 16, '#b35b4a', '#4e7a5a', true);
      out += house(v - 31, HORIZON + 10, 34, 20, '#d9c29a', '#8a3b30', true);
      out += house(v - 5, HORIZON + 8, 22, 15, '#4e7a5a', '#b35b4a', true);
      out += house(v + 20, HORIZON + 10, 30, 18, '#8a3b30', '#4e7a5a', true);
    }
    return out;
  }

  /* ---------- Near layer: ground, signs, animals, workshop, arch ---------- */

  function plankShape(w, small) {
    const h = small ? 15 : 18;
    if (small) return `M${-w / 2} 0 H${w / 2} V${h} H${-w / 2} Z`;
    return `M${-w / 2} 0 H${w / 2 - 8} L${w / 2} ${h / 2} L${w / 2 - 8} ${h} H${-w / 2} Z`;
  }

  // Where a sign's post stands: passed signs end a fixed gap behind the elf,
  // upcoming signs begin a fixed gap ahead of it, so neither ever overlaps the elf.
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
    return `<g class="sign" data-mile="${wp.mile}" data-passed="${passed ? 1 : 0}" transform="translate(${x.toFixed(1)} 0)">
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
      <path d="M-62 0 V-90 A62 62 0 0 1 62 -90 V0" fill="none" stroke="url(#sc-candy)" stroke-width="11" stroke-linecap="round"/>
      <circle cx="-62" cy="-96" r="7" fill="#e2b04c" stroke="#b98624" stroke-width="1"/><circle cx="62" cy="-96" r="7" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
      ${lights(-56, -100, 56, -100, 26)}
      <path d="M0 -168 L3.2 -160 L11 -159 L5 -153 L7 -145 L0 -149 L-7 -145 L-5 -153 L-11 -159 L-3.2 -160Z" fill="#e2b04c" stroke="#b98624" stroke-width="1"/>
      <g class="finish-sign"><rect x="-46" y="-142" width="92" height="24" rx="4"/><text x="0" y="-125">NORTH POLE</text></g>
    </g>`;
  }

  function nearLayer(total, VW, c, J, marks, mile) {
    const r = rng(19);
    const x0 = -VW * 3, x1 = worldX(total) + VW * 3;
    const nx = (mile) => worldX(mile);
    let out = `<rect x="${x0}" y="${HORIZON}" width="${x1 - x0}" height="${H - HORIZON + 10}" fill="${c.grass}"/>
      <rect x="${x0}" y="${HORIZON}" width="${x1 - x0}" height="3" fill="rgba(0,0,0,0.06)"/>
      <rect x="${x0}" y="228" width="${x1 - x0}" height="24" rx="2" fill="${c.path}"/>
      <rect x="${x0}" y="228" width="${x1 - x0}" height="2" fill="rgba(0,0,0,0.07)"/>`;

    // Foothills: sagebrush and rocks through Utah and Idaho, up to the Montana line
    const brushEnd = nx(marks.canada != null ? Math.min(marks.canada, 242) : 242);
    for (let x = x0; x < brushEnd; x += 32 + r() * 54) {
      const front = r() < 0.4;
      const s = (front ? 0.5 : 0.8 + r() * 0.5).toFixed(2);
      const y = front ? 262 + Math.round(r() * 10) : SIGN_BASE - Math.round(r() * 6);
      out += `<use href="#${r() < 0.3 ? 'sc-rock' : 'sc-bush'}" transform="translate(${x.toFixed(0)} ${y}) scale(${s})"/>`;
    }
    // Snow patches everywhere (faded in with progress)
    for (let x = x0; x < x1; x += 25 + r() * 47) {
      const front = r() < 0.45;
      const y = front ? 258 + Math.round(r() * 14) : HORIZON + 4 + Math.round(r() * 8);
      out += `<use href="#sc-patch" transform="translate(${x.toFixed(0)} ${y}) scale(${(front ? 0.5 : 0.7 + r() * 0.7).toFixed(2)} 1)"/>`;
    }
    // Deep snow drifts from the 60th parallel on, and sea ice from the Arctic coast
    const driftFrom = marks.north60 != null ? marks.north60 : marks.arctic;
    const seaIceFrom = marks.coast != null ? marks.coast : marks.arctic;
    if (driftFrom != null) {
      for (let x = nx(driftFrom); x < x1; x += 47 + r() * 90) {
        const ice = seaIceFrom != null && x >= nx(seaIceFrom) - 60 && r() < 0.55;
        const y = r() < 0.5 ? SIGN_BASE - 2 : 264 + Math.round(r() * 8);
        out += `<use href="#${ice ? 'sc-ice' : 'sc-mound'}" transform="translate(${x.toFixed(0)} ${y}) scale(${(y > 240 ? 0.5 : 0.8 + r() * 0.6).toFixed(2)})"/>`;
      }
    }

    // Santa's workshop just left of the North Pole arch. Drawn before the signposts,
    // so a sign that happens to stand nearby is painted in front of the buildings.
    if (marks.finish != null) {
      const fx = nx(marks.finish);
      out += house(fx - 99, SIGN_BASE, 76, 34, '#b35b4a', '#4e7a5a', true);
      out += `<g transform="translate(${(fx - 99).toFixed(0)} ${SIGN_BASE})"><rect x="-26" y="-54" width="8" height="18" fill="#6b4320"/><circle cx="-22" cy="-62" r="7" fill="#c9c6d2" opacity="0.6"/></g>`;
      out += house(fx - 34, SIGN_BASE, 34, 24, '#d9c29a', '#8a3b30', true);
      out += lights(fx - 143, SIGN_BASE - 58, fx - 24, SIGN_BASE - 36, 22);
    }

    // Signposts: alternate tall and short so close neighbours never collide
    J.waypoints.forEach((wp, i) => {
      if (wp.scene === 'finish') return;
      out += signpost(wp, i % 2 === 0, wp.mile <= mile);
    });

    if (marks.arctic != null) out += polarBear(nx(marks.arctic + 75));
    if (marks.volcano != null) out += penguin(nx(marks.volcano + 44), 250, 0.75, false) + penguin(nx(marks.volcano + 56), 250, 0.6, false);
    if (marks.finish != null) {
      const f = marks.finish;
      out += `<g transform="translate(${nx(f + 42).toFixed(0)} ${SIGN_BASE})"><ellipse rx="12" ry="4" fill="#fbfbf7"/><rect x="-5" y="-72" width="10" height="72" rx="3" fill="url(#sc-candy)"/><rect x="-5" y="-72" width="10" height="72" rx="3" fill="none" stroke="#7b2f22" stroke-width="1"/><circle cy="-77" r="7" fill="#e2b04c" stroke="#b98624" stroke-width="1"/></g>`;
      out += arch(nx(f));
      out += penguin(nx(f) - 43, 256, 0.7, false) + penguin(nx(f) - 13, 254, 0.7, true) + penguin(nx(f) + 43, 258, 0.8, true);
    }
    return out;
  }

  /* ---------- The elf ---------- */

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
        <clipPath id="sc-hat"><path d="M-15 -80 L15 -80 L5 -104 Q0 -114 -12 -114 Z"/></clipPath>
        <g clip-path="url(#sc-hat)">
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

  /* ---------- Falling snow ---------- */

  function snowfall(VW, c) {
    const groups = [[20, c.snowA, 9, 1.5], [26, c.snowB, 7.5, 1.8], [34, c.snowC, 6, 2.2]];
    const r = rng(23);
    return groups.map(([n, op, dur, rad], i) => {
      if (op < 0.02) return '';
      let dots = '';
      for (let k = 0; k < n; k++) {
        const x = (r() * VW).toFixed(0), y = Math.round(r() * H), rr = (rad * (0.6 + r() * 0.7)).toFixed(1);
        dots += `<circle cx="${x}" cy="${y}" r="${rr}"/><circle cx="${x}" cy="${y - H}" r="${rr}"/>`;
      }
      return `<g class="snow-sway" style="animation-duration:${4 + i * 1.5}s"><g class="snow-fall" style="animation-duration:${dur}s" fill="#ffffff" opacity="${(op * 0.9).toFixed(2)}">${dots}</g></g>`;
    }).join('');
  }

  /* ---------- Build, place, animate ---------- */

  function sceneMarks(J) {
    const marks = {};
    J.waypoints.forEach((wp) => { if (wp.scene) marks[wp.scene] = wp.mile; });
    return marks;
  }

  function build(host, opts) {
    const J = opts.journey;
    const total = J.totalMiles;
    const t = clamp(opts.mile / total, 0, 1);
    const hostW = host.clientWidth || 358;
    const hostH = host.clientHeight || H;
    const VW = Math.round(hostW * H / hostH);
    setWorld(J);
    const marks = sceneMarks(J);
    const frac = (key, fallback) => (marks[key] != null ? marks[key] / total : fallback);
    const c = palette(t, {
      canada: frac('canada', 0.16),
      edmonton: frac('edmonton', 0.26),
      north60: frac('north60', 0.39),
      arctic: frac('arctic', 0.52),
    });
    const vars = `--tree:${c.tree};--tree-snow:${c.treeSnow.toFixed(2)};--patch:${c.patch.toFixed(2)}`;
    host.innerHTML = `<svg class="scene-svg" viewBox="0 0 ${VW} ${H}" preserveAspectRatio="xMidYMax slice" role="img" aria-label="${esc(opts.label || '')}" style="${vars}">
      ${defs(c, VW)}
      ${sky(c, VW)}
      <g class="layer" data-speed="${SPEED.far}">${farLayer(total, VW, c)}</g>
      <g class="layer" data-speed="${SPEED.mid}">${midLayer(total, VW, c, marks)}</g>
      <g class="layer" data-speed="${SPEED.near}">${nearLayer(total, VW, c, J, marks, clamp(opts.mile, 0, total))}</g>
      ${elf(VW / 2)}
      ${snowfall(VW, c)}
    </svg>`;
    return VW;
  }

  function place(svg, VW, mile) {
    const layers = svg.querySelectorAll('.layer');
    for (let i = 0; i < layers.length; i++) {
      const s = Number(layers[i].getAttribute('data-speed'));
      layers[i].setAttribute('transform', `translate(${(VW / 2 - worldX(mile) * s).toFixed(2)} 0)`);
    }
  }

  // Once the web font has loaded, size each plank to its painted text and keep
  // the sign's right edge a fixed gap behind the elf.
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
      g.setAttribute('transform', `translate(${x.toFixed(1)} 0)`);
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

  window.JourneyScene = { mount };
})();
