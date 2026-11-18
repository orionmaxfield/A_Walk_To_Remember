// When things go wrong: a failed first load offers a way back, miles waiting on the phone
// are never thrown away because the server hiccuped, and an edit leaves the entry's day alone.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { BASE, PHONE, launch, heroNumber } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

// Like pageAs, but with the service worker off so the test can stand in for the server.
async function open(who, opts = {}) {
  const ctx = await browser.newContext({ viewport: PHONE, serviceWorkers: 'block', timezoneId: opts.timezoneId });
  await ctx.addCookies([{ name: 'session', value: who.repeat(64), domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/');
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('installHintDismissed', '1');
    localStorage.setItem('goalOfferDismissed', '1');
    localStorage.setItem('teamId', 'team-office');
  });
  return { page, ctx, errors };
}

test('a failed first load shows Try again, and Try again loads the walk', async () => {
  const { page, ctx, errors } = await open('b');
  let down = true;
  await page.route('**/api/journey*', (r) => (down ? r.fulfill({ status: 500, contentType: 'application/json', body: '{}' }) : r.continue()));
  await page.goto(BASE + '/');
  await page.waitForSelector('.load-error', { timeout: 15000 });
  assert.equal(await page.$('.skeleton'), null, 'no loading boxes are left on screen');
  down = false;
  await page.click('[data-action="retry-load"]');
  await page.waitForSelector('#hero-number b', { timeout: 15000 });
  assert.ok(await heroNumber(page) > 0, 'the walk shows after trying again');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('a walk waiting on the phone survives a server error and is sent once', async () => {
  const { page, ctx, errors } = await open('b');
  await page.goto(BASE + '/');
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.waitForTimeout(800);
  const start = await heroNumber(page);
  const queue = () => page.evaluate(() => JSON.parse(localStorage.getItem('strollQueue') || '[]').length);
  let mode = 'no-signal';
  await page.route('**/api/miles', (r) => {
    if (r.request().method() !== 'POST' || mode === 'up') return r.continue();
    if (mode === 'no-signal') return r.abort();
    return r.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });
  await page.click('.rhythm [data-action="quick-add"][data-amount="1"]');
  await page.waitForTimeout(600);
  assert.equal(await queue(), 1, 'the walk waits on the phone');

  mode = 'server-error';
  await page.click('[data-action="sync-now"]');
  await page.waitForTimeout(700);
  assert.equal(await queue(), 1, 'a server error does not throw the walk away');
  const said = await page.$eval('#toast', (e) => e.textContent);
  assert.ok(!/is saved\./.test(said) && /stays on your phone/.test(said), `the message is honest: "${said}"`);

  mode = 'up';
  await page.click('[data-action="sync-now"]');
  await page.waitForTimeout(1500);
  assert.equal(await queue(), 0, 'the queue is empty once the server is back');
  assert.equal(Math.round((await heroNumber(page) - start) * 10) / 10, 1, 'the mile is counted exactly once');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('saving an edit does not re-send the day unless the walker changed it', async () => {
  // A phone two hours east of the server's Denver days.
  const { page, ctx, errors } = await open('a', { timezoneId: 'America/New_York' });
  await page.goto(BASE + '/');
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.waitForSelector('[data-action="edit-entry"]', { timeout: 15000 });
  await page.click('[data-action="edit-entry"]');
  await page.waitForSelector('form[data-form="add-miles"][data-edit]');
  const sent = page.waitForRequest((q) => q.url().includes('/api/miles') && q.method() === 'PATCH');
  await page.click('form[data-form="add-miles"] button[type="submit"]');
  const body = JSON.parse((await sent).postData());
  assert.equal(body.date, undefined, 'an untouched day is not sent');
  assert.deepEqual(errors, []);
  await ctx.close();
});
