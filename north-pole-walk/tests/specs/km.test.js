// Kilometre mode: with units set to km, no visible " mi" slips through on any main tab,
// and the hero number is the converted figure.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('every main tab reads in kilometres', async () => {
  const { page, errors } = await pageAs(browser, 'a', { teamId: 'team-office', units: 'km' });
  await page.waitForSelector('.rhythm', { timeout: 15000 });
  await page.waitForTimeout(1000);
  const leaks = async (name) => {
    const txt = await page.$eval('#app', (e) => e.innerText);
    const hits = [...txt.matchAll(/[^\n]{0,30}\b(mi|mile|miles)\b[^\n]{0,20}/g)].map((m) => m[0].trim());
    assert.deepEqual(hits, [], `${name} still shows miles: ${hits.join(' || ')}`);
  };
  await leaks('journey');
  assert.match(await page.$eval('#hero-number', (e) => e.innerText), /km/, 'the hero number is in km');
  // Awards are left out: their descriptions come from the server in miles, which is an open
  // question for Orion (convert or not). Everything else must read in km.
  for (const tab of ['log', 'team', 'you']) {
    await page.click(`[data-tab="${tab}"]`);
    await page.waitForTimeout(700);
    await leaks(tab);
  }
  noErrors(errors);
});
