// A brand-new walker: lands on the destination picker, picks a trail, starts a solo walk,
// takes the starter goal, and sees a Journey at mile 0.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('a new walker goes picker → destination → solo walk → goal → Journey', async () => {
  const { page, errors } = await pageAs(browser, 'c');
  // the starter goal is offered once; make sure this walker has not dismissed it
  await page.evaluate(() => localStorage.removeItem('goalOfferDismissed'));
  await page.waitForSelector('.destinations', { timeout: 15000 });
  const cards = await page.$$('.destination');
  assert.ok(cards.length >= 7, 'the picker lists the public trails');

  await page.click('.destination button');
  await page.waitForSelector('[data-action="start-solo"]');
  await page.click('[data-action="start-solo"]');
  await page.waitForSelector('.goal-step', { timeout: 10000 });
  await page.click('[data-action="goal-step-pick"][data-amount="2"]');

  await page.waitForSelector('.rhythm', { timeout: 10000 });
  await page.waitForTimeout(800);
  assert.equal(await page.$eval('#hero-number b', (e) => e.textContent.trim()), '0', 'the Journey starts at mile 0');
  assert.match(await page.$eval('.rhythm-copy', (e) => e.innerText), /2 mi|goal/i, 'the ring shows the chosen goal');
  assert.ok(await page.$('#scene svg'), 'the scene is drawn');
  noErrors(errors);
});
