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
    rhythm: null,       // response from /api/rhythm (streak, today, goal)
    history: null,      // response from /api/history (the You tab)
    historyMonth: null, // 'YYYY-MM' being shown on the You tab
    moment: null,       // { miles, next } shown over the scene right after an entry
    goalOpen: false,    // the goal form on the Journey tab
    tab: 'journey',
    picking: null,       // destination picker: null, or { journeyId: null | 'oz' … }
    feedOpen: false,     // "Latest on the trail" shows 6 entries, or all of them
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

  /* ---------- Units: miles are stored; kilometers are a display preference ---------- */
  const KM_PER_MILE = 1.609344;
  function units() {
    try { return localStorage.getItem('units') === 'km' ? 'km' : 'mi'; } catch (e) { return 'mi'; }
  }
  function setUnits(u) {
    try { localStorage.setItem('units', u === 'km' ? 'km' : 'mi'); } catch (e) { /* stays for this visit only */ }
  }
  const isKm = () => units() === 'km';
  // A stored mile value as the number the walker sees.
  function dnum(miles) { return isKm() ? Number(miles) * KM_PER_MILE : Number(miles); }
  // "2.5 mi" / "4 km"
  function fmtDist(miles, digits = 1) { return `${fmt(dnum(miles), digits)} ${units()}`; }
  // The long unit word: "miles" / "kilometers"
  function unitWord() { return isKm() ? 'km' : 'miles'; }
  // A typed number in the walker's unit, as miles for the server.
  function toMiles(n) { return isKm() ? Number(n) / KM_PER_MILE : Number(n); }
  // Awards progress text comes from the server in miles; swap it when showing km.
  function progressText(a) {
    const t = a.progress && a.progress.text ? a.progress.text : '';
    if (!isKm()) return t;
    const m = t.match(/^(.*?)([\d,.]+) \/ ([\d,.]+) miles$/);
    return m ? `${m[1]}${fmt(dnum(a.progress.value), 1)} / ${fmt(dnum(a.progress.goal), 0)} km` : t;
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

  function journeyDefFor(team) {
    if (!team) return JOURNEYS['north-pole'];
    if (team.journey_id === 'custom' && team.custom) return customJourney(team.custom);
    return JOURNEYS[team.journey_id] || JOURNEYS['north-pole'];
  }

  function currentJourneyDef() {
    return journeyDefFor(state.journey && state.journey.team);
  }

  // The sample shown on the "somewhere real" card.
  const CUSTOM_SAMPLE = { start: { name: 'Your front door' }, end: { name: 'Anywhere' }, miles: 500 };

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
    return `About ${fmtDist(perDay, 1)} a day gets you there in a year.`;
  }

  // The card under the mile post: the office poster's "Remember" note, a "Did you know?" fact, or road lore.
  function stopCard(wp) {
    if (wp.remember) return { heading: 'Remember', text: wp.remember };
    if (wp.lore) return { heading: 'Road lore', text: wp.lore };
    return { heading: 'Did you know?', text: wp.fact || '' };
  }

  function teamLabel(t) {
    const J = journeyDefFor(t);
    return t.kind === 'solo' ? `${t.name} · ${J.end}` : t.name;
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
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* the app works without it */ });
    }
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
    const before = state.journey && state.journey.team.id;
    const [journey, rhythm] = await Promise.all([
      api('/api/journey?team=' + encodeURIComponent(state.teamId)),
      api('/api/rhythm').catch(() => null),
    ]);
    state.journey = journey;
    state.rhythm = rhythm;
    state.awards = null; // miles changed, so awards may have too
    state.history = null;
    if (before !== state.journey.team.id) state.feedOpen = false;
  }

  async function loadHistory(month) {
    const data = await api('/api/history' + (month ? '?month=' + encodeURIComponent(month) : ''));
    state.history = data;
    state.historyMonth = `${data.year}-${String(data.month).padStart(2, '0')}`;
    if (state.tab === 'you') renderScreen();
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

  // The Stroll mark: a wooden signpost with two arrows and a path running off into the distance.
  function markSvg() {
    return `<svg class="cover-mark" viewBox="0 0 96 96" aria-hidden="true">
      <ellipse cx="48" cy="84" rx="30" ry="6" fill="rgba(255,255,255,0.12)"/>
      <path d="M22 84 Q48 70 74 84" fill="none" stroke="#e2b04c" stroke-width="3" stroke-linecap="round" stroke-dasharray="6 5"/>
      <rect x="44" y="30" width="8" height="54" rx="2" fill="#7b4a21"/>
      <path d="M20 36 h38 l8 7 l-8 7 h-38 z" fill="#ecd9ae" stroke="#7b4a21" stroke-width="2" stroke-linejoin="round" transform="rotate(-3 39 43)"/>
      <path d="M76 54 h-38 l-8 7 l8 7 h38 z" fill="#ecd9ae" stroke="#7b4a21" stroke-width="2" stroke-linejoin="round" transform="rotate(2 57 61)"/>
      <circle cx="48" cy="22" r="7" fill="#e2b04c"/><circle cx="48" cy="22" r="7" fill="none" stroke="#b98624" stroke-width="1.5"/>
    </svg>`;
  }

  function renderCover() {
    const setupItems = [];
    if (!state.config.dbReady) setupItems.push('Connect the D1 database (the <code>DB</code> binding in <code>wrangler.toml</code>).');
    if (!state.config.googleClientId) setupItems.push('Add your Google client ID to <code>wrangler.toml</code>.');

    $app.innerHTML = `
      <section class="cover">
        ${markSvg()}
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
          <li class="destination theme-road">
            <button type="button" data-action="pick-custom">
              <span class="destination-art" aria-hidden="true">${destinationArt(customJourney(CUSTOM_SAMPLE))}</span>
              <span class="destination-copy">
                <strong>Somewhere real</strong>
                <span class="destination-miles">Any place on the map · you pick the start and the finish</span>
                <span class="destination-blurb">Grandma's house, the beach you love, a city you've always wanted to see. Type the two places and we'll measure the road between them.</span>
              </span>
            </button>
          </li>
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
          <span class="destination-miles">${fmtDist(J.totalMiles, 0)} · ${esc(J.start)} to ${esc(J.end)}</span>
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
            <div class="team-name">${fmtDist(J.totalMiles, 0)} · ${esc(J.start)} to ${esc(J.end)}</div>
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
            ${stops.map((w) => `<li><span class="stop-mile">${fmt(dnum(w.mile), 0)}</span><span>${esc(capitalize(w.name))}</span></li>`).join('')}
          </ol>
        </div>
      </section>`;
    window.scrollTo({ top: 0 });
  }

  /* ---------- A real-world destination ---------- */

  // The form remembers what was looked up so the chosen places survive re-renders.
  const customForm = { startQ: '', endQ: '', starts: null, ends: null, start: null, end: null, busy: false, error: '' };

  function renderCustom() {
    state.picking = { journeyId: 'custom' };
    const f = customForm;
    const miles = f.start && f.end ? previewMiles(f.start, f.end) : null;
    const chooser = (field, list, chosen) => list && list.length > 1 ? `
        <select data-action="custom-choose" data-field="${field}" aria-label="Which one?">
          ${list.map((p, i) => `<option value="${i}" ${chosen === p ? 'selected' : ''}>${esc(p.name)}</option>`).join('')}
        </select>` : list && list.length === 1 ? `<p class="small found">${esc(list[0].name)}</p>` : list ? `<p class="small error-note">Nothing found. Try adding the state or country.</p>` : '';
    $app.innerHTML = `
      <section>
        <div class="header">
          <div>
            <h1>Somewhere real</h1>
            <div class="team-name">Any two places on the map</div>
          </div>
          <button class="button quiet on-night" type="button" data-action="pick-destination-back" style="min-height:40px;padding:6px 14px">Back</button>
        </div>
        <div class="page scene-page destination-preview theme-road" aria-hidden="true">${destinationArt(customJourney(f.start && f.end ? { start: f.start, end: f.end, miles } : CUSTOM_SAMPLE))}</div>
        <div class="page">
          <form data-form="custom-lookup">
            <label class="field"><span>Starting from</span><input name="start" maxlength="120" placeholder="Layton, Utah" value="${esc(f.startQ)}" required></label>
            ${chooser('start', f.starts, f.start)}
            <label class="field"><span>Walking to</span><input name="end" maxlength="120" placeholder="Grand Canyon" value="${esc(f.endQ)}" required></label>
            ${chooser('end', f.ends, f.end)}
            ${f.error ? `<p class="small error-note">${esc(f.error)}</p>` : ''}
            <button class="button quiet wide" type="submit" ${f.busy ? 'disabled' : ''}>${f.busy ? 'Looking up…' : (f.starts ? 'Look up again' : 'Find the route')}</button>
          </form>
          ${miles ? `
          <div class="route-summary">
            <h2>${fmtDist(miles, 0)}</h2>
            <p class="small muted">${esc(f.start.name)} to ${esc(f.end.name)}, as the roads run (straight-line distance plus a fifth). ${esc(dailyHint({ totalMiles: miles }))}</p>
          </div>
          <div class="start-buttons">
            <button class="button wide" type="button" data-action="start-custom-solo">Walk it on my own</button>
            <button class="button quiet wide" type="button" data-action="show-group-form">Start a group walk</button>
          </div>
          <form data-form="create-team" data-journey="custom" hidden>
            <label class="field"><span>Group name</span><input name="name" maxlength="60" placeholder="The Lunch Walkers" required></label>
            <button class="button wide" type="submit">Start the group walk</button>
          </form>` : ''}
          <p class="small muted" style="margin-top:14px">Place names come from OpenStreetMap, © OpenStreetMap contributors.</p>
        </div>
      </section>`;
    window.scrollTo({ top: 0 });
  }

  // Same sum the server uses, so the number shown is the number saved.
  function previewMiles(a, b) {
    const R = 3958.8, toRad = (d) => (d * Math.PI) / 180;
    const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
    return Math.max(1, Math.round(2 * R * Math.asin(Math.min(1, Math.sqrt(h))) * 1.2));
  }

  async function lookupPlaces(q) {
    const res = await api('/api/places?q=' + encodeURIComponent(q));
    return res.places || [];
  }

  function customPayload() {
    const f = customForm;
    return { start: f.start, end: f.end };
  }

  async function startWalk(journeyId, kind, name, custom) {
    const made = await api('/api/teams', { method: 'POST', body: JSON.stringify({ journey_id: journeyId, kind, name, custom }) });
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
          <div class="team-name">${solo ? `Your own journey · ${esc(team.name)}` : esc(team.name)}</div>
        </div>
        <div class="header-tools">
          ${switcher}
          <button type="button" class="gear" data-action="open-settings" aria-label="Settings">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>
          </button>
        </div>
      </div>
      <div id="screen"></div>
      <nav class="nav" aria-label="Sections"><div class="nav-inner">
        ${navButton('journey', 'Journey', '<path d="M4 18c4-6 6-6 8 0s4 6 8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="20" cy="6" r="2.5" fill="currentColor"/>')}
        ${navButton('log', isKm() ? 'Add km' : 'Add miles', '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}
        ${navButton('team', solo ? 'Friends' : 'Team', '<circle cx="9" cy="9" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="10" r="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 19c0-3 3-5 6-5s6 2 6 5M15 15c3 0 5 1.5 5 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>')}
        ${navButton('awards', 'Awards', '<path d="M12 3l2.6 5.4 5.9.8-4.3 4.1 1.1 5.8L12 16.3 6.7 19.1l1.1-5.8L3.5 9.2l5.9-.8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>')}
        ${navButton('you', 'You', '<rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 10h16M9 3v4M15 3v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="15" r="1.6" fill="currentColor"/>')}
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
    if (state.tab === 'you') $screen.innerHTML = youScreen();
    if (state.tab === 'settings') $screen.innerHTML = settingsScreen();
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
    if (state.tab === 'you' && !state.history) loadHistory(state.historyMonth).catch((e) => toast(e.message));
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
    const all = state.journey.recent;
    const recent = state.feedOpen ? all : all.slice(0, 6);

    const who = isSolo() ? 'You are' : 'Your team is';
    const where = p.arrived
      ? `${who} ${esc(p.J.waypoints[p.J.waypoints.length - 1].region)}.`
      : `${who} ${esc(p.here.region)}.${p.next ? ` Next up: ${esc(capitalize(p.next.name))}, ${fmtDist(p.next.mile - p.mile, 0)} ahead.` : ''}`;
    const card = stopCard(p.here);
    const inviteLink = `${location.origin}/join/${state.journey.team.invite_code}`;

    return `
      ${routeNotice()}
      <div class="page scene-page">
        <div id="scene" class="scene"></div>
      </div>

      ${momentBanner(p)}
      ${installHint()}
      ${rhythmCard(p)}

      <div class="page milepost-page">
        <div class="milepost" aria-hidden="true">
          <div class="board"><div class="label">${isKm() ? 'KM' : 'MILE'}</div><div class="number">${fmt(Math.floor(dnum(p.mile)), 0)}</div></div>
          <div class="post"></div>
          <div class="ground"></div>
        </div>
        <div class="progress-copy">
          <h2>${fmt(dnum(p.total), 0)} of ${fmtDist(p.goal, 0)}</h2>
          <div class="progress-bar" role="progressbar" aria-valuenow="${Math.round(p.pct)}" aria-valuemin="0" aria-valuemax="100"><div id="progress-fill" style="width:0%"></div></div>
          <p class="small">${p.arrived ? 'Journey complete' : p.total <= 0 ? `<strong>Take your first step.</strong> ${fmtDist(p.goal, 0)} to ${esc(p.J.end)}` : `${Math.floor(p.pct)}% there, ${fmtDist(p.goal - p.total, 0)} to go`}</p>
          <p class="small muted">${p.total <= 0 ? `The marker is waiting at ${esc(p.J.start)}. Your first walk moves it.` : where}</p>
          ${p.arrived ? `<button class="button quiet" data-action="replay-celebration" style="margin-top:6px">Replay the celebration</button>` : ''}
        </div>
      </div>

      <div class="page fact remember">
        <h2>${esc(card.heading)}</h2>
        <p>${esc(card.text)}</p>
        <p class="remember-from">${esc(capitalize(p.here.name))} · ${isKm() ? 'km' : 'mile'} ${fmt(dnum(p.here.mile), 0)}</p>
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
        <h2>Your ${unitWord()}</h2>
        <div class="big-number">${fmt(dnum(state.journey.myTotal))}<small>${unitWord()} so far</small></div>
        <p class="small muted" style="margin-top:8px">Every ${isKm() ? 'kilometer' : 'mile'} you add moves the whole team along the trail.</p>
        <button class="button" data-action="tab" data-tab="log" style="margin-top:8px">Add miles</button>
      </div>`}

      <div class="page">
        <h2>Latest on the trail</h2>
        ${!isSolo() && state.journey.features && state.journey.features.cheers ? `<p class="small muted">Tap the heart to cheer someone on.</p>` : ''}
        ${recent.length ? `<ul class="list">${recent.map(entryRow).join('')}</ul>`
          : `<div class="first-step"><p class="muted">${isSolo() ? 'No miles yet. Even a walk around the block counts.' : 'No miles yet. Be the first to take a step.'}</p><button class="button" data-action="tab" data-tab="log">Log your first walk</button></div>`}
        ${all.length > 6 && !state.feedOpen ? `<button class="button quiet wide" type="button" data-action="feed-more" style="margin-top:10px">Show more</button>` : ''}
      </div>`;
  }

  /* ---------- "You are here": the moment right after an entry ---------- */

  function momentBanner(p) {
    const m = state.moment;
    if (!m) return '';
    state.moment = null; // shows once
    const next = p.arrived ? `You have arrived at ${esc(p.J.end)}.`
      : p.next ? `${fmtDist(p.next.mile - p.mile, 1)} to ${esc(p.next.name)}.` : '';
    setTimeout(() => { const el = document.getElementById('moment'); if (el) el.classList.add('gone'); }, m.first ? 7000 : 4200);
    if (m.first) {
      return `<div id="moment" class="moment first" role="status">
        <strong>+${fmtDist(m.miles)}</strong><span><b>Your first step!</b> The journey to ${esc(p.J.end)} has begun. ${next}</span>
      </div>`;
    }
    return `<div id="moment" class="moment" role="status">
      <strong>+${fmtDist(m.miles)}</strong><span>You are here. ${next}</span>
    </div>`;
  }

  /* ---------- Daily rhythm: today's ring, streak, next stop ---------- */

  function rhythmCard(p) {
    const R = state.rhythm;
    if (!R) return '';
    const goal = R.goal;
    const period = goal ? goal.period : 'day';
    const done = period === 'week' ? R.weekMiles : R.todayMiles;
    const target = goal ? goal.miles : null;
    const pct = target ? Math.min(100, (done / target) * 100) : 0;
    const nextStop = !p.arrived && p.next ? `${fmtDist(p.next.mile - p.mile, 1)} to ${esc(p.next.name)}` : p.arrived ? 'Journey complete' : '';
    const streakText = R.streak >= 2 ? `${R.streak}-day streak${R.walkedToday ? '' : ' · walk today to keep it'}`
      : R.streak === 1 ? (R.walkedToday ? 'Day 1 of a streak' : 'Walked yesterday · walk today to start a streak')
      : 'Walk today to start a streak';
    const ringLabel = target
      ? `${fmt(dnum(done), 1)} of ${fmtDist(target, 1)} ${period === 'week' ? 'this week' : 'today'}`
      : `${fmtDist(done, 1)} ${period === 'week' ? 'this week' : 'today'}`;
    const goalForm = state.goalOpen ? `
        <form data-form="set-goal" class="goal-form">
          <div class="row">
            <label class="field" style="margin:0"><span class="visually-hidden">Distance</span><input name="miles" type="number" inputmode="decimal" step="0.1" min="0" max="800" value="${goal ? fmt(dnum(goal.miles), 1).replace(/,/g, '') : isKm() ? '3' : '2'}" required aria-label="Goal distance"></label>
            <select name="period" aria-label="Per day or per week">
              <option value="day" ${period === 'day' ? 'selected' : ''}>${unitWord()} a day</option>
              <option value="week" ${period === 'week' ? 'selected' : ''}>${unitWord()} a week</option>
            </select>
          </div>
          <div class="row" style="margin-top:8px">
            <button class="button" type="submit">Save goal</button>
            ${goal ? `<button class="button quiet" type="button" data-action="clear-goal">No goal</button>` : `<button class="button quiet" type="button" data-action="toggle-goal">Cancel</button>`}
          </div>
        </form>` : '';
    return `
      <div class="page rhythm">
        <button type="button" class="ring-button" data-action="toggle-goal" aria-label="${target ? 'Change your goal' : 'Set a goal'}">
          <svg class="ring" viewBox="0 0 80 80" aria-hidden="true">
            <circle class="ring-track" cx="40" cy="40" r="34"/>
            <circle class="ring-fill ${pct >= 100 ? 'done' : ''}" cx="40" cy="40" r="34" style="stroke-dashoffset:${(213.6 * (1 - pct / 100)).toFixed(1)}"/>
          </svg>
          <span class="ring-number">${target ? Math.round(pct) + '%' : fmt(dnum(done), 1)}</span>
        </button>
        <div class="rhythm-copy">
          <strong>${ringLabel}</strong>
          <span class="streak ${R.walkedToday && R.streak >= 2 ? 'hot' : ''}">${flameSvg()} ${esc(streakText)}</span>
          ${nextStop ? `<span class="next-stop">${nextStop}</span>` : ''}
          ${!state.goalOpen ? `<button type="button" class="button link" data-action="toggle-goal">${target ? 'Change goal' : (R.features && R.features.goal ? 'Set a daily goal' : '')}</button>` : ''}
        </div>
        ${goalForm}
        ${!p.arrived ? `<div class="quick-row in-rhythm" aria-label="Quick add">${QUICK_ADD.map((m) => `<button type="button" class="quick" data-action="quick-add" data-amount="${m}">+${m}<small>${units()}</small></button>`).join('')}</div>` : ''}
      </div>`;
  }

  function flameSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 5 5 11a5 5 0 0 1-10 0c0-3 1.5-4 2-6 1 1.5 1.5 2 2 3 .5-2.5-.5-5 1-8z"/></svg>';
  }

  function entryRow(e) {
    const mine = e.user_id === state.user.id;
    const cheersOn = !isSolo() && state.journey.features && state.journey.features.cheers;
    return `<li data-entry="${e.id}">
      <span class="avatar">${esc((e.name || '?')[0].toUpperCase())}</span>
      <div class="who"><strong>${esc(mine ? 'You' : e.name)}</strong><span>${esc(whenText(e.logged_at))}${e.note ? ' · ' + esc(e.note) : ''}</span>${cheersOn ? cheerLine(e) : ''}</div>
      <span class="miles">${fmtDist(e.miles)}</span>
      ${mine ? `<button type="button" class="undo" data-action="edit-entry" data-id="${e.id}" aria-label="Edit this entry">edit</button>`
        : cheersOn ? `<button type="button" class="cheer ${e.cheered ? 'on' : ''}" data-action="cheer" data-id="${e.id}" aria-pressed="${e.cheered ? 'true' : 'false'}" aria-label="${e.cheered ? 'Take back your cheer' : 'Cheer'}">${heartSvg()}<b>${e.cheers || ''}</b></button>` : ''}
    </li>`;
  }

  function heartSvg() {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5l-1.3-1.2C5.4 14.5 2 11.4 2 7.6 2 4.6 4.4 2.5 7.2 2.5c1.7 0 3.3.8 4.3 2.1 1-1.3 2.6-2.1 4.3-2.1 2.8 0 5.2 2.1 5.2 5.1 0 3.8-3.4 6.9-8.7 11.7L12 20.5z"/></svg>';
  }

  // "You and Sam cheered", "Sam, Jo and 2 others cheered"
  function cheerLine(e) {
    const n = e.cheers || 0;
    if (!n) return '';
    const names = (e.cheer_names || []).slice();
    if (e.cheered) names.unshift('You');
    const others = n - names.length;
    let text = listNames(names);
    if (others > 0) text += `${names.length ? ' and ' : ''}${others} ${others === 1 ? 'other' : 'others'}`;
    return `<em class="cheer-line">${esc(text)} cheered</em>`;
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

    const post = document.querySelector('.milepost .board');
    if (post && from != null && Math.abs(from - p.mile) >= 0.05) { post.classList.remove('pulse'); void post.offsetWidth; post.classList.add('pulse'); }
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
    miles: { label: 'Miles', step: '0.01', min: '0.01', max: '100', placeholder: '2.5', inputmode: 'decimal' },
    km: { label: 'Kilometers', step: '0.01', min: '0.01', max: '160', placeholder: '4', inputmode: 'decimal' },
    steps: { label: 'Steps', step: '1', min: '100', max: String(100 * STEPS_PER_MILE), placeholder: '4000', inputmode: 'numeric' },
    calories: { label: 'Calories burned', step: '1', min: '10', max: String(100 * CALORIES_PER_MILE), placeholder: '250', inputmode: 'numeric' },
  };
  const QUICK_ADD = [0.5, 1, 2, 3]; // in the walker's unit

  function savedUnit() {
    try { const u = localStorage.getItem('logUnit'); return UNITS[u] ? u : 'miles'; } catch (e) { return 'miles'; }
  }

  // The entry being edited on the Add miles screen, or null when adding.
  let editing = null;

  function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function isoOf(sqlDate) {
    const d = new Date(sqlDate.replace(' ', 'T') + 'Z');
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function myLastEntry() {
    return (state.journey && state.journey.recent.find((e) => e.user_id === state.user.id)) || null;
  }
  function saveUnit(unit) {
    try { localStorage.setItem('logUnit', unit); } catch (e) { /* storage unavailable; the choice lasts for this screen */ }
  }

  function logScreen() {
    const distUnit = isKm() ? 'km' : 'miles';
    const saved = savedUnit();
    const unit = editing ? distUnit : ((saved === 'miles' || saved === 'km') ? distUnit : saved);
    const u = UNITS[unit];
    const last = myLastEntry();
    const today = todayIso();
    const editDate = editing ? isoOf(editing.logged_at) : today;
    const quick = QUICK_ADD.map((m) => `<button type="button" class="quick" data-action="quick-add" data-amount="${m}">+${m}<small>${units()}</small></button>`).join('');
    return `
      ${editing ? '' : `
      <div class="page">
        <h2>Quick add</h2>
        <p class="muted small">One tap logs a walk for today.</p>
        <div class="quick-row">${quick}</div>
      </div>`}

      <div class="page">
        <h2>${editing ? 'Edit your entry' : `Add your ${unitWord()}`}</h2>
        ${editing ? `<p class="muted small">Logged ${esc(whenText(editing.logged_at))}. Change the number, the note or the day, then save.</p>`
          : `<p class="muted small">Walked or ran? Log miles or steps. Did yoga, swam, biked or lifted? Log the calories you burned: every 100 calories counts as 1 mile.</p>`}
        <form data-form="add-miles" ${editing ? `data-edit="${editing.id}"` : ''}>
          ${editing ? '' : `
          <div class="unit-toggle" role="radiogroup" aria-label="What are you logging?">
            <label><input type="radio" name="unit" value="${distUnit}" ${unit === distUnit ? 'checked' : ''}><span>${isKm() ? 'Km' : 'Miles'}</span></label>
            <label><input type="radio" name="unit" value="steps" ${unit === 'steps' ? 'checked' : ''}><span>Steps</span></label>
            <label><input type="radio" name="unit" value="calories" ${unit === 'calories' ? 'checked' : ''}><span>Calories</span></label>
          </div>`}
          <label class="field"><span id="amount-label">${u.label}</span><input class="big" name="amount" type="number" inputmode="${u.inputmode}" step="${u.step}" min="${u.min}" max="${u.max}" placeholder="${u.placeholder}" value="${editing ? fmt(dnum(editing.miles), 2).replace(/,/g, '') : ''}" required aria-describedby="conversion"></label>
          <p class="conversion" id="conversion" aria-live="polite">${conversionText(unit, editing ? fmt(dnum(editing.miles), 2).replace(/,/g, '') : '')}</p>
          <label class="field"><span>Note (optional)</span><input name="note" maxlength="100" placeholder="Lunch walk around the building" value="${editing ? esc(editing.note || '') : ''}"></label>
          <details class="when" ${editing && editDate !== today ? 'open' : ''}>
            <summary>${editing ? 'Change the day' : 'Missed a day? Log it for another date'}</summary>
            <label class="field"><span>Day</span><input name="date" type="date" value="${editDate}" max="${today}"></label>
          </details>
          <button class="button wide" type="submit">${editing ? 'Save changes' : isSolo() ? 'Add to my walk' : 'Add to the team'}</button>
          ${editing ? `<div class="row" style="margin-top:8px"><button class="button quiet" type="button" data-action="cancel-edit">Cancel</button><button class="button quiet" type="button" data-action="delete-entry" data-id="${editing.id}">Remove entry</button></div>` : ''}
        </form>
      </div>

      ${!editing && last ? `
      <div class="page last-entry">
        <h2>Your last entry</h2>
        <ul class="list"><li>
          <div class="who"><strong>${fmtDist(last.miles)}</strong><span>${esc(whenText(last.logged_at))}${last.note ? ' · ' + esc(last.note) : ''}</span></div>
          <button type="button" class="button quiet small-btn" data-action="edit-entry" data-id="${last.id}">Edit</button>
          <button type="button" class="button quiet small-btn" data-action="delete-entry" data-id="${last.id}">Remove</button>
        </li></ul>
      </div>` : ''}

      ${editing ? '' : `
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
      </div>`}`;
  }

  function conversionText(unit, raw) {
    const n = Number(raw);
    if (raw === '' || !Number.isFinite(n) || n <= 0) {
      return unit === 'calories' ? 'Every 100 calories counts as 1 mile.' : unit === 'km' ? 'About 1,250 steps is one kilometer.' : 'About 2,000 steps is one mile.';
    }
    if (unit === 'km') return `${fmt(n, 2)} km is about ${fmt(n / KM_PER_MILE * STEPS_PER_MILE, 0)} steps`;
    if (unit === 'steps') {
      const miles = Math.round(n) / STEPS_PER_MILE;
      return `${fmt(Math.round(n), 0)} steps = <strong>${fmt(miles, 2)} miles</strong>`;
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
        <div class="invite-card">
          <div><p class="small muted" style="margin-bottom:2px">Invite code</p><p class="invite-code">${esc(team.invite_code)}</p></div>
          <div class="invite-actions">
            <button class="button" type="button" data-action="copy-link" data-link="${esc(link)}">Copy link</button>
            ${navigator.share ? `<button class="button quiet" type="button" data-action="share-link" data-link="${esc(link)}" data-team="${esc(solo ? J.title : team.name)}" data-end="${esc(J.end)}">Share</button>` : ''}
          </div>
        </div>
        <p class="small muted">Friends open the link, sign in with Google, and they're on the walk. Or they type the code under "Have an invite?".</p>`;
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

      ${standingsCard()}

      ${team.created_by === state.user.id ? `
      <div class="page">
        <h2>${solo ? 'Name this walk' : 'Rename the group'}</h2>
        <form data-form="rename-team">
          <div class="row">
            <label class="field" style="margin:0"><input name="name" maxlength="60" value="${esc(team.name)}" required aria-label="Walk name"></label>
            <button class="button quiet" type="submit" style="flex:0 0 auto">Save</button>
          </div>
        </form>
      </div>` : ''}

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
      </div>`;
  }

  function standingsCard() {
    const J = state.journey;
    if (isSolo() || !J.features || !J.features.leaderboard) return '';
    const owner = J.team.created_by === state.user.id;
    const on = Boolean(J.team.leaderboard);
    const toggle = owner ? `
        <label class="switch"><input type="checkbox" data-action="toggle-leaderboard" ${on ? 'checked' : ''}><span>Show the leaderboard to everyone</span></label>` : '';
    if (!on) {
      return owner ? `<div class="page"><h2>Leaderboard</h2><p class="muted small">Off. Only you can see this switch.</p>${toggle}</div>` : '';
    }
    const rows = (J.standings || []).map((m, i) => `<li class="${m.id === state.user.id ? 'me' : ''}">
        <span class="rank">${i < 3 && m.total > 0 ? ['🥇', '🥈', '🥉'][i] : i + 1}</span>
        ${m.picture ? `<img class="avatar" src="${esc(m.picture)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar">${esc((m.name || '?')[0].toUpperCase())}</span>`}
        <div class="who"><strong>${esc(m.id === state.user.id ? m.name + ' (you)' : m.name)}</strong><span>${fmtDist(m.week)} this week</span></div>
        <span class="miles">${fmtDist(m.total)}</span>
      </li>`).join('');
    return `<div class="page">
        <h2>Leaderboard</h2>
        <p class="muted small">Miles so far, with this week's miles underneath (Monday to Sunday).</p>
        <ol class="list standings">${rows}</ol>
        ${toggle}
      </div>`;
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
           <p class="badge-progress-text">${esc(progressText(a))}</p>` : ''}`}
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

  /* ---------- Settings ---------- */

  let deferredInstall = null; // Chrome's install prompt, if the browser offers one
  window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  function installHelp() {
    if (isStandalone()) return `<p class="small muted">Stroll is on your home screen already.</p>`;
    if (deferredInstall) return `<button class="button" type="button" data-action="install">Add Stroll to your home screen</button>`;
    if (isIOS()) return `<p class="small">In Safari, tap <strong>Share</strong> (the square with the arrow), then <strong>Add to Home Screen</strong>.</p>`;
    return `<p class="small">In your browser's menu, choose <strong>Add to Home screen</strong> or <strong>Install app</strong>.</p>`;
  }

  function settingsScreen() {
    return `
      <div class="page">
        <div class="cal-head"><h2>Settings</h2><button type="button" class="button quiet small-btn" data-action="close-settings">Done</button></div>
        <p class="small muted">${esc(state.user.name)} · ${esc(state.user.email)}</p>
      </div>
      <div class="page">
        <h2>Distances</h2>
        <div class="unit-toggle" role="radiogroup" aria-label="Distance units">
          <label><input type="radio" name="units" value="mi" data-action="set-units" ${!isKm() ? 'checked' : ''}><span>Miles</span></label>
          <label><input type="radio" name="units" value="km" data-action="set-units" ${isKm() ? 'checked' : ''}><span>Kilometers</span></label>
        </div>
        <p class="small muted">Shown everywhere, and used when you type a distance. Miles are kept underneath, so friends can use either.</p>
      </div>
      <div class="page">
        <h2>On your phone</h2>
        <p class="small muted">Stroll works like an app from your home screen: full screen, one tap away.</p>
        ${installHelp()}
      </div>
      <div class="page">
        <h2>Account</h2>
        <button class="button quiet wide" data-action="sign-out">Sign out</button>
        <p class="small" style="text-align:center;margin-top:12px"><button class="button link" type="button" data-action="delete-account">Delete my account</button></p>
        <p class="small muted" style="text-align:center;margin-top:8px"><a href="/privacy.html">Privacy</a></p>
      </div>`;
  }

  // After the first entry, offer the home screen once (never inside the installed app).
  function installHint() {
    if (isStandalone()) return '';
    let due = false, dismissed = false;
    try { due = localStorage.getItem('installHintDue') === '1'; dismissed = localStorage.getItem('installHintDismissed') === '1'; } catch (e) { /* no storage */ }
    if (!due || dismissed) return '';
    return `<div class="page notice" role="status">
      <p><strong>Keep Stroll one tap away.</strong> ${deferredInstall ? 'Add it to your home screen and it opens like an app.' : isIOS() ? 'In Safari, tap Share, then Add to Home Screen.' : 'In your browser menu, choose Add to Home screen.'}</p>
      ${deferredInstall ? `<button class="button" type="button" data-action="install" style="min-height:40px;padding:6px 16px">Add</button>` : ''}
      <button class="button quiet" type="button" data-action="dismiss-install" style="min-height:40px;padding:6px 16px">Not now</button>
    </div>`;
  }

  /* ---------- You: calendar and history ---------- */

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  function shiftMonth(ym, delta) {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + delta, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  function youScreen() {
    const Hs = state.history;
    const R = state.rhythm;
    const first = (state.user.name || '').split(' ')[0];
    if (!Hs) return `<div class="page"><h2>${esc(first)}</h2><p class="muted small">Opening your walking diary…</p></div>`;
    const ym = `${Hs.year}-${String(Hs.month).padStart(2, '0')}`;
    const isThisMonth = Hs.today.year === Hs.year && Hs.today.month === Hs.month;
    const maxDay = Math.max(0.1, ...Object.values(Hs.days));
    let cells = '';
    for (let i = 0; i < Hs.firstWeekday; i++) cells += '<span class="cal-cell empty"></span>';
    for (let d = 1; d <= Hs.daysInMonth; d++) {
      const mi = Hs.days[d] || 0;
      const future = isThisMonth && d > Hs.today.day;
      const today = isThisMonth && d === Hs.today.day;
      const size = mi ? (0.45 + 0.55 * Math.min(1, mi / maxDay)).toFixed(2) : 0;
      cells += `<span class="cal-cell ${mi ? 'walked' : ''} ${today ? 'today' : ''} ${future ? 'future' : ''}" title="${mi ? fmt(mi, 1) + ' mi' : ''}">
        <i style="transform:scale(${size})"></i><b>${d}</b>${mi ? `<small>${fmt(dnum(mi), dnum(mi) >= 10 ? 0 : 1)}</small>` : ''}</span>`;
    }
    const grouped = [];
    const shown = state.feedOpen ? Hs.entries : Hs.entries.slice(0, 30);
    for (const e of shown) {
      const last = grouped[grouped.length - 1];
      if (last && last.day === e.day) last.items.push(e); else grouped.push({ day: e.day, items: [e] });
    }
    const stats = R ? `
        <ul class="stat-row">
          <li><strong>${R.streak}</strong><span>day streak</span></li>
          <li><strong>${R.bestStreak}</strong><span>best streak</span></li>
          <li><strong>${fmt(dnum(Hs.allTimeMiles), 0)}</strong><span>${unitWord()} ever</span></li>
          <li><strong>${R.daysWalked}</strong><span>days walked</span></li>
        </ul>` : '';
    return `
      <div class="page">
        <h2>${esc(first)}'s walking diary</h2>
        ${stats}
      </div>
      <div class="page">
        <div class="cal-head">
          <button type="button" class="button quiet small-btn" data-action="history-month" data-month="${shiftMonth(ym, -1)}" aria-label="Previous month">‹</button>
          <h2>${MONTHS[Hs.month - 1]} ${Hs.year}</h2>
          <button type="button" class="button quiet small-btn" data-action="history-month" data-month="${shiftMonth(ym, 1)}" aria-label="Next month" ${isThisMonth ? 'disabled' : ''}>›</button>
        </div>
        <p class="small muted">${fmtDist(Hs.total, 1)} this month · ${Object.keys(Hs.days).length} ${Object.keys(Hs.days).length === 1 ? 'day' : 'days'} walked</p>
        <div class="cal-grid" role="grid" aria-label="Days walked this month">
          ${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d) => `<span class="cal-dow">${d}</span>`).join('')}
          ${cells}
        </div>
      </div>
      <div class="page">
        <h2>Walks this month</h2>
        ${grouped.length ? grouped.map((g) => `
          <h3 class="day-head">${MONTHS[Hs.month - 1].slice(0, 3)} ${g.day}<span>${fmtDist(Hs.days[g.day] || 0, 1)}</span></h3>
          <ul class="list">${g.items.map((e) => `<li>
            <div class="who"><strong>${fmtDist(e.miles)}${e.note ? ` · ${esc(e.note)}` : ''}</strong><span>${esc(e.team_id === state.teamId ? 'this walk' : e.team_name)}</span></div>
            ${e.team_id === state.teamId ? `<button type="button" class="undo" data-action="edit-entry" data-id="${e.id}">edit</button>` : ''}
          </li>`).join('')}</ul>`).join('')
          : `<p class="muted">No walks logged this month${isThisMonth ? ' yet. Today is a good day for one.' : '.'}</p>`}
        ${Hs.entries.length > shown.length ? `<button class="button quiet wide" type="button" data-action="feed-more" style="margin-top:10px">Show all ${Hs.entries.length}</button>` : ''}
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
    if (!a) { $awardPop.hidden = true; stopBurst(); return; }
    if (a.section === 'team' && (a.kind === 'stop' || a.kind === 'milestone' || a.kind === 'border')) burst();
    $awardPop.innerHTML = `
      <div class="award-pop-card page" role="dialog" aria-live="assertive" aria-label="New award: ${esc(a.title)}">
        <div class="badge-frame earned">${badgeIcon(a.icon)}</div>
        <p class="award-pop-kicker">New ${a.section === 'team' ? (isSolo() ? 'journey ' : 'team ') : ''}award!</p>
        <h2>${esc(a.title)}</h2>
        <p class="small muted">${popQueue.length ? 'Tap for the next one' : 'Tap to continue'}</p>
      </div>`;
    $awardPop.hidden = false;
  }

  /* ---------- A short confetti burst (for reaching a stop) ---------- */

  let burstFrame = null, burstCanvas = null;
  function burst() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    stopBurst();
    burstCanvas = document.createElement('canvas');
    burstCanvas.className = 'burst';
    document.body.appendChild(burstCanvas);
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    burstCanvas.width = W * dpr; burstCanvas.height = H * dpr;
    const ctx = burstCanvas.getContext('2d');
    ctx.scale(dpr, dpr);
    const colors = ['#e2b04c', '#6fe3b4', '#fbfbf7', '#c9553d', '#6fb4ff'];
    const bits = Array.from({ length: 90 }, () => {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 1.6, sp = 6 + Math.random() * 9;
      return { x: W / 2, y: H * 0.42, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, w: 5 + Math.random() * 5, h: 7 + Math.random() * 7, rot: Math.random() * 6, vr: -0.2 + Math.random() * 0.4, c: colors[Math.floor(Math.random() * colors.length)] };
    });
    const t0 = performance.now();
    const tick = (now) => {
      const k = (now - t0) / 1800;
      ctx.clearRect(0, 0, W, H);
      for (const b of bits) {
        b.vy += 0.25; b.x += b.vx; b.y += b.vy; b.rot += b.vr;
        ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(b.rot); ctx.globalAlpha = Math.max(0, 1 - k); ctx.fillStyle = b.c; ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h); ctx.restore();
      }
      if (k < 1) burstFrame = requestAnimationFrame(tick); else stopBurst();
    };
    burstFrame = requestAnimationFrame(tick);
  }
  function stopBurst() {
    cancelAnimationFrame(burstFrame); burstFrame = null;
    if (burstCanvas) { burstCanvas.remove(); burstCanvas = null; }
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

  /* ---------- Adding miles (form and quick-add share this) ---------- */

  async function addMiles(miles, note, date, label) {
    const firstEver = state.journey && state.journey.teamTotal <= 0;
    const added = await api('/api/miles', { method: 'POST', body: JSON.stringify({ team_id: state.teamId, miles, note, date }) });
    await loadJourney();
    state.tab = 'journey';
    state.moment = { miles: added.miles, first: firstEver };
    try { if (!localStorage.getItem('installHintDue')) localStorage.setItem('installHintDue', '1'); } catch (e) { /* no storage */ }
    renderScreen();
    if (firstEver) burst();
    showAwardPops(added.newAwards);
    toast(label || (date ? `Added ${fmtDist(added.miles)} for ${esc(whenText(added.entry.logged_at))}` : `Added ${fmtDist(added.miles)}`), {
      label: 'Undo',
      run: () => withBusy(async () => {
        await api('/api/miles', { method: 'DELETE', body: JSON.stringify({ id: added.id }) });
        await loadJourney();
        renderScreen();
      }),
    });
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

    if (action === 'tab') { state.tab = el.dataset.tab; if (state.tab !== 'log') editing = null; renderScreen(); }

    if (action === 'pick-open') renderPick();
    if (action === 'pick-back') { state.picking = null; renderMain(); }
    if (action === 'pick-destination') renderDestination(JOURNEYS[el.dataset.journey]);
    if (action === 'pick-custom') renderCustom();
    if (action === 'start-custom-solo') withBusy(async () => {
      el.disabled = true;
      try { await startWalk('custom', 'solo', null, customPayload()); } finally { el.disabled = false; }
    });
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

    if (action === 'feed-more') { state.feedOpen = true; renderScreen(); }
    if (action === 'open-settings') { state.tab = 'settings'; renderScreen(); }
    if (action === 'close-settings') { state.tab = 'journey'; renderScreen(); }
    if (action === 'dismiss-install') { try { localStorage.setItem('installHintDismissed', '1'); } catch (e) { /* ok */ } document.querySelectorAll('.notice').forEach((n) => n.remove()); }
    if (action === 'install' && deferredInstall) {
      const p = deferredInstall; deferredInstall = null;
      p.prompt();
      p.userChoice.then(() => { try { localStorage.setItem('installHintDismissed', '1'); } catch (e) { /* ok */ } renderScreen(); }).catch(() => {});
    }
    if (action === 'toggle-goal') { state.goalOpen = !state.goalOpen; renderScreen(); }
    if (action === 'history-month') { state.history = null; state.historyMonth = el.dataset.month; renderScreen(); }
    if (action === 'clear-goal') withBusy(async () => {
      await api('/api/goal', { method: 'PATCH', body: JSON.stringify({ miles: 0 }) });
      state.goalOpen = false;
      await loadJourney();
      renderScreen();
      toast('Goal cleared');
    });

    if (action === 'cheer') withBusy(async () => {
      const id = Number(el.dataset.id);
      const entry = state.journey.recent.find((e) => e.id === id);
      const on = !(entry && entry.cheered);
      const res = await api('/api/cheer', { method: on ? 'POST' : 'DELETE', body: JSON.stringify({ entry_id: id }) });
      if (entry) { entry.cheered = res.cheered; entry.cheers = res.cheers; }
      renderScreen();
    });

    if (action === 'delete-account') {
      const sure = window.confirm('Delete your account? Your miles and sign-in are removed. Walks you share with others keep going without you. This cannot be undone.');
      if (sure) withBusy(async () => {
        await api('/api/me', { method: 'DELETE' });
        localStorage.removeItem('teamId');
        location.reload();
      });
    }

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
      editing = null;
      await loadJourney();
      renderScreen();
      toast('Entry removed');
    });

    if (action === 'quick-add') withBusy(async () => {
      el.disabled = true;
      try { await addMiles(toMiles(el.dataset.amount), '', undefined); } finally { el.disabled = false; }
    });

    if (action === 'edit-entry') {
      editing = state.journey.recent.find((e) => e.id === Number(el.dataset.id)) || null;
      state.tab = 'log';
      renderScreen();
    }
    if (action === 'cancel-edit') { editing = null; renderScreen(); }

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
    if (ev.target.dataset.action === 'set-units') { setUnits(ev.target.value); state.lastShownMile = null; toast(ev.target.value === 'km' ? 'Showing kilometers' : 'Showing miles'); renderScreen(); return; }
    if (ev.target.dataset.action === 'custom-choose') {
      const f = customForm;
      const list = ev.target.dataset.field === 'start' ? f.starts : f.ends;
      const chosen = list[Number(ev.target.value)] || null;
      if (ev.target.dataset.field === 'start') f.start = chosen; else f.end = chosen;
      renderCustom();
      return;
    }
    if (ev.target.dataset.action === 'toggle-leaderboard') {
      const on = ev.target.checked;
      withBusy(async () => {
        try {
          await api('/api/team', { method: 'PATCH', body: JSON.stringify({ team_id: state.teamId, leaderboard: on }) });
          await loadJourney();
          renderScreen();
          toast(on ? 'Leaderboard is on' : 'Leaderboard is off');
        } catch (e) { ev.target.checked = !on; throw e; }
      });
      return;
    }
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
    const checked = ev.target.form.querySelector('input[name="unit"]:checked');
    const unit = checked ? checked.value : 'miles';
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
          const jid = form.dataset.journey || 'north-pole';
          await startWalk(jid, 'team', fields.name, jid === 'custom' ? customPayload() : undefined);
        }

        if (kind === 'custom-lookup') {
          const f = customForm;
          f.startQ = String(fields.start || '').trim(); f.endQ = String(fields.end || '').trim();
          f.busy = true; f.error = ''; f.starts = null; f.ends = null; f.start = null; f.end = null;
          renderCustom();
          try {
            f.starts = await lookupPlaces(f.startQ);
            await new Promise((r) => setTimeout(r, 1100)); // the lookup service asks for a second between requests
            f.ends = await lookupPlaces(f.endQ);
            f.start = f.starts[0] || null; f.end = f.ends[0] || null;
            if (!f.start || !f.end) f.error = 'One of those places was not found. Try adding the state or country.';
          } catch (e) {
            f.error = e.message;
          } finally {
            f.busy = false;
            renderCustom();
          }
        }

        if (kind === 'set-goal') {
          await api('/api/goal', { method: 'PATCH', body: JSON.stringify({ miles: toMiles(fields.miles), period: fields.period }) });
          state.goalOpen = false;
          await loadJourney();
          renderScreen();
          toast('Goal saved');
        }

        if (kind === 'rename-team') {
          const saved = await api('/api/team', { method: 'PATCH', body: JSON.stringify({ team_id: state.teamId, name: fields.name }) });
          const me = await api('/api/me');
          state.teams = me.teams;
          state.journey.team.name = saved.name;
          renderMain();
          toast('Saved');
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
          // Steps and calories are logged as miles: 2,000 steps or 100 calories is 1 mile.
          const unit = form.dataset.edit ? (isKm() ? 'km' : 'miles') : (fields.unit || 'miles');
          const raw = Math.round(Number(fields.amount));
          const miles = unit === 'calories' ? raw / CALORIES_PER_MILE : unit === 'steps' ? raw / STEPS_PER_MILE : unit === 'km' ? Number(fields.amount) / KM_PER_MILE : fields.amount;
          let note = String(fields.note || '').trim();
          if (unit === 'calories') note = `${fmt(raw, 0)} calories${note ? ' · ' + note : ''}`;
          if (unit === 'steps') note = `${fmt(raw, 0)} steps${note ? ' · ' + note : ''}`;
          const date = fields.date && fields.date !== todayIso() ? fields.date : undefined;
          if (form.dataset.edit) {
            const saved = await api('/api/miles', { method: 'PATCH', body: JSON.stringify({ id: Number(form.dataset.edit), miles, note, date: fields.date || undefined }) });
            editing = null;
            await loadJourney();
            state.tab = 'journey';
            renderScreen();
            showAwardPops(saved.newAwards);
            toast(`Saved: ${fmtDist(saved.miles)}`);
          } else {
            await addMiles(miles, note, date, unit === 'calories' ? `Added ${fmt(raw, 0)} calories (${fmtDist(miles, 2)})` : unit === 'steps' ? `Added ${fmt(raw, 0)} steps (${fmtDist(miles, 2)})` : null);
          }
        }
      } finally {
        button.disabled = false;
      }
    });
  });

  boot();
})();
