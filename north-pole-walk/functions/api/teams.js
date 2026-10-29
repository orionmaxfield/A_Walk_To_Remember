// POST /api/teams  { journey_id, kind, name } — start a journey.
//   kind 'solo': your own walk. The name is made up for you ("Jamie's walk").
//   kind 'team': a group walk. Needs a name; you get an invite code to share.
// Either way the row lives in the teams table; a solo walk simply has one member
// (and becomes a team the moment someone joins it, see join.js).

import '../../public/journey.js';
const JOURNEYS = globalThis.JOURNEYS;

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no look-alike letters

export async function onRequestPost({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);

  const body = await request.json().catch(() => ({}));
  const journeyId = String(body.journey_id || 'north-pole');
  const J = JOURNEYS[journeyId];
  if (!J) return json({ error: 'Pick a destination from the list.' }, 400);

  const kind = body.kind === 'solo' ? 'solo' : 'team';
  let name;
  if (kind === 'solo') {
    const first = String(data.user.name || 'My').trim().split(/\s+/)[0].slice(0, 30);
    name = `${first}'s walk`;
  } else {
    name = String(body.name || '').trim().slice(0, 60);
    if (name.length < 2) return json({ error: 'Give your group a name (at least 2 letters).' }, 400);
  }

  const id = crypto.randomUUID();

  // Try a few times in the unlikely event a code is already taken.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCode(6);
    try {
      await env.DB.batch([
        env.DB.prepare(
          `INSERT INTO teams (id, name, invite_code, journey_id, kind, created_by) VALUES (?, ?, ?, ?, ?, ?)`
        ).bind(id, name, code, journeyId, kind, data.user.id),
        env.DB.prepare(
          `INSERT INTO team_members (team_id, user_id) VALUES (?, ?)`
        ).bind(id, data.user.id),
      ]);
      return json({ team: { id, name, invite_code: code, journey_id: journeyId, kind } });
    } catch (err) {
      if (!String(err.message || err).includes('UNIQUE')) throw err;
    }
  }
  return json({ error: 'Could not create an invite code. Try again.' }, 500);
}

function randomCode(length) {
  const arr = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(arr, (b) => CODE_CHARS[b % CODE_CHARS.length]).join('');
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
