// The journey. Miles are measured along a straight line due north from Layton, Utah.
// (One degree of latitude is about 69 miles. Layton sits near 41.06° N; the Pole is 90° N.)
//
// To add a new destination later, add another object to JOURNEYS with the same shape.

const JOURNEYS = {
  'north-pole': {
    id: 'north-pole',
    title: 'The Walk to the North Pole',
    start: 'Layton, Utah',
    end: 'The North Pole',
    totalMiles: 3381,
    waypoints: [
      {
        mile: 0,
        name: 'Layton, Utah',
        region: 'leaving Layton',
        fact: 'The North Pole is 3,381 miles due north of Layton. Walk in a straight line and you would never need to turn — just keep going north until north runs out.',
      },
      {
        mile: 65,
        name: 'the Idaho border',
        region: 'crossing into Idaho',
        fact: 'You just walked alongside the Great Salt Lake. It is far saltier than the ocean, which is why swimmers float in it like corks.',
      },
      {
        mile: 238,
        name: 'Montana',
        region: 'crossing Montana',
        fact: 'Montana is called Big Sky Country. It is the fourth-largest state, yet fewer people live in all of it than in the Salt Lake City area.',
      },
      {
        mile: 549,
        name: 'the Canadian border',
        region: 'entering Alberta, Canada',
        fact: 'The border between the United States and Canada is the longest international border in the world — about 5,500 miles.',
      },
      {
        mile: 860,
        name: 'Edmonton, Alberta',
        region: 'passing Edmonton',
        fact: 'Edmonton is one of the northernmost big cities in North America. In midsummer the sky stays light past 10 p.m.',
      },
      {
        mile: 1309,
        name: 'the Northwest Territories',
        region: 'entering the Northwest Territories',
        fact: 'The Northwest Territories is bigger than Texas and California combined, and only about 45,000 people live there.',
      },
      {
        mile: 1481,
        name: 'Great Slave Lake',
        region: 'passing Yellowknife',
        fact: 'Great Slave Lake is the deepest lake in North America — more than 2,000 feet deep. Nearby Yellowknife is one of the best places on Earth to see the northern lights.',
      },
      {
        mile: 1762,
        name: 'the Arctic Circle',
        region: 'above the Arctic Circle',
        fact: 'North of this line, the sun stays up for at least one full day each summer and stays down for at least one full day each winter.',
      },
      {
        mile: 1965,
        name: 'the Arctic Ocean',
        region: 'stepping onto the sea ice',
        fact: 'From here on there is no land at all — only frozen ocean. The ice is often just 6 to 10 feet thick, floating on water that is more than two miles deep at the Pole.',
      },
      {
        mile: 2345,
        name: '75° North',
        region: 'deep in the Arctic',
        fact: 'You are now farther north than almost every town on Earth. Only a few tiny villages and research stations sit above this line.',
      },
      {
        mile: 2690,
        name: '80° North',
        region: 'in the high Arctic',
        fact: 'In 1958 the submarine USS Nautilus became the first vessel to reach the North Pole — by sailing underneath the ice.',
      },
      {
        mile: 3036,
        name: '85° North',
        region: 'nearly there',
        fact: 'Explorers argued for a century about who reached the Pole first. The first trip everyone agrees on was in 1968 — by snowmobile.',
      },
      {
        mile: 3312,
        name: 'the last degree',
        region: 'the final stretch',
        fact: 'Modern polar expeditions often ski only "the last degree" — the final 69 miles — and it takes most people a week or more.',
      },
      {
        mile: 3381,
        name: 'the North Pole',
        region: 'at the top of the world',
        fact: 'At the North Pole every direction is south, every time zone meets, and the sun rises and sets only once a year.',
      },
    ],
  },
};
