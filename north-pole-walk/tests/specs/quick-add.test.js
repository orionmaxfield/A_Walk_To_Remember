// Quick add on the Journey: the hero number moves at once, the entry lands in the feed,
// and the full Add miles form works with a note.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, heroNumber, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('tapping +2 adds two miles and lists the entry', async () => {
  const { page, errors } = await pageAs(browser, 'a', { teamId: 'team-office' });
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.waitForTimeout(600);
  const before = await heroNumber(page);
  await page.click('.rhythm [data-action="quick-add"][data-amount="2"]');
  await page.waitForTimeout(1800);
  // an award pop may be celebrating; close it so the feed is reachable
  for (let i = 0; i < 3; i++) { const pop = await page.$('#award-pop:not([hidden])'); if (!pop) break; await pop.click(); await page.waitForTimeout(300); }
  const after = await heroNumber(page);
  assert.equal(Math.round((after - before) * 10) / 10, 2, `hero number went ${before} → ${after}`);
  const feed = await page.$eval('#app', (e) => e.innerText);
  assert.match(feed, /2[\s\u00a0]mi/, 'the new entry is in the feed');
  noErrors(errors);
});

test('the Add miles form takes a number and a note', async () => {
  const { page, errors } = await pageAs(browser, 'b', { teamId: 'team-office' });
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.click('[data-tab="log"]');
  await page.waitForSelector('[data-form="add-miles"]');
  await page.fill('[data-form="add-miles"] input[name="amount"]', '1.5');
  const note = await page.$('[data-form="add-miles"] input[name="note"], [data-form="add-miles"] textarea[name="note"]');
  if (note) await note.fill('evening loop');
  await page.click('[data-form="add-miles"] button[type="submit"]');
  await page.waitForTimeout(1500);
  const text = await page.$eval('#app', (e) => e.innerText);
  assert.match(text, /1\.5[\s\u00a0]mi/, 'the 1.5 mile entry shows');
  if (note) assert.match(text, /evening loop/, 'the note shows');
  noErrors(errors);
});
