// Looking up real places and the distance between them.
//
// Uses OpenStreetMap's Nominatim search service by default: free, no API key, and
// enough for one lookup per new walk. Its usage policy asks for a User-Agent that
// names the app and no more than one request a second, which this app respects
// by looking places up only when someone taps "Find the route". To switch to a
// paid service later, change this one file (or set GEOCODER_URL / GEOCODER_UA
// in wrangler.toml).

const DEFAULT_URL = 'https://nominatim.openstreetmap.org';
const ROAD_FACTOR = 1.2; // roads wander: straight-line distance plus about a fifth

export async function searchPlaces(env, query, limit = 5) {
  const base = (env.GEOCODER_URL || DEFAULT_URL).replace(/\/$/, '');
  const url = `${base}/search?format=jsonv2&addressdetails=1&limit=${limit}&q=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': env.GEOCODER_UA || 'Stroll walking app (north-pole-walk.pages.dev)',
      'Accept-Language': 'en',
    },
  });
  if (!res.ok) throw new Error(`The place lookup service answered ${res.status}.`);
  const rows = await res.json();
  if (!Array.isArray(rows)) return [];
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const lat = Number(r.lat), lon = Number(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const name = placeName(r);
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ name, lat: round4(lat), lon: round4(lon) });
  }
  return out;
}

// "Paris, Île-de-France, France" from a Nominatim result.
function placeName(r) {
  const a = r.address || {};
  const local = r.name || a.city || a.town || a.village || a.hamlet || a.county || a.state;
  const region = a.state && a.state !== local ? a.state : (a.county && a.county !== local ? a.county : null);
  const country = a.country;
  const parts = [local, region, country].filter((p, i, arr) => p && arr.indexOf(p) === i);
  if (parts.length) return parts.join(', ').slice(0, 120);
  return String(r.display_name || '').split(',').slice(0, 3).join(',').slice(0, 120);
}

// Great-circle distance in miles between two points, plus the road factor.
export function walkingMiles(a, b) {
  const R = 3958.8;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  const straight = 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
  return Math.max(1, Math.round(straight * ROAD_FACTOR));
}

export function validPlace(p) {
  return p && typeof p.name === 'string' && p.name.trim().length >= 2 && p.name.length <= 120
    && Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lon))
    && Math.abs(Number(p.lat)) <= 90 && Math.abs(Number(p.lon)) <= 180;
}

function round4(n) { return Math.round(n * 10000) / 10000; }
