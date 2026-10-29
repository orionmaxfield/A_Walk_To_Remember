/* Stroll — front-end app.
   Plain JavaScript, no build step. Screens are rendered into #app.
   A "team" row is any walk: a solo journey (kind 'solo') or a group walk (kind 'team'). */

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
    awards: null,       // response from /api/awards (fetched when the Awards tab opens)
    tab: 'journey',
    picking: null,       // destination picker: null, or { journeyId: null | 'oz' … }
    lastShownMile: null, // so the walker animates from where it was
    busy: false,
    noticeDismissed: false, // fallback when localStorage is unavailable
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

  function capitalize(s) {
    return String(s).charAt(0).toUpperCase() + String(s).slice(1);
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

  function isSolo() {
    return Boolean(state.journey && state.journey.team.kind === 'solo');
  }

  // "The elf" on the office's walk, "the walker" everywhere else.
  function heroWord(J) {
    return (J.hero || 'elf') === 'elf' ? 'elf' : 'walker';
  }

  // "About 1.2 miles a day for a year" — how a destination compares to a year of walking.
  function dailyHint(J) {
    const perDay = J.totalMiles / 365;
    if (perDay < 1) return `About ${fmt(Math.round(perDay * STEPS_PER_MILE / 100) * 100, 0)} steps a day gets you there in a year.`;
    return `About ${fmt(perDay, 1)} miles a day gets you there in a year.`;
  }

  // The card under the mile post: the office poster's "Remember" note, a "Did you know?" fact, or road lore.
  function stopCard(wp) {
    if (wp.remember) return { heading: 'Remember', text: wp.remember };
    if (wp.lore) return { heading: 'Road lore', text: wp.lore };
    return { heading: 'Did you know?', text: wp.fact || '' };
  }

  function teamLabel(t) {
    const J = JOURNEYS[t.journey_id] || JOURNEYS['north-pole'];
    return t.kind === 'solo' ? `${J.title} (solo)` : t.name;
  }

  // One-time note about the switch to the real route. Remembered in localStorage,
  // which may be unavailable (private mode), so every touch is guarded.
  const ROUTE_NOTICE_KEY = 'notice:real-route-3381';
  function routeNoticeDismissed() {
    try { return localStorage.getItem(ROUTE_NOTICE_KEY) === '1'; } catch (e) { return state.noticeDismissed === true; }
  }
  function dismissRouteNotice() {
    state.noticeDismissed = true;
    try { localStorage.setItem(ROUTE_NOTICE_KEY, '1'); } catch (e) { /* no storage; it stays dismissed for this visit */ }
  }
  function routeNotice() {
    if (currentJourneyDef().id !== 'north-pole' || routeNoticeDismissed()) return '';
    return `<div class="page notice" role="status">
      <p><strong>We've switched to the real route: 3,381 miles to the North Pole!</strong> Your miles are all still here; the trail just got longer, and some badges moved.</p>
      <button class="button quiet" type="button" data-action="dismiss-notice">Got it</button>
    </div>`;
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

    if (!state.teams.length) return renderPick();

    const saved = localStorage.getItem('teamId');
    if (!state.teamId) state.teamId = state.teams.some((t) => t.id === saved) ? saved : state.teams[0].id;
    localStorage.setItem('teamId', state.teamId);

    await loadJourney();
    renderMain();
  }

  async function loadJourney() {
    state.journey = await api('/api/journey?team=' + encodeURIComponent(state.teamId));
    state.awards = null; // miles changed, so awards may have too
  }

  async function loadAwards() {
    const teamId = state.teamId;
    const awards = await api('/api/awards?team=' + encodeURIComponent(teamId));
    if (teamId !== state.teamId) return;
    state.awards = awards;
    if (state.tab === 'awards') renderScreen();
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
        <h1 class="cover-title">Stroll</h1>
        <p class="cover-sub">Why not walk somewhere amazing this year?<br>Pick a destination, log your miles, watch yourself get there.</p>
        <div class="signin"><div id="google-button"></div></div>
        <p class="cover-places">${JOURNEY_ORDER.map((id) => `<span>${esc(JOURNEYS[id].end)}</span>`).join('')}</p>
        ${setupItems.length ? `
          <div class="page setup-note">
            <h2>Almost ready</h2>
            <p class="small">A couple of setup steps are still missing. The README walks through each one.</p>
            <ul class="small">${setupItems.map((s) => `<li>${s}</li>`).join('')}</ul>
          </div>` : ''}
      </section>`;
    mountGoogleButton();
  }

  /* ---------- Choose a destination ---------- */

  // The picker opens for a brand-new walker (no walks yet) and from "Start another journey".
  function renderPick() {
    const first = (state.user.name || '').split(' ')[0];
    const hasWalks = state.teams.length > 0;
    state.picking = { journeyId: null };
    $app.innerHTML = `
      <section>
        <div class="header">
          <div>
            <h1>${hasWalks ? 'Start another journey' : `Hello, ${esc(first)}`}</h1>
            <div class="team-name">Where will you walk this year?</div>
          </div>
          ${hasWalks ? `<button class="button quiet on-night" type="button" data-action="pick-back" style="min-height:40px;padding:6px 14px">Back</button>` : ''}
        </div>
        <ul class="destinations">
          ${JOURNEY_ORDER.map((id) => destinationCard(JOURNEYS[id])).join('')}
        </ul>
        <div class="page">
          <h2>Walking with a group?</h2>
          <p class="muted small">Pick a destination above and choose <strong>Start a group walk</strong>. Or, if someone sent you an invite, enter the code here.</p>
          <form data-form="join-team">
            <div class="row">
              <label class="field" style="margin:0"><span class="visually-hidden"></span><input name="code" maxlength="8" placeholder="Invite code" autocapitalize="characters" required aria-label="Invite code"></label>
              <button class="button" type="submit" style="flex:0 0 auto">Join</button>
            </div>
          </form>
        </div>
        ${hasWalks ? '' : `<button class="button quiet on-night wide" data-action="sign-out">Sign out</button>`}
      </section>`;
    window.scrollTo({ top: 0 });
  }

  function destinationCard(J) {
    return `<li class="destination theme-${esc(J.theme)}">
      <button type="button" data-action="pick-destination" data-journey="${esc(J.id)}">
        <span class="destination-art" aria-hidden="true">${destinationArt(J)}</span>
        <span class="destination-copy">
          <strong>${esc(J.title)}</strong>
          <span class="destination-miles">${fmt(J.totalMiles, 0)} miles · ${esc(J.start)} to ${esc(J.end)}</span>
          <span class="destination-blurb">${esc(J.blurb)}</span>
        </span>
      </button>
    </li>`;
  }

  // A small storybook scene for the destination card: the finish of each trail.
  function destinationArt(J) {
    if (!window.JourneyScene || !JourneyScene.thumbnail) return '';
    return JourneyScene.thumbnail(J);
  }

  function renderDestination(J) {
    state.picking = { journeyId: J.id };
    const stops = J.waypoints.filter((w) => w.mile > 0);
    $app.innerHTML = `
      <section>
        <div class="header">
          <div>
            <h1>${esc(J.title)}</h1>
            <div class="team-name">${fmt(J.totalMiles, 0)} miles · ${esc(J.start)} to ${esc(J.end)}</div>
          </div>
          <button class="button quiet on-night" type="button" data-action="pick-destination-back" style="min-height:40px;padding:6px 14px">Back</button>
        </div>
        <div class="page scene-page destination-preview theme-${esc(J.theme)}" aria-hidden="true">${destinationArt(J)}</div>
        <div class="page">
          <p>${esc(J.blurb)}</p>
          <p class="small muted">${esc(dailyHint(J))}</p>
          <div class="start-buttons">
            <button class="button wide" type="button" data-action="start-solo" data-journey="${esc(J.id)}">Walk it on my own</button>
            <button class="button quiet wide" type="button" data-action="show-group-form">Start a group walk</button>
          </div>
          <form data-form="create-team" data-journey="${esc(J.id)}" hidden>
            <label class="field"><span>Group name</span><input name="name" maxlength="60" placeholder="The Lunch Walkers" required></label>
            <button class="button wide" type="submit">Start the group walk</button>
            <p class="small muted" style="margin-top:8px">You'll get an invite link to share. Everyone's miles pool together.</p>
          </form>
        </div>
        <div class="page">
          <h2>Along the way</h2>
          <ol class="stops">
            ${stops.map((w) => `<li><span class="stop-mile">${fmt(w.mile, 0)}</span><span>${esc(capitalize(w.name))}</span></li>`).join('')}
          </ol>
        </div>
      </section>`;
    window.scrollTo({ top: 0 });
  }

  async function startWalk(journeyId, kind, name) {
    const made = await api('/api/teams', { method: 'POST', body: JSON.stringify({ journey_id: journeyId, kind, name }) });
    const me = await api('/api/me');
    state.teams = me.teams;
    state.teamId = made.team.id;
    localStorage.setItem('teamId', state.teamId);
    state.lastShownMile = null;
    state.picking = null;
    state.tab = kind === 'team' ? 'team' : 'journey';
    await loadJourney();
    renderMain();
    toast(kind === 'team' ? `${made.team.name} is ready. Share the invite link.` : `Your journey begins. Add your first miles!`);
  }

  function renderMain() {
    const team = state.journey.team;
    const J = currentJourneyDef();
    const solo = isSolo();
    const switcher = state.teams.length > 1
      ? `<select data-action="switch-team" aria-label="Choose a walk">
          ${state.teams.map((t) => `<option value="${esc(t.id)}" ${t.id === state.teamId ? 'selected' : ''}>${esc(teamLabel(t))}</option>`).join('')}
         </select>`
      : '';

    $app.innerHTML = `
      <div class="header">
        <div>
          <h1>${esc(J.title)}</h1>
          <div class="team-name">${solo ? 'Your own journey' : esc(team.name)}</div>
        </div>
        ${switcher}
      </div>
      <div id="screen"></div>
      <nav class="nav" aria-label="Sections"><div class="nav-inner">
        ${navButton('journey', 'Journey', '<path d="M4 18c4-6 6-6 8 0s4 6 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="6" r="2.5" fill="currentColor"/>')}
        ${navButton('log', 'Add miles', '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}
        ${navButton('team', solo ? 'Friends' : 'Team', '<circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 15c3 0 5 1.5 5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}
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
      positionScene();
      maybeCelebrate();
    }
    if (state.tab === 'awards' && !state.awards) loadAwards().catch((e) => toast(e.message));
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

    const who = isSolo() ? 'You are' : 'Your team is';
    const where = p.arrived
      ? `${who} ${esc(p.J.waypoints[p.J.waypoints.length - 1].region)}.`
      : `${who} ${esc(p.here.region)}.${p.next ? ` Next up: ${esc(capitalize(p.next.name))}, ${fmt(p.next.mile - p.mile, 0)} miles ahead.` : ''}`;
    const card = stopCard(p.here);
    const inviteLink = `${location.origin}/join/${state.journey.team.invite_code}`;

    return `
      ${routeNotice()}
      <div class="page scene-page">
        <div id="scene" class="scene"></div>
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

      <div class="page fact remember">
        <h2>${esc(card.heading)}</h2>
        <p>${esc(card.text)}</p>
        <p class="remember-from">${esc(capitalize(p.here.name))} · mile ${fmt(p.here.mile, 0)}</p>
      </div>

      ${isSolo() ? `
      <div class="page">
        <h2>Walk with friends</h2>
        <p class="small muted">Walking is easier with company. Invite a friend and their miles join yours on this trail.</p>
        <div class="row" style="margin-top:10px">
          <button class="button" data-action="tab" data-tab="log">Add miles</button>
          <button class="button quiet" data-action="copy-link" data-link="${esc(inviteLink)}">Copy invite link</button>
        </div>
      </div>` : `
      <div class="page">
        <h2>Your miles</h2>
        <div class="big-number">${fmt(state.journey.myTotal)}<small>miles so far</small></div>
        <p class="small muted" style="margin-top:8px">Every mile you add moves the whole team along the trail.</p>
        <button class="button" data-action="tab" data-tab="log" style="margin-top:8px">Add miles</button>
      </div>`}

      <div class="page">
        <h2>Latest on the trail</h2>
        ${recent.length ? `<ul class="list">${recent.map(entryRow).join('')}</ul>`
          : `<p class="muted">${isSolo() ? 'No miles yet. Take the first step.' : 'No miles yet. Be the first to take a step.'}</p>`}
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

  function sceneLabel(p) {
    const hero = capitalize(`the ${heroWord(p.J)}`);
    const walked = `${fmt(p.mile, 0)} of ${fmt(p.goal, 0)} miles`;
    if (p.arrived) return `${hero} has reached ${p.J.end} after walking ${fmt(p.goal, 0)} miles.`;
    if (p.here.mile === 0) return `${hero} is at the start in ${p.here.name} and has walked ${walked}. Next stop: ${p.next.name}.`;
    return `${hero} has walked ${walked} and just passed ${p.here.name}.${p.next ? ` Next stop: ${p.next.name}.` : ''}`;
  }

  function positionScene() {
    const host = document.getElementById('scene');
    const fill = document.getElementById('progress-fill');
    if (!host || !window.JourneyScene) return;

    const p = progress();
    const from = state.lastShownMile;
    JourneyScene.mount(host, {
      journey: p.J,
      mile: p.mile,
      fromMile: from,
      arrived: p.arrived,
      label: sceneLabel(p),
    });

    if (fill) {
      const was = from == null ? p.mile : from;
      fill.style.width = `${(Math.min(100, (was / p.goal) * 100)).toFixed(1)}%`;
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = `${p.pct.toFixed(1)}%`; }));
    }
    state.lastShownMile = p.mile;
  }

  /* ---------- Log miles screen ---------- */

  /* Other movement counts too: every 100 calories burned is logged as 1 mile
     (about 2,000 steps). Typical calories for 30 minutes for a 155-pound adult,
     worked out from the Compendium of Physical Activities (MET × weight × time). */
  const CALORIES_PER_MILE = 100;
  const STEPS_PER_MILE = 2000;
  const ACTIVITIES = [
    { name: 'Gentle yoga or stretching', cal: 90 },
    { name: 'Power or vinyasa yoga', cal: 140 },
    { name: 'Pilates or tai chi', cal: 105 },
    { name: 'Chair exercises', cal: 80 },
    { name: 'Strength training', cal: 125 },
    { name: 'Dancing or Zumba', cal: 255 },
    { name: 'Swimming, easy pace', cal: 210 },
    { name: 'Water aerobics', cal: 195 },
    { name: 'Biking, easy pace', cal: 140 },
    { name: 'Elliptical, moderate', cal: 175 },
    { name: 'Gardening or yard work', cal: 135 },
    { name: 'Shoveling snow', cal: 185 },
    { name: 'House cleaning', cal: 115 },
    { name: 'Active play with kids', cal: 140 },
  ];
  const UNITS = {
    miles: { label: 'Miles', step: '0.1', min: '0.1', max: '100', placeholder: '2.5', inputmode: 'decimal' },
    calories: { label: 'Calories burned', step: '1', min: '10', max: String(100 * CALORIES_PER_MILE), placeholder: '250', inputmode: 'numeric' },
  };

  function savedUnit() {
    try { return localStorage.getItem('logUnit') === 'calories' ? 'calories' : 'miles'; } catch (e) { return 'miles'; }
  }
  function saveUnit(unit) {
    try { localStorage.setItem('logUnit', unit); } catch (e) { /* storage unavailable; the choice lasts for this screen */ }
  }

  function logScreen() {
    const unit = savedUnit();
    const u = UNITS[unit];
    return `
      <div class="page">
        <h2>Add your miles</h2>
        <p class="muted small">Walked or ran? Log miles. Did yoga, swam, biked or lifted? Log the calories you burned: every 100 calories counts as 1 mile.</p>
        <form data-form="add-miles">
          <div class="unit-toggle" role="radiogroup" aria-label="What are you logging?">
            <label><input type="radio" name="unit" value="miles" ${unit === 'miles' ? 'checked' : ''}><span>Miles</span></label>
            <label><input type="radio" name="unit" value="calories" ${unit === 'calories' ? 'checked' : ''}><span>Calories</span></label>
          </div>
          <label class="field"><span id="amount-label">${u.label}</span><input class="big" name="amount" type="number" inputmode="${u.inputmode}" step="${u.step}" min="${u.min}" max="${u.max}" placeholder="${u.placeholder}" required aria-describedby="conversion"></label>
          <p class="conversion" id="conversion" aria-live="polite">${conversionText(unit, '')}</p>
          <label class="field"><span>Note (optional)</span><input name="note" maxlength="100" placeholder="Lunch walk around the building"></label>
          <button class="button wide" type="submit">${isSolo() ? 'Add to my walk' : 'Add to the team'}</button>
        </form>
        <p class="small muted" style="margin-top:14px">Counting steps instead? About 2,000 steps is one mile.</p>
      </div>

      <div class="page">
        <h2>How other movement counts</h2>
        <p class="small muted">Every 100 calories you burn counts as 1 mile, which is about 2,000 steps. If your watch or fitness app shows calories for a workout, use that number. If not, here is about what 30 minutes burns. Tap one to fill it in.</p>
        <ul class="activity-list">
          ${ACTIVITIES.map((a) => `<li><button type="button" data-action="use-calories" data-cal="${a.cal}">
            <span class="activity-name">${esc(a.name)}</span>
            <span class="activity-numbers"><strong>${a.cal} cal</strong> = ${fmt(a.cal / CALORIES_PER_MILE, 2)} mi<small>about ${fmt(a.cal / CALORIES_PER_MILE * STEPS_PER_MILE, 0)} steps</small></span>
          </button></li>`).join('')}
        </ul>
        <p class="small muted" style="margin-top:12px">Numbers are for 30 minutes for a 155-pound adult. Did an hour? Double it. Lighter people burn a little less, heavier people a little more.</p>
      </div>`;
  }

  function conversionText(unit, raw) {
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n <= 0) {
      return unit === 'calories' ? 'Every 100 calories counts as 1 mile.' : 'About 2,000 steps is one mile.';
    }
    if (unit === 'calories') {
      const miles = Math.round(n) / CALORIES_PER_MILE;
      return `${fmt(Math.round(n), 0)} calories = <strong>${fmt(miles, 2)} miles</strong> (about ${fmt(miles * STEPS_PER_MILE, 0)} steps)`;
    }
    return `${fmt(n, 2)} miles is about ${fmt(n * STEPS_PER_MILE, 0)} steps`;
  }

  function applyUnit(form, unit, value) {
    const u = UNITS[unit];
    const input = form.querySelector('input[name="amount"]');
    form.querySelector(`input[name="unit"][value="${unit}"]`).checked = true;
    form.querySelector('#amount-label').textContent = u.label;
    for (const attr of ['step', 'min', 'max', 'placeholder', 'inputmode']) input.setAttribute(attr, u[attr]);
    input.value = value == null ? '' : value;
    form.querySelector('#conversion').innerHTML = conversionText(unit, input.value);
    saveUnit(unit);
    return input;
  }

  /* ---------- Team screen ---------- */

  function teamScreen() {
    const team = state.journey.team;
    const J = currentJourneyDef();
    const link = `${location.origin}/join/${team.invite_code}`;
    const members = state.journey.members;
    const solo = isSolo();
    const invite = `
        <div class="invite-box"><code>${esc(link)}</code><button class="button" type="button" data-action="copy-link" data-link="${esc(link)}" style="flex:0 0 auto;min-height:40px;padding:6px 14px">Copy</button></div>
        <p class="small muted" style="margin-bottom:2px">Or share the code</p>
        <p class="invite-code">${esc(team.invite_code)}</p>
        ${navigator.share ? `<button class="button quiet wide" type="button" data-action="share-link" data-link="${esc(link)}" data-team="${esc(solo ? J.title : team.name)}" data-end="${esc(J.end)}">Share invite</button>` : ''}`;
    return `
      ${solo ? `
      <div class="page">
        <h2>Walk with friends</h2>
        <p class="muted small">This is your own journey to ${esc(J.end)}. Invite a friend and their miles join yours; it becomes a group walk the moment they sign in.</p>
        ${invite}
      </div>` : `
      <div class="page">
        <h2>${esc(team.name)}</h2>
        <p class="muted small">Send this link to anyone who wants to walk with you. They sign in with Google and they're on the team.</p>
        ${invite}
      </div>

      <div class="page">
        <h2>Walking together (${members.length})</h2>
        <ul class="list">
          ${members.map((m) => `<li>
            ${m.picture ? `<img class="avatar" src="${esc(m.picture)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((m.name || '?')[0].toUpperCase())}</span>`}
            <div class="who"><strong>${esc(m.id === state.user.id ? m.name + ' (you)' : m.name)}</strong><span>joined ${esc(whenText(m.joined_at))}</span></div>
          </li>`).join('')}
        </ul>
      </div>`}

      <div class="page">
        <h2>Another trail</h2>
        <p class="muted small">You can be on more than one walk at a time: your own journey, one with work, one with family.</p>
        <button class="button quiet wide" type="button" data-action="pick-open">Start another journey</button>
        <form data-form="join-team" style="margin-top:10px">
          <div class="row">
            <label class="field" style="margin:0"><input name="code" maxlength="8" placeholder="Invite code" autocapitalize="characters" required aria-label="Invite code"></label>
            <button class="button quiet" type="submit" style="flex:0 0 auto">Join</button>
          </div>
        </form>
      </div>

      <button class="button quiet on-night wide" data-action="sign-out">Sign out</button>`;
  }

  /* ---------- Awards screen ---------- */

  function badgeIcon(name) {
    const icons = typeof BADGE_ICONS !== 'undefined' ? BADGE_ICONS : {};
    const inner = icons[name] || icons.star || '';
    return `<svg viewBox="0 0 48 48" aria-hidden="true">${inner}</svg>`;
  }

  function earnedText(sqlDate) {
    const d = new Date(sqlDate.replace(' ', 'T') + 'Z');
    const opts = { timeZone: 'America/Denver', month: 'short', day: 'numeric' };
    if (d.getFullYear() !== new Date().getFullYear()) opts.year = 'numeric';
    return 'Earned ' + d.toLocaleDateString('en-US', opts);
  }

  function badgeCard(a) {
    const pct = a.progress && a.progress.goal ? Math.min(100, (a.progress.value / a.progress.goal) * 100) : 0;
    return `<li class="badge-card ${a.earned ? 'earned' : 'locked'}">
      <div class="badge-frame">${badgeIcon(a.icon)}${a.earned && a.count > 1 ? `<span class="badge-count">×${a.count}</span>` : ''}</div>
      <h3>${esc(a.title)}</h3>
      ${a.earned
        ? `<p class="badge-status">${esc(earnedText(a.earnedAt))}</p>`
        : `<p class="badge-status">${esc(a.how)}</p>
           ${a.progress ? `<div class="badge-progress" role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct.toFixed(0)}%"></div></div>
           <p class="badge-progress-text">${esc(a.progress.text)}</p>` : ''}`}
    </li>`;
  }

  function awardsScreen() {
    const A = state.awards;
    if (!A) {
      return `<div class="page"><h2>Awards</h2><p class="muted small">Opening the trophy case…</p></div>`;
    }
    const teamEarned = A.team.filter((a) => a.earned).length;
    const mineEarned = A.personal.filter((a) => a.earned).length;
    const hero = A.hero || 'Elf';
    const solo = isSolo();
    const lastWeek = A.elfOfLastWeek && A.elfOfLastWeek.names.length
      ? `Last week's ${esc(hero)} of the Week: <strong>${esc(listNames(A.elfOfLastWeek.names))}</strong>`
      : `Last week's ${esc(hero)} of the Week: <strong>nobody logged last week</strong>`;
    return `
      ${routeNotice()}
      <div class="page">
        <h2>${solo ? 'Journey Awards' : 'Team Awards'}</h2>
        <p class="muted small">${solo ? 'Earned by reaching each stop on the trail.' : 'Everyone on the team sees these the same way.'} ${teamEarned} of ${A.team.length} earned.</p>
        ${solo ? '' : `<p class="small elf-week">${lastWeek}</p>`}
        <ul class="badges">${A.team.map(badgeCard).join('')}</ul>
      </div>
      <div class="page">
        <h2>Your Awards</h2>
        <p class="muted small">Earned by your own miles. ${mineEarned} of ${A.personal.length} earned.</p>
        <ul class="badges">${A.personal.map(badgeCard).join('')}</ul>
      </div>`;
  }

  function listNames(names) {
    if (names.length <= 1) return names.join('');
    return names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  }

  /* ---------- New-award pop-ups ---------- */

  const $awardPop = document.getElementById('award-pop');
  let popQueue = [];

  function showAwardPops(list) {
    if (!list || !list.length) return;
    popQueue = popQueue.concat(list);
    if ($awardPop.hidden) nextAwardPop();
  }

  function nextAwardPop() {
    const a = popQueue.shift();
    if (!a) { $awardPop.hidden = true; return; }
    $awardPop.innerHTML = `
      <div class="award-pop-card page" role="dialog" aria-live="assertive" aria-label="New award: ${esc(a.title)}">
        <div class="badge-frame earned">${badgeIcon(a.icon)}</div>
        <p class="award-pop-kicker">New ${a.section === 'team' ? (isSolo() ? 'journey ' : 'team ') : ''}award!</p>
        <h2>${esc(a.title)}</h2>
        <p class="small muted">${popQueue.length ? 'Tap for the next one' : 'Tap to continue'}</p>
      </div>`;
    $awardPop.hidden = false;
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
    const arrival = p.J.arrival || { title: `You made it to ${p.J.end}!`, text: '' };
    const n = state.journey.members.length;
    document.getElementById('celebration-title').textContent = arrival.title;
    document.getElementById('celebration-text').textContent = isSolo()
      ? `${fmt(p.total, 0)} miles, every one of them yours. ${arrival.text}`.trim()
      : `${fmt(p.total, 0)} miles, walked together by ${n} ${n === 1 ? 'person' : 'people'}. ${arrival.text}`.trim();
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
    if (!$awardPop.hidden && $awardPop.contains(ev.target)) { nextAwardPop(); return; }
    const el = ev.target.closest('[data-action]');
    if (!el) return;
    const action = el.dataset.action;

    if (action === 'tab') { state.tab = el.dataset.tab; renderScreen(); }

    if (action === 'pick-open') renderPick();
    if (action === 'pick-back') { state.picking = null; renderMain(); }
    if (action === 'pick-destination') renderDestination(JOURNEYS[el.dataset.journey]);
    if (action === 'pick-destination-back') renderPick();
    if (action === 'show-group-form') {
      const form = document.querySelector('form[data-form="create-team"]');
      if (form) { form.hidden = false; el.hidden = true; form.querySelector('input[name="name"]').focus(); }
    }
    if (action === 'start-solo') withBusy(async () => {
      el.disabled = true;
      try { await startWalk(el.dataset.journey, 'solo'); } finally { el.disabled = false; }
    });

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
      navigator.share({ title: `Walk with me to ${el.dataset.end}`, text: `Join ${el.dataset.team} on the walk to ${el.dataset.end}`, url: el.dataset.link }).catch(() => {});
    }

    if (action === 'delete-entry') withBusy(async () => {
      await api('/api/miles', { method: 'DELETE', body: JSON.stringify({ id: Number(el.dataset.id) }) });
      await loadJourney();
      renderScreen();
      toast('Entry removed');
    });

    if (action === 'use-calories') {
      const form = document.querySelector('form[data-form="add-miles"]');
      if (form) {
        const input = applyUnit(form, 'calories', el.dataset.cal);
        form.scrollIntoView({ behavior: 'smooth', block: 'start' });
        input.focus({ preventScroll: true });
      }
    }

    if (action === 'dismiss-notice') {
      dismissRouteNotice();
      document.querySelectorAll('.notice').forEach((n) => n.remove());
    }
    if (action === 'replay-celebration') showCelebration();
    if (action === 'close-celebration') hideCelebration();
  });

  document.addEventListener('change', (ev) => {
    if (ev.target.name === 'unit' && ev.target.form) { applyUnit(ev.target.form, ev.target.value); return; }
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

  document.addEventListener('input', (ev) => {
    if (ev.target.name !== 'amount' || !ev.target.form) return;
    const unit = ev.target.form.querySelector('input[name="unit"]:checked').value;
    document.getElementById('conversion').innerHTML = conversionText(unit, ev.target.value);
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
          await startWalk(form.dataset.journey || 'north-pole', 'team', fields.name);
        }

        if (kind === 'join-team') {
          const joined = await api('/api/join', { method: 'POST', body: JSON.stringify({ code: fields.code }) });
          const me = await api('/api/me');
          state.teams = me.teams;
          state.teamId = joined.team.id;
          localStorage.setItem('teamId', state.teamId);
          state.lastShownMile = null;
          state.picking = null;
          state.tab = 'journey';
          await loadJourney();
          renderMain();
          toast(`You joined ${joined.team.name}`);
        }

        if (kind === 'add-miles') {
          // Calories are logged as miles: every 100 calories is 1 mile.
          const byCalories = fields.unit === 'calories';
          const calories = Math.round(Number(fields.amount));
          const miles = byCalories ? calories / CALORIES_PER_MILE : fields.amount;
          let note = String(fields.note || '').trim();
          if (byCalories) note = `${fmt(calories, 0)} calories${note ? ' · ' + note : ''}`;
          const added = await api('/api/miles', { method: 'POST', body: JSON.stringify({ team_id: state.teamId, miles, note }) });
          await loadJourney();
          state.tab = 'journey';
          renderScreen();
          showAwardPops(added.newAwards);
          toast(byCalories ? `Added ${fmt(calories, 0)} calories (${fmt(added.miles, 2)} miles)` : `Added ${fmt(added.miles)} miles`, {
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
