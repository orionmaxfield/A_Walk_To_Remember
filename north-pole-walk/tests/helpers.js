// Shared bits for the specs: a browser per file, a page signed in as one of the seeded
// walkers, and a list of console errors that each test asserts is empty.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');

const BASE = process.env.STROLL_TEST_URL || 'http://localhost:8799';
const PHONE = { width: 390, height: 844 };
const DESKTOP = { width: 1366, height: 900 };

// Noise that is not ours: the Google sign-in script cannot load offline, favicons, and
// the browser's own "failed to load" lines while a test is deliberately offline.
const IGNORE = /gis|accounts\.google|favicon|google|ERR_INTERNET_DISCONNECTED|Failed to load resource/i;

async function launch() {
  return chromium.launch();
}

// A page signed in as walker 'a', 'b' or 'c' (see seed.sql), with the one-time hints dismissed.
async function pageAs(browser, who, opts = {}) {
  const ctx = await browser.newContext({ viewport: opts.viewport || PHONE });
  if (who) await ctx.addCookies([{ name: 'session', value: who.repeat(64), domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => { if (!IGNORE.test(e.message)) errors.push(e.message); });
  page.on('console', (m) => { if (m.type() === 'error' && !IGNORE.test(m.text())) errors.push(m.text().slice(0, 200)); });
  await page.goto(BASE + '/');
  await page.evaluate((o) => {
    localStorage.clear();
    localStorage.setItem('installHintDismissed', '1');
    localStorage.setItem('goalOfferDismissed', '1');
    if (o.teamId) localStorage.setItem('teamId', o.teamId);
    if (o.units) localStorage.setItem('units', o.units);
  }, opts);
  await page.goto(BASE + '/');
  return { page, ctx, errors };
}

// Call the app's own API from the page (so the session cookie goes along).
async function api(page, path, method = 'GET', body) {
  return page.evaluate(async ({ path, method, body }) => {
    const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    return res.json();
  }, { path, method, body });
}

const heroNumber = (page) => page.$eval('#hero-number b', (e) => Number(e.textContent.replace(/[^\d.]/g, '')));

function noErrors(errors) {
  assert.deepEqual(errors, [], 'console errors: ' + errors.join(' | '));
}

module.exports = { BASE, PHONE, DESKTOP, launch, pageAs, api, heroNumber, noErrors };
