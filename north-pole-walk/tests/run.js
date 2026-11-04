// `npm test`: build a throwaway local D1 from schema.sql + migrations + tests/seed.sql,
// start the place-lookup stub and `wrangler pages dev` on a spare port, run every
// tests/specs/*.test.js with node's test runner, then stop the servers.
//
// Nothing here touches a real database: everything lives under tests/.state (git-ignored).
// Run one file with `npm test -- specs/offline.test.js`.
const { spawn, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const STATE = path.join(__dirname, '.state');
const PORT = Number(process.env.STROLL_TEST_PORT || 8799);
const GEO_PORT = PORT + 100;
const wrangler = path.join(ROOT, 'node_modules', '.bin', 'wrangler');

function sql(file) {
  const r = spawnSync(wrangler, ['d1', 'execute', 'north-pole-walk', '--local', '--persist-to', STATE, '--file', file], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, CI: '1' } });
  if (r.status !== 0) { process.stderr.write(r.stdout + r.stderr); throw new Error('could not apply ' + file); }
}

async function waitFor(url, ms) {
  const until = Date.now() + ms;
  while (Date.now() < until) {
    try { const r = await fetch(url); if (r.ok) return; } catch (e) { /* not up yet */ }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error('server did not answer at ' + url);
}

(async () => {
  fs.rmSync(STATE, { recursive: true, force: true });
  process.stdout.write('seeding a local test database… ');
  sql(path.join(ROOT, 'schema.sql'));
  for (const m of fs.readdirSync(path.join(ROOT, 'migrations')).sort()) {
    // schema.sql already includes every column, so the ALTERs fail harmlessly on a fresh database
    spawnSync(wrangler, ['d1', 'execute', 'north-pole-walk', '--local', '--persist-to', STATE, '--file', path.join(ROOT, 'migrations', m)], { cwd: ROOT, stdio: 'ignore', env: { ...process.env, CI: '1' } });
  }
  sql(path.join(__dirname, 'seed.sql'));
  console.log('done');

  const geo = spawn(process.execPath, [path.join(__dirname, 'geostub.js'), String(GEO_PORT)], { stdio: 'ignore' });
  const dev = spawn(wrangler, ['pages', 'dev', 'public', '--port', String(PORT), '--persist-to', STATE, '--binding', `GEOCODER_URL=http://localhost:${GEO_PORT}`, '--log-level', 'error'], { cwd: ROOT, stdio: ['ignore', 'inherit', 'inherit'], env: { ...process.env, CI: '1' } });
  let code = 1;
  try {
    await waitFor(`http://localhost:${PORT}/api/config`, 60000);
    const only = process.argv.slice(2).filter((a) => !a.startsWith('-'));
    const files = only.length ? only.map((f) => path.resolve(__dirname, f)) : fs.readdirSync(path.join(__dirname, 'specs')).filter((f) => f.endsWith('.test.js')).sort().map((f) => path.join(__dirname, 'specs', f));
    const test = spawn(process.execPath, ['--test', '--test-concurrency=1', ...files], { stdio: 'inherit', env: { ...process.env, STROLL_TEST_URL: `http://localhost:${PORT}` } });
    code = await new Promise((r) => test.on('exit', r));
  } finally {
    dev.kill('SIGTERM'); geo.kill('SIGTERM');
    await new Promise((r) => setTimeout(r, 500));
  }
  process.exit(code);
})().catch((e) => { console.error(e.message); process.exit(1); });
