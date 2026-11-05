// GET /api/places?q=Paris — up to five matching real places, for the custom destination form.

import { searchPlaces } from '../lib/places.js';

export async function onRequestGet({ request, env, data }) {
  if (!data.user) return json({ error: 'Not signed in.' }, 401);
  const q = (new URL(request.url).searchParams.get('q') || '').trim().slice(0, 120);
  if (q.length < 2) return json({ error: 'Type a place name first.' }, 400);
  try {
    const places = await searchPlaces(env, q);
    return json({ places });
  } catch (err) {
    return json({ error: 'Could not look that place up right now. Try again in a moment.' }, 502);
  }
}

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
