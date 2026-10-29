// A custom real-world destination: "walk from my town to anywhere".
// The server works out the distance once (see functions/lib/places.js) and stores
// { start: { name, lat, lon }, end: { name, lat, lon }, miles } on the walk.
// This file turns that into a journey object with the same shape as the ones in
// journey.js, so the rest of the app (scene, awards, screens) treats it like any
// other destination. The server imports this same file for the awards.

const STEPS_PER_MILE_CUSTOM = 2000;

function customJourney(custom) {
  const c = custom || {};
  const start = c.start && c.start.name ? c.start.name : 'home';
  const end = c.end && c.end.name ? c.end.name : 'your destination';
  const miles = Math.max(1, Math.round(Number(c.miles) || 1));
  const shortEnd = shortPlace(end);
  const shortStart = shortPlace(start);
  const n = (x) => Math.round(x).toLocaleString('en-US');
  const at = (frac) => Math.round(miles * frac);
  const hours = (m) => Math.round(m / 3); // a brisk 3 mph

  const waypoints = [
    { mile: 0, name: shortStart, region: `setting out from ${shortStart}`, sign: signLines(shortStart), scene: 'start',
      fact: `${n(miles)} miles from ${shortStart} to ${shortEnd}. Every long walk starts at a front door; this one starts at yours.` },
    { mile: at(0.1), name: 'the first marker', region: 'past the first marker', sign: ['First', 'Marker'],
      badge: { id: 'cu-10', title: 'First Marker', icon: 'footprints' },
      fact: `${n(at(0.1))} miles down. That is about ${n(at(0.1) / 0.2485)} laps of a running track.` },
    { mile: at(0.25), name: 'a quarter of the way', region: 'a quarter of the way there', sign: ['Quarter', 'Way'],
      badge: { id: 'cu-25', title: 'Quarter Way', icon: 'compass' },
      fact: `${n(at(0.25))} miles is about ${marathons(at(0.25))}.` },
    { mile: at(0.5), name: 'the halfway point', region: 'at the halfway point', sign: ['Halfway'], scene: 'halfway',
      badge: { id: 'cu-50', title: 'Halfway There', icon: 'star' },
      fact: `Halfway. Walked in one go at a brisk 3 mph, the whole trip would take about ${n(hours(miles))} hours on your feet.` },
    { mile: at(0.75), name: 'three quarters of the way', region: 'three quarters of the way there', sign: ['Three', 'Quarters'],
      badge: { id: 'cu-75', title: 'Three Quarters', icon: 'mountain' },
      fact: `${n(at(0.75))} miles so far. Spread over a year, that is about ${(at(0.75) / 365).toFixed(1)} miles a day.` },
    { mile: at(0.9), name: 'the home stretch', region: 'on the home stretch', sign: ['Home', 'Stretch'],
      badge: { id: 'cu-90', title: 'Home Stretch', icon: 'lantern' },
      fact: `${n(miles - at(0.9))} miles to go. At a brisk pace that is about ${n(hours(miles - at(0.9)))} more hours of walking.` },
    { mile: miles, name: shortEnd, region: `in ${shortEnd} at last`, sign: [shortEnd.toUpperCase().slice(0, 14)], scene: 'finish',
      badge: { id: 'cu-finish', title: `Reached ${shortEnd}`, icon: 'summitsign' },
      fact: `You walked ${n(miles)} miles from ${shortStart} to ${shortEnd}: roughly ${n(miles * STEPS_PER_MILE_CUSTOM)} steps.` },
  ];
  // Keep the signposts in strictly increasing order on very short trips.
  const seen = new Set();
  const cleaned = waypoints.filter((w) => { if (seen.has(w.mile)) return false; seen.add(w.mile); return true; });

  return {
    id: 'custom',
    title: `The Walk to ${shortEnd}`,
    start,
    end,
    banner: shortEnd.toUpperCase().slice(0, 14),
    totalMiles: miles,
    public: false,
    theme: 'road',
    hero: 'hiker',
    heroName: 'Walker',
    blurb: `${start} to ${end}, about ${n(miles)} miles.`,
    arrival: { title: `You made it to ${shortEnd}!`, text: `${n(miles)} miles from ${shortStart}, one step at a time.` },
    waypoints: cleaned,
    milestones: [],
    custom: c,
  };
}

// "Santiago de Compostela, Galicia, Spain" -> "Santiago de Compostela"
function shortPlace(name) {
  return String(name).split(',')[0].trim().slice(0, 40) || String(name).slice(0, 40);
}

function signLines(name) {
  const words = name.split(/\s+/);
  if (name.length <= 13 || words.length === 1) return [name.slice(0, 16)];
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' ').slice(0, 16), words.slice(mid).join(' ').slice(0, 16)];
}

function marathons(miles) {
  const m = miles / 26.2;
  if (m < 1) return `${Math.round(m * 100)}% of a marathon`;
  const r = Math.round(m * 10) / 10;
  return `${r} marathon${r === 1 ? '' : 's'}`;
}

if (typeof globalThis !== 'undefined') globalThis.customJourney = customJourney;
