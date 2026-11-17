// The office's North Pole team flow, the way it has always worked: create a team with no
// destination (it defaults to the North Pole with the elf), add miles, see the Team tab,
// and a second person joins with the invite code.
const { test, after, before } = require('node:test');
const assert = require('node:assert/strict');
const { launch, pageAs, api, noErrors } = require('../helpers');

let browser;
before(async () => { browser = await launch(); });
after(async () => { await browser.close(); });

test('create the office team, walk, and a friend joins by code', async () => {
  const a = await pageAs(browser, 'a');
  const made = await api(a.page, '/api/teams', 'POST', { name: 'Office test team' });
  assert.equal(made.team.journey_id, 'north-pole', 'no destination means the North Pole');
  assert.equal(made.team.kind, 'team');
  assert.match(made.team.invite_code, /^[A-Z0-9]{4,}$/);

  await a.page.evaluate((id) => localStorage.setItem('teamId', id), made.team.id);
  await a.page.goto(a.page.url());
  await a.page.waitForSelector('#scene svg .elf', { timeout: 15000 });
  await a.page.waitForSelector('.rhythm');
  await a.page.click('.rhythm [data-action="quick-add"][data-amount="2"]');
  await a.page.waitForTimeout(1500);
  for (let i = 0; i < 3; i++) { const pop = await a.page.$('#award-pop:not([hidden])'); if (!pop) break; await pop.click(); await a.page.waitForTimeout(300); }
  await a.page.click('[data-tab="team"]');
  await a.page.waitForTimeout(500);
  assert.match(await a.page.$eval('#screen', (e) => e.innerText), /Office test team/, 'the Team tab names the team');

  const b = await pageAs(browser, 'b');
  const joined = await api(b.page, '/api/join', 'POST', { code: made.team.invite_code });
  assert.equal(joined.team && joined.team.name, 'Office test team', 'joining by code works');
  await b.page.evaluate((id) => localStorage.setItem('teamId', id), made.team.id);
  await b.page.goto(b.page.url());
  await b.page.waitForSelector('.rhythm', { timeout: 15000 });
  await b.page.click('[data-tab="team"]');
  await b.page.waitForTimeout(500);
  const members = await b.page.$eval('#screen', (e) => e.innerText);
  assert.match(members, /Test Walker/, 'the second walker sees the first');
  assert.match(members, /Second Friend|You/, 'and themself');
  noErrors(a.errors); noErrors(b.errors);
});
