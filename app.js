/* The Walk to the North Pole — front-end app.
   Plain JavaScript, no build step. Screens are rendered into #app. */

(function () {
  'use strict';

  const $app = document.getElementById('app');
  const $toast = document.getElementById('toast');
  const $celebration = document.getElementById('celebration');

  const state = {
    config: { googleClientId: '', dbReady: false },
    user: null,
    teams: [],
    teamId: null,
    journey: null,      // response from /api/journey
    tab: 'journey',
    lastShownMile: null, // so the walker animates from where it was
    busy: false,
  };

  /* ---------- Helpers ---------- */

  async function api(path, options = {}) {
    const res = await fetch(path, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || 'Something went wrong. Try again.');
    return body;
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmt(n, digits = 1) {
    return Number(n).toLocaleString('en-US', { maximumFractionDigits: digits });
  }

  function whenText(sqlDate) {
    if (!sqlDate) return '';
    const d = new Date(sqlDate.replace(' ', 'T') + 'Z');
    const now = new Date();
    const dayMs = 86400000;
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    if (d.getTime() >= startToday) return 'today';
    if (d.getTime() >= startToday - dayMs) return 'yesterday';
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function currentJourneyDef() {
    const id = (state.journey && state.journey.team.journey_id) || 'north-pole';
    return JOURNEYS[id] || JOURNEYS['north-pole'];
  }

  let toastTimer = null;
  function toast(message, action) {
    clearTimeout(toastTimer);
    $toast.innerHTML = esc(message) + (action ? ` <button type="button" id="toast-action">${esc(action.label)}</button>` : '');
    $toast.hidden = false;
    if (action) {
      document.getElementById('toast-action').addEventListener('click', () => {
        $toast.hidden = true;
        action.run();
      });
    }
    toastTimer = setTimeout(() => { $toast.hidden = true; }, action ? 8000 : 3500);
  }

  function rememberPendingJoin() {
    const fromPath = location.pathname.match(/^\/join\/([A-Za-z0-9]+)/);
    const fromQuery = new URLSearchParams(location.search).get('join');
    const code = (fromPath && fromPath[1]) || fromQuery;
    if (code) {
      localStorage.setItem('pendingJoin', code.toUpperCase());
      history.replaceState(null, '', '/');
    }
  }

  /* ---------- Boot ---------- */

  async function boot() {
    $app.innerHTML = '<p class="loading">Opening the map…</p>';
    rememberPendingJoin();

    try { state.config = await api('/api/config'); } catch (e) { /* keep defaults */ }

    try {
      const me = await api('/api/me');
      state.user = me.user;
      state.teams = me.teams;
    } catch (e) {
      state.user = null;
    }

    if (!state.user) return renderCover();
    await afterSignIn();
  }

  async function afterSignIn() {
    const code = localStorage.getItem('pendingJoin');
    if (code) {
      localStorage.removeItem('pendingJoin');
      try {
        const joined = await api('/api/join', { method: 'POST', body: JSON.stringify({ code }) });
        const me = await api('/api/me');
        state.teams = me.teams;
        state.teamId = joined.team.id;
        toast(`You joined ${joined.team.name}`);
      } catch (e) {
        toast(e.message);
      }
    }

    if (!state.teams.length) return renderBegin();

    const saved = localStorage.getItem('teamId');
    if (!state.teamId) state.teamId = state.teams.some((t) => t.id === saved) ? saved : state.teams[0].id;
    localStorage.setItem('teamId', state.teamId);

    await loadJourney();
    renderMain();
  }

  async function loadJourney() {
    state.journey = await api('/api/journey?team=' + encodeURIComponent(state.teamId));
  }

  /* ---------- Google sign-in ---------- */

  function mountGoogleButton() {
    const holder = document.getElementById('google-button');
    if (!holder || !state.config.googleClientId) return;

    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      if (window.google && google.accounts && google.accounts.id) {
        clearInterval(timer);
        google.accounts.id.initialize({
          client_id: state.config.googleClientId,
          callback: onGoogleCredential,
          ux_mode: 'popup',
        });
        google.accounts.id.renderButton(holder, {
          theme: 'outline', size: 'large', shape: 'pill', text: 'continue_with', width: 280,
        });
      } else if (tries > 100) {
        clearInterval(timer);
        holder.innerHTML = '<p class="small">The Google sign-in button could not load. Check your connection and refresh.</p>';
      }
    }, 100);
  }

  async function onGoogleCredential(response) {
    try {
      await api('/api/auth/google', { method: 'POST', body: JSON.stringify({ credential: response.credential }) });
      const me = await api('/api/me');
      state.user = me.user;
      state.teams = me.teams;
      await afterSignIn();
    } catch (e) {
      toast(e.message);
    }
  }

  /* ---------- Screens ---------- */

  function poleSvg(size) {
    return `<svg class="cover-pole" width="${size}" height="${size * 1.3}" viewBox="0 0 60 78" aria-hidden="true">
      <ellipse cx="30" cy="70" rx="26" ry="6" fill="#fbfbf7" opacity="0.9"/>
      <rect x="25" y="14" width="10" height="56" rx="3" fill="#fbfbf7"/>
      <path d="M25 20 l10 6 M25 30 l10 6 M25 40 l10 6 M25 50 l10 6 M25 60 l10 6" stroke="#c9553d" stroke-width="4"/>
      <circle cx="30" cy="12" r="7" fill="#e2b04c"/>
      <circle cx="30" cy="12" r="7" fill="none" stroke="#b98624" stroke-width="1.5"/>
    </svg>`;
  }

  function renderCover() {
    const setupItems = [];
    if (!state.config.dbReady) setupItems.push('Connect the D1 database (the <code>DB</code> binding in <code>wrangler.toml</code>).');
    if (!state.config.googleClientId) setupItems.push('Add your Google client ID to <code>wrangler.toml</code>.');

    $app.innerHTML = `
      <section class="cover">
        ${poleSvg(64)}
        <h1 class="cover-title">The Walk to the North Pole</h1>
        <p class="cover-sub">A team journey, one mile at a time.<br>3,381 miles due north of Layton.</p>
        <div class="signin"><div id="google-button"></div></div>
        ${setupItems.length ? `
          <div class="page setup-note">
            <h2>Almost ready</h2>
            <p class="small">A couple of setup steps are still missing. The README walks through each one.</p>
            <ul class="small">${setupItems.map((s) => `<li>${s}</li>`).join('')}</ul>
          </div>` : ''}
      </section>`;
    mountGoogleButton();
  }

  function renderBegin() {
    const first = (state.user.name || '').split(' ')[0];
    $app.innerHTML = `
      <section>
        <div class="header"><h1>Hello, ${esc(first)}</h1></div>
        <div class="page">
          <h2>Start a team</h2>
          <p class="muted small">You will get an invite link to share with everyone who is walking with you.</p>
          <form data-form="create-team">
            <label class="field"><span>Team name</span><input name="name" maxlength="60" placeholder="Hill Field Walkers" required></label>
            <button class="button wide" type="submit">Begin the journey</button>
          </form>
        </div>
        <div class="page">
          <h2>Have an invite?</h2>
          <p class="muted small">Enter the code from your invite link.</p>
          <form data-form="join-team">
            <div class="row">
              <label class="field" style="margin:0"><span class="visually-hidden"></span><input name="code" maxlength="8" placeholder="ABC123" autocapitalize="characters" required></label>
              <button class="button" type="submit" style="flex:0 0 auto">Join</button>
            </div>
          </form>
        </div>
        <button class="button quiet on-night wide" data-action="sign-out">Sign out</button>
      </section>`;
  }

  function renderMain() {
    const team = state.journey.team;
    const J = currentJourneyDef();
    const switcher = state.teams.length > 1
      ? `<select data-action="switch-team" aria-label="Choose a team">
          ${state.teams.map((t) => `<option value="${esc(t.id)}" ${t.id === state.teamId ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}
         </select>`
      : '';

    $app.innerHTML = `
      <div class="header">
        <div>
          <h1>${esc(J.title)}</h1>
          <div class="team-name">${esc(team.name)}</div>
        </div>
        ${switcher}
      </div>
      <div id="screen"></div>
      <nav class="nav" aria-label="Sections"><div class="nav-inner">
        ${navButton('journey', 'Journey', '<path d="M4 18c4-6 6-6 8 0s4 6 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="6" r="2.5" fill="currentColor"/>')}
        ${navButton('log', 'Add miles', '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}
        ${navButton('team', 'Team', '<circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 15c3 0 5 1.5 5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}
        ${navButton('awards', 'Awards', '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.3 6.7 19.1l1.1-5.8L3.5 9.2l5.9-.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>')}
      </div></nav>`;
    renderScreen();
  }

  function navButton(tab, label, iconPaths) {
    return `<button type="button" data-action="tab" data-tab="${tab}" class="${state.tab === tab ? 'active' : ''}" aria-current="${state.tab === tab ? 'page' : 'false'}">
      <svg viewBox="0 0 24 24" aria-hidden="true">${iconPaths}</svg>${label}</button>`;
  }

  function renderScreen() {
    const $screen = document.getElementById('screen');
    if (!$screen) return;
    if (state.tab === 'journey') $screen.innerHTML = journeyScreen();
    if (state.tab === 'log') $screen.innerHTML = logScreen();
    if (state.tab === 'team') $screen.innerHTML = teamScreen();
    if (state.tab === 'awards') $screen.innerHTML = awardsScreen();
    document.querySelectorAll('.nav button').forEach((b) => {
      const active = b.dataset.tab === state.tab;
      b.classList.toggle('active', active);
      b.setAttribute('aria-current', active ? 'page' : 'false');
    });
    if (state.tab === 'journey') {
      positionTrail();
      maybeCelebrate();
    }
    window.scrollTo({ top: 0 });
  }

  /* ---------- Journey screen ---------- */

  function progress() {
    const J = currentJourneyDef();
    const total = state.journey.teamTotal;
    const goal = J.totalMiles;
    const mile = Math.min(total, goal);
    const passed = J.waypoints.filter((w) => w.mile <= mile);
    const here = passed[passed.length - 1] || J.waypoints[0];
    const next = J.waypoints.find((w) => w.mile > mile) || null;
    return { J, total, goal, mile, here, next, pct: Math.min(100, (total / goal) * 100), arrived: total >= goal };
  }

  function journeyScreen() {
    const p = progress();
    const recent = state.journey.recent.slice(0, 6);

    const where = p.arrived
      ? `Your team is standing at the top of the world.`
      : `Your team is ${esc(p.here.region)}.${p.next ? ` Next up: ${esc(p.next.name)}, ${fmt(p.next.mile - p.mile, 0)} miles ahead.` : ''}`;

    return `
      <div class="page trail-page">
        <svg class="trail-map" viewBox="0 0 360 150" aria-label="Map of the trail from Layton to the North Pole">
          <text class="compass" x="22" y="40" text-anchor="middle">N</text>
          <path d="M22 26 l0 -12 m-4 4 l4 -4 l4 4" fill="none" stroke="#6b5f54" stroke-width="1.5" stroke-linecap="round"/>
          <path id="trail" class="trail-path" d="M 30 122 C 95 122, 105 46, 170 62 S 262 128, 326 44"/>
          <path id="trail-done" class="trail-done" d="M 30 122 C 95 122, 105 46, 170 62 S 262 128, 326 44" pathLength="1" stroke-dasharray="0 1"/>
          <g id="ticks"></g>
          <g transform="translate(30 122)">
            <path d="M-9 4 l9 -10 l9 10 z M-6 4 v7 h12 v-7" fill="#e9dcbf" stroke="#6b5f54" stroke-width="1.5" stroke-linejoin="round"/>
            <text class="trail-label" y="24" text-anchor="middle">Layton</text>
          </g>
          <g transform="translate(326 44)">
            <ellipse cy="10" rx="14" ry="4" fill="#fbfbf7" stroke="#e9dcbf"/>
            <rect x="-3" y="-20" width="6" height="30" rx="2" fill="#fbfbf7" stroke="#6b5f54" stroke-width="1"/>
            <path d="M-3 -15 l6 3 M-3 -8 l6 3 M-3 -1 l6 3" stroke="#c9553d" stroke-width="2"/>
            <circle cy="-22" r="4" fill="#e2b04c" stroke="#b98624"/>
            <text class="trail-label" y="24" text-anchor="middle">North Pole</text>
          </g>
          <g id="walker" class="walker" transform="translate(30 122)">
            <ellipse cy="9" rx="9" ry="3" fill="rgba(0,0,0,0.12)"/>
            <path d="M-4 8 L0 -2 L4 8 Z" fill="#2b241f"/>
            <circle cy="-6" r="4.5" fill="#f5ecd8" stroke="#2b241f" stroke-width="1.5"/>
            <path d="M-5 -8 a5 5 0 0 1 10 0 z" fill="#c9553d"/>
            <text class="you" y="-15" text-anchor="middle">you</text>
          </g>
        </svg>
      </div>

      <div class="page milepost-page">
        <div class="milepost" aria-hidden="true">
          <div class="board"><div class="label">MILE</div><div class="number">${fmt(Math.floor(p.mile), 0)}</div></div>
          <div class="post"></div>
          <div class="ground"></div>
        </div>
        <div class="progress-copy">
          <h2>${fmt(p.total, 0)} of ${fmt(p.goal, 0)} miles</h2>
          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(p.pct)}" aria-valuemin="0" aria-valuemax="100"><div id="progress-fill" style="width:0%"></div></div>
          <p class="small">${p.arrived ? 'Journey complete' : `${Math.floor(p.pct)}% there, ${fmt(p.goal - p.total, 0)} miles to go`}</p>
          <p class="small muted">${where}</p>
          ${p.arrived ? `<button class="button quiet" data-action="replay-celebration" style="margin-top:6px">Replay the celebration</button>` : ''}
        </div>
      </div>

      <div class="page fact">
        <h2>Did you know?</h2>
        <p>${esc(p.here.fact)}</p>
      </div>

      <div class="page">
        <h2>Your miles</h2>
        <div class="big-number">${fmt(state.journey.myTotal)}<small>miles so far</small></div>
        <p class="small muted" style="margin-top:8px">Every mile you add moves the whole team along the trail.</p>
        <button class="button" data-action="tab" data-tab="log" style="margin-top:8px">Add miles</button>
      </div>

      <div class="page">
        <h2>Latest on the trail</h2>
        ${recent.length ? `<ul class="list">${recent.map(entryRow).join('')}</ul>`
          : `<p class="muted">No miles yet. Be the first to take a step.</p>`}
      </div>`;
  }

  function entryRow(e) {
    const mine = e.user_id === state.user.id;
    return `<li>
      <span class="avatar">${esc((e.name || '?')[0].toUpperCase())}</span>
      <div class="who"><strong>${esc(mine ? 'You' : e.name)}</strong><span>${esc(whenText(e.logged_at))}${e.note ? ' · ' + esc(e.note) : ''}</span></div>
      <span class="miles">${fmt(e.miles)} mi</span>
      ${mine ? `<button type="button" class="undo" data-action="delete-entry" data-id="${e.id}" aria-label="Remove this entry">remove</button>` : ''}
    </li>`;
  }

  function positionTrail() {
    const trail = document.getElementById('trail');
    const walker = document.getElementById('walker');
    const done = document.getElementById('trail-done');
    const ticks = document.getElementById('ticks');
    const fill = document.getElementById('progress-fill');
    if (!trail || !walker) return;

    const p = progress();
    const len = trail.getTotalLength();
    const at = (mile) => trail.getPointAtLength(len * Math.max(0, Math.min(1, mile / p.goal)));

    ticks.innerHTML = p.J.waypoints
      .filter((w) => w.mile > 0 && w.mile < p.goal)
      .map((w) => { const pt = at(w.mile); return `<circle class="trail-tick ${w.mile <= p.mile ? 'passed' : ''}" cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="3.5"><title>${esc(w.name)}, mile ${fmt(w.mile, 0)}</title></circle>`; })
      .join('');

    const from = state.lastShownMile == null ? p.mile : state.lastShownMile;
    const start = at(from);
    walker.setAttribute('transform', `translate(${start.x.toFixed(1)} ${start.y.toFixed(1)})`);
    done.setAttribute('stroke-dasharray', `${(from / p.goal).toFixed(4)} 1`);
    fill.style.width = `${(Math.min(100, (from / p.goal) * 100)).toFixed(1)}%`;

    requestAnimationFrame(() => requestAnimationFrame(() => {
      const end = at(Math.min(p.mile, p.goal * 0.965));
      walker.setAttribute('transform', `translate(${end.x.toFixed(1)} ${end.y.toFixed(1)})`);
      done.style.transition = 'stroke-dasharray 1100ms cubic-bezier(0.22, 1, 0.36, 1)';
      done.setAttribute('stroke-dasharray', `${(p.mile / p.goal).toFixed(4)} 1`);
      fill.style.width = `${p.pct.toFixed(1)}%`;
    }));
    state.lastShownMile = p.mile;
  }

  /* ---------- Log miles screen ---------- */

  function logScreen() {
    return `
      <div class="page">
        <h2>Add your miles</h2>
        <p class="muted small">Walking, running, treadmill — if your feet did it, it counts.</p>
        <form data-form="add-miles">
          <label class="field"><span>Miles</span><input class="big" name="miles" type="number" inputmode="decimal" step="0.1" min="0.1" max="100" placeholder="2.5" required></label>
          <label class="field"><span>Note (optional)</span><input name="note" maxlength="120" placeholder="Lunch walk around the building"></label>
          <button class="button wide" type="submit">Add miles to the team</button>
        </form>
        <p class="small muted" style="margin-top:14px">Counting steps instead? About 2,000 steps is one mile.</p>
      </div>`;
  }

  /* ---------- Team screen ---------- */

  function teamScreen() {
    const team = state.journey.team;
    const link = `${location.origin}/join/${team.invite_code}`;
    const members = state.journey.members;
    return `
      <div class="page">
        <h2>${esc(team.name)}</h2>
        <p class="muted small">Send this link to anyone who wants to walk with you. They sign in with Google and they're on the team.</p>
        <div class="invite-box"><code>${esc(link)}</code><button class="button" type="button" data-action="copy-link" data-link="${esc(link)}" style="flex:0 0 auto;min-height:40px;padding:6px 14px">Copy</button></div>
        <p class="small muted" style="margin-bottom:2px">Or share the code</p>
        <p class="invite-code">${esc(team.invite_code)}</p>
        ${navigator.share ? `<button class="button quiet wide" type="button" data-action="share-link" data-link="${esc(link)}" data-team="${esc(team.name)}">Share invite</button>` : ''}
      </div>

      <div class="page">
        <h2>Walking together (${members.length})</h2>
        <ul class="list">
          ${members.map((m) => `<li>
            ${m.picture ? `<img class="avatar" src="${esc(m.picture)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((m.name || '?')[0].toUpperCase())}</span>`}
            <div class="who"><strong>${esc(m.id === state.user.id ? m.name + ' (you)' : m.name)}</strong><span>joined ${esc(whenText(m.joined_at))}</span></div>
          </li>`).join('')}
        </ul>
      </div>

      <div class="page">
        <h2>Walk another trail</h2>
        <p class="muted small">You can be on more than one team — one for work, one for family.</p>
        <form data-form="create-team">
          <div class="row">
            <label class="field" style="margin:0"><input name="name" maxlength="60" placeholder="New team name" required></label>
            <button class="button quiet" type="submit" style="flex:0 0 auto">Start</button>
          </div>
        </form>
        <form data-form="join-team" style="margin-top:10px">
          <div class="row">
            <label class="field" style="margin:0"><input name="code" maxlength="8" placeholder="Invite code" autocapitalize="characters" required></label>
            <button class="button quiet" type="submit" style="flex:0 0 auto">Join</button>
          </div>
        </form>
      </div>

      <button class="button quiet on-night wide" data-action="sign-out">Sign out</button>`;
  }

  /* ---------- Awards screen ---------- */

  function awardsScreen() {
    const p = progress();
    return `
      <div class="page">
        <h2>Awards</h2>
        <p class="muted small">Badges your team has earned on the trail.</p>
      </div>
      <div class="page badge ${p.arrived ? 'earned' : ''}">
        <div class="medal">${poleSvg(34)}</div>
        <div>
          <h3>Traveled to the North Pole</h3>
          <p class="small muted">${p.arrived ? 'Earned together. 3,381 miles due north.' : `Earned when your team reaches mile ${fmt(p.goal, 0)}. ${fmt(p.goal - p.total, 0)} miles to go.`}</p>
        </div>
      </div>
      <div class="page">
        <p class="muted small">More destinations and badges are coming. Mount Doom is on the list.</p>
      </div>`;
  }

  /* ---------- Celebration ---------- */

  function maybeCelebrate() {
    const p = progress();
    if (!p.arrived) return;
    const key = 'celebrated:' + state.teamId;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    showCelebration();
  }

  let celebrationFrame = null;
  function showCelebration() {
    const p = progress();
    document.getElementById('celebration-text').textContent =
      `${fmt(p.total, 0)} miles, walked together by ${state.journey.members.length} ${state.journey.members.length === 1 ? 'person' : 'people'}.`;
    $celebration.hidden = false;

    const canvas = document.getElementById('celebration-canvas');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.scale(dpr, dpr);
    const W = window.innerWidth, H = window.innerHeight;
    const colors = ['#e2b04c', '#6fe3b4', '#fbfbf7', '#c9553d', '#f5ecd8'];
    const bits = Array.from({ length: 140 }, () => ({
      x: Math.random() * W, y: -20 - Math.random() * H,
      w: 4 + Math.random() * 6, h: 6 + Math.random() * 8,
      vy: 1.5 + Math.random() * 2.5, vx: -0.8 + Math.random() * 1.6,
      rot: Math.random() * Math.PI, vr: -0.1 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
      snow: Math.random() < 0.4,
    }));

    function tick() {
      ctx.clearRect(0, 0, W, H);
      for (const b of bits) {
        b.y += b.vy; b.x += b.vx + Math.sin(b.y / 30) * 0.3; b.rot += b.vr;
        if (b.y > H + 20) { b.y = -20; b.x = Math.random() * W; }
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.fillStyle = b.snow ? 'rgba(255,255,255,0.9)' : b.color;
        if (b.snow) { ctx.beginPath(); ctx.arc(0, 0, b.w / 2, 0, Math.PI * 2); ctx.fill(); }
        else { ctx.rotate(b.rot); ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); }
        ctx.restore();
      }
      celebrationFrame = requestAnimationFrame(tick);
    }
    cancelAnimationFrame(celebrationFrame);
    tick();
  }

  function hideCelebration() {
    $celebration.hidden = true;
    cancelAnimationFrame(celebrationFrame);
  }

  /* ---------- Actions ---------- */

  async function withBusy(fn) {
    if (state.busy) return;
    state.busy = true;
    try { await fn(); } catch (e) { toast(e.message); } finally { state.busy = false; }
  }

  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'tab') { state.tab = el.dataset.tab; renderScreen(); }

    if (action === 'sign-out') withBusy(async () => {
      await api('/api/auth/logout', { method: 'POST' });
      localStorage.removeItem('teamId');
      location.reload();
    });

    if (action === 'copy-link') {
      const link = el.dataset.link;
      (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject())
        .then(() => toast('Invite link copied'))
        .catch(() => { window.prompt('Copy this link:', link); });
    }

    if (action === 'share-link') {
      navigator.share({ title: 'Walk with us to the North Pole', text: `Join ${el.dataset.team} on the walk to the North Pole`, url: el.dataset.link }).catch(() => {});
    }

    if (action === 'delete-entry') withBusy(async () => {
      await api('/api/miles', { method: 'DELETE', body: JSON.stringify({ id: Number(el.dataset.id) }) });
      await loadJourney();
      renderScreen();
      toast('Entry removed');
    });

    if (action === 'replay-celebration') showCelebration();
    if (action === 'close-celebration') hideCelebration();
  });

  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-action="switch-team"]');
    if (!el) return;
    withBusy(async () => {
      state.teamId = el.value;
      localStorage.setItem('teamId', state.teamId);
      state.lastShownMile = null;
      await loadJourney();
      renderMain();
    });
  });

  document.addEventListener('submit', (ev) => {
    const form = ev.target.closest('[data-form]');
    if (!form) return;
    ev.preventDefault();
    const kind = form.dataset.form;
    const fields = Object.fromEntries(new FormData(form).entries());
    const button = form.querySelector('button[type="submit"]');

    withBusy(async () => {
      button.disabled = true;
      try {
        if (kind === 'create-team') {
          const made = await api('/api/teams', { method: 'POST', body: JSON.stringify({ name: fields.name }) });
          const me = await api('/api/me');
          state.teams = me.teams;
          state.teamId = made.team.id;
          localStorage.setItem('teamId', state.teamId);
          state.lastShownMile = null;
          state.tab = 'team';
          await loadJourney();
          renderMain();
          toast(`${made.team.name} is ready. Share the invite link.`);
        }

        if (kind === 'join-team') {
          const joined = await api('/api/join', { method: 'POST', body: JSON.stringify({ code: fields.code }) });
          const me = await api('/api/me');
          state.teams = me.teams;
          state.teamId = joined.team.id;
          localStorage.setItem('teamId', state.teamId);
          state.lastShownMile = null;
          state.tab = 'journey';
          await loadJourney();
          renderMain();
          toast(`You joined ${joined.team.name}`);
        }

        if (kind === 'add-miles') {
          const added = await api('/api/miles', { method: 'POST', body: JSON.stringify({ team_id: state.teamId, miles: fields.miles, note: fields.note }) });
          await loadJourney();
          state.tab = 'journey';
          renderScreen();
          toast(`Added ${fmt(added.miles)} miles`, {
            label: 'Undo',
            run: () => withBusy(async () => {
              await api('/api/miles', { method: 'DELETE', body: JSON.stringify({ id: added.id }) });
              await loadJourney();
              renderScreen();
            }),
          });
        }
      } finally {
        button.disabled = false;
      }
    });
  });

  boot();
})();
