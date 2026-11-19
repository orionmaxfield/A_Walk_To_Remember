// Small things that should stay fixed: tied walkers share a rank, a failed Awards load offers
// a way back, pop-ups close with Escape and hand the focus back, the calendar speaks the
// walker's unit, and signing out with a walk still waiting to send asks first.
// None of these write to the database.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { BASE, PHONE, launch } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// A signed-in page with the service worker off, so the test can stand in for the server.
async function open(who, teamId, units) {
  const ctx = await browser.newContext({ viewport: PHONE, serviceWorkers: 'block' });
  await ctx.addCookies([{ name: 'session', value: who.repeat(64), domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/');
  await page.evaluate(({ teamId, units }) => {
    localStorage.clear();
    localStorage.setItem('installHintDismissed', '1');
    localStorage.setItem('goalOfferDismissed', '1');
    localStorage.setItem('teamId', teamId);
    if (units) localStorage.setItem('units', units);
  }, { teamId, units });
  return { page, ctx, errors };
}

test('walkers on the same miles share a rank', async () => {
  const { page, ctx, errors } = await open('a', 'team-office');
  await page.route('**/api/journey*', async (r) => {
    const res = await r.fetch();
    const j = await res.json();
    j.standings = [
      { id: 'test-b', name: 'Second Friend', picture: null, total: 5, week: 5 },
      { id: 'test-a', name: 'Test Walker', picture: null, total: 5, week: 2 },
      { id: 'test-z', name: 'Third Walker', picture: null, total: 1.5, week: 0 },
    ];
    await r.fulfill({ response: res, json: j });
  });
  await page.goto(BASE + '/');
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.click('[data-tab="team"]');
  await page.waitForSelector('.standings .rank');
  assert.deepEqual(await page.$$eval('.standings .rank', (els) => els.map((e) => e.textContent.trim())), ['1', '1', '3']);
  assert.equal(await page.$$eval('.standings .rank.first', (els) => els.length), 2, 'both leaders are marked first');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('a failed Awards load shows Try again, and Try again loads the awards', async () => {
  const { page, ctx, errors } = await open('a', 'team-office');
  let down = true;
  await page.route('**/api/awards*', (r) => (down ? r.fulfill({ status: 500, contentType: 'application/json', body: '{"error":"Something went wrong."}' }) : r.continue()));
  await page.goto(BASE + '/');
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.click('[data-tab="awards"]');
  await page.waitForSelector('[data-action="awards-retry"]', { timeout: 15000 });
  assert.equal(await page.$('#screen .skeleton'), null, 'no loading boxes are left on the Awards tab');
  down = false;
  await page.click('[data-action="awards-retry"]');
  await page.waitForSelector('.badge-card', { timeout: 15000 });
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('Escape closes the arrival and a postcard, and the focus goes back where it was', async () => {
  const { page, ctx, errors } = await open('a', 'team-camino');
  await page.goto(BASE + '/');
  await page.waitForSelector('#celebration:not([hidden])', { timeout: 15000 });
  assert.ok(await page.evaluate(() => document.getElementById('celebration').contains(document.activeElement)), 'the arrival takes the focus');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'close-celebration', 'and Tab lands on its first button');
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#celebration', (e) => e.hidden), true, 'Escape closes the arrival');

  await page.focus('[data-action="open-postcard"]');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#postcard-pop:not([hidden])');
  assert.ok(await page.evaluate(() => document.getElementById('postcard-pop').contains(document.activeElement)), 'the postcard takes the focus');
  await page.keyboard.press('Escape');
  assert.equal(await page.$eval('#postcard-pop', (e) => e.hidden), true, 'Escape closes the postcard');
  assert.equal(await page.evaluate(() => document.activeElement.dataset.action), 'open-postcard', 'the focus is back on the postcard that was opened');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('the You calendar names each day in the walker\'s unit', async () => {
  const { page, ctx, errors } = await open('a', 'team-office', 'km');
  await page.goto(BASE + '/');
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.click('[data-tab="you"]');
  await page.waitForSelector('.cal-cell.walked');
  const labels = await page.$$eval('.cal-cell.walked', (els) => els.map((e) => `${e.getAttribute('title')} | ${e.getAttribute('aria-label')}`));
  assert.ok(labels.length > 0);
  for (const l of labels) { assert.match(l, /km \| \w+ \d+(, today)?: [\d.,]+\skm$/, l); assert.doesNotMatch(l, /\bmi\b/, l); }
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('signing out with a walk still waiting to send asks first', async () => {
  const { page, ctx, errors } = await open('b', 'team-office');
  await page.goto(BASE + '/');
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.waitForTimeout(600);
  await ctx.setOffline(true);
  await page.click('.rhythm [data-action="quick-add"][data-amount="1"]');
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('strollQueue') || '[]').length === 1);
  await page.click('[data-action="open-settings"]');
  let asked = '';
  page.once('dialog', (d) => { asked = d.message(); d.dismiss(); });
  await page.click('[data-action="sign-out"]');
  await page.waitForTimeout(400);
  assert.match(asked, /One walk is still waiting to send/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('strollQueue') || '[]').length), 1, 'saying no keeps the walk on the phone');
  assert.ok(await page.$('[data-action="sign-out"]'), 'and the walker is still signed in');
  // Drop the waiting walk before the connection returns, so this test leaves the database alone.
  await page.evaluate(() => localStorage.removeItem('strollQueue'));
  await ctx.close();
  assert.deepEqual(errors, []);
});
