// A finished walk: the celebration opens, the finale plays over the scene, and the
// "I walked to ___" share card renders to a real image.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('arriving shows the celebration, the finale and a share card', async () => {
  const { page, errors } = await pageAs(browser, 'a', { teamId: 'team-camino' });
  await page.waitForSelector('#scene svg', { timeout: 15000 });
  await page.waitForTimeout(2500);
  const celebration = await page.$('#celebration:not([hidden])');
  assert.ok(celebration, 'the celebration opens on the first visit after finishing');
  assert.match(await celebration.innerText(), /Santiago/i, 'it names the destination');
  await page.click('#celebration [data-action="close-celebration"]');
  await page.waitForTimeout(400);
  assert.equal(await page.$$eval('#scene .finale', (l) => l.length), 1, 'the finale layer is in the scene');
  assert.ok((await page.$$eval('#scene .fw', (l) => l.length)) >= 3, 'fireworks are drawn');

  const size = await page.evaluate(async () => { const c = await Stroll.arrivalCard(); return [c.width, c.height, c.toDataURL('image/png').length]; });
  assert.ok(size[0] >= 1000 && size[1] >= 1000, `the card is a full-size image (${size[0]}×${size[1]})`);
  assert.ok(size[2] > 50000, 'the PNG is not blank');
  noErrors(errors);
});
