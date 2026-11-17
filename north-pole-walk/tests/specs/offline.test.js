// Offline: a quick add while disconnected is queued on the device and shown as pending;
// it is sent, once, when the connection returns.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, heroNumber, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('a quick add while offline queues, then syncs once online', async () => {
  const { page, ctx, errors } = await pageAs(browser, 'b', { teamId: 'team-office' });
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.waitForTimeout(800);
  const before = await heroNumber(page);

  await ctx.setOffline(true);
  await page.click('.rhythm [data-action="quick-add"][data-amount="1"]');
  await page.waitForTimeout(800);
  const queue = await page.evaluate(() => JSON.parse(localStorage.getItem('strollQueue') || '[]'));
  assert.equal(queue.length, 1, 'one entry waits in the queue');
  assert.equal(queue[0].miles, 1);
  assert.ok(await page.$('.offline-notice'), 'the offline notice shows');
  const shown = await heroNumber(page);
  assert.ok(shown === before || Math.round((shown - before) * 10) / 10 === 1, `while offline the total reads ${shown} (was ${before})`);

  await ctx.setOffline(false);
  await page.waitForTimeout(3500);
  const left = await page.evaluate(() => JSON.parse(localStorage.getItem('strollQueue') || '[]'));
  assert.equal(left.length, 0, 'the queue is empty after syncing');
  assert.equal(await page.$('.offline-notice'), null, 'the notice is gone');
  assert.equal(Math.round((await heroNumber(page) - before) * 10) / 10, 1, 'the mile is counted exactly once');
  noErrors(errors);
});
