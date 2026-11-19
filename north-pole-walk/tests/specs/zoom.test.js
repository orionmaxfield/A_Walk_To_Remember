// The picture has a spoken description, decoration stays silent, and a phone zoomed to 200%
// (about 195px wide) still fits: no sideways scroll on the main tabs, nothing runs off the side.
// None of these write to the database.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { BASE, PHONE, launch } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

async function open(viewport, who, store) {
  const ctx = await browser.newContext({ viewport, serviceWorkers: 'block' });
  if (who) await ctx.addCookies([{ name: 'session', value: who.repeat(64), domain: 'localhost', path: '/' }]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(BASE + '/');
  await page.evaluate((s) => {
    localStorage.clear();
    localStorage.setItem('installHintDismissed', '1');
    localStorage.setItem('goalOfferDismissed', '1');
    for (const k in s) localStorage.setItem(k, s[k]);
  }, store || {});
  await page.goto(BASE + '/');
  return { page, ctx, errors };
}

test('the scene says what is drawn and how far along, in the walker\'s unit', async () => {
  for (const [units, word] of [['mi', 'miles'], ['km', 'km']]) {
    const { page, ctx, errors } = await open(PHONE, 'a', { teamId: 'team-office', units });
    await page.waitForSelector('#scene svg', { timeout: 15000 });
    const svg = await page.$eval('#scene svg', (e) => ({ role: e.getAttribute('role'), label: e.getAttribute('aria-label') }));
    assert.equal(svg.role, 'img');
    assert.match(svg.label, /^Illustration: an elf in a striped hat/);
    assert.match(svg.label, new RegExp(`has walked [\\d,]+ of [\\d,]+ ${word}\\b`), svg.label);
    if (units === 'km') assert.doesNotMatch(svg.label, /\bmiles\b/, svg.label);
    assert.deepEqual(errors, []);
    await ctx.close();
  }
});

test('pictures that are only decoration are hidden from screen readers; no picture is left unnamed', async () => {
  const { page, ctx, errors } = await open(PHONE, null);
  await page.waitForSelector('.landing .mock-scene svg', { timeout: 15000 });
  const pics = await page.$$eval('svg.scene-svg', (els) => els.map((e) => ({ role: e.getAttribute('role'), label: e.getAttribute('aria-label'), hidden: e.getAttribute('aria-hidden') })));
  assert.ok(pics.length >= 3);
  for (const p of pics) assert.ok((p.role === 'img' && p.label) || p.hidden === 'true', JSON.stringify(p));
  assert.ok(pics.some((p) => /yellow brick road/.test(p.label || '')), 'the example scene on the front page is described');
  assert.deepEqual(errors, []);
  await ctx.close();
});

test('a phone zoomed to 200% has no sideways scroll on the main tabs', async () => {
  const { page, ctx, errors } = await open({ width: 195, height: 422 }, 'a', { teamId: 'team-office' });
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  const over = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(await over() <= 1, 'Journey fits');
  for (const tab of ['log', 'team', 'you']) {
    await page.click(`[data-tab="${tab}"]`);
    await page.waitForTimeout(600);
    assert.ok(await over() <= 1, `${tab} fits (over by ${await over()}px)`);
  }
  // the four quick-add tiles fold to two across and every one is on screen
  await page.click('[data-tab="log"]');
  const rights = await page.$$eval('.quick-row .quick', (els) => els.map((e) => Math.round(e.getBoundingClientRect().right)));
  assert.ok(rights.length >= 4 && rights.every((r) => r <= 195), 'quick-add tiles are on screen: ' + rights.join(','));
  assert.deepEqual(errors, []);
  await ctx.close();
});
