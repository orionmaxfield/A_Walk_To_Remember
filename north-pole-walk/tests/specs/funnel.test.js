// Launch counts: the front page counts a view, a new walker's first miles count once,
// and the numbers are readable only by the addresses in ADMIN_EMAILS (walker a in the runner).
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, api, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('landing views and first entries are counted as daily totals', async () => {
  const a = await pageAs(browser, 'a');
  const start = await api(a.page, '/api/funnel?days=1');
  assert.ok(start.totals, 'walker a may read the numbers');

  const visitor = await pageAs(browser, null);
  await visitor.page.waitForSelector('.landing', { timeout: 15000 });
  await visitor.page.waitForTimeout(800);

  const c = await pageAs(browser, 'c');
  const made = await api(c.page, '/api/teams', 'POST', { journey_id: 'oz', kind: 'solo', name: 'Count me' });
  await api(c.page, '/api/miles', 'POST', { team_id: made.team.id, miles: 1 });
  await api(c.page, '/api/miles', 'POST', { team_id: made.team.id, miles: 1 });

  const now = await api(a.page, '/api/funnel?days=1');
  assert.ok(now.totals.landing >= start.totals.landing + 1, 'the front page view was counted');
  assert.equal(now.totals.first_entry, start.totals.first_entry + 1, 'the first entry counts once, the second not at all');

  const denied = await api(c.page, '/api/funnel');
  assert.match(denied.error || '', /ADMIN_EMAILS/, 'other walkers cannot read the numbers');
  noErrors(a.errors); noErrors(visitor.errors); noErrors(c.errors);
});
