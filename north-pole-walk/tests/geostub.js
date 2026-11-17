// A stand-in for the place lookup so the custom-destination checks need no internet.
// Answers like Nominatim for a few place names; the runner points GEOCODER_URL here.
const http = require('http');
const DATA = {
  layton: [{ name: 'Layton', lat: '41.0602', lon: '-111.9711', address: { city: 'Layton', state: 'Utah', country: 'United States' } }],
  'grand canyon': [{ name: 'Grand Canyon', lat: '36.1069', lon: '-112.1129', address: { county: 'Coconino County', state: 'Arizona', country: 'United States' } }],
  paris: [{ name: 'Paris', lat: '48.8566', lon: '2.3522', address: { city: 'Paris', state: 'Île-de-France', country: 'France' } }],
};
const port = Number(process.argv[2] || 9999);
http.createServer((req, res) => {
  const q = (new URL(req.url, 'http://x').searchParams.get('q') || '').toLowerCase();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(DATA[q] || []));
}).listen(port);
