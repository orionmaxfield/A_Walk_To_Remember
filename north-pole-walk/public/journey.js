// The journey: "Elves on a Self-Care Journey," from the office poster.
// The route follows the poster's stops from Layton, Utah up through Montana, Alberta,
// British Columbia, the Yukon and the Northwest Territories, then across the sea ice
// to the North Pole.
//
// Miles are measured the same way as the 3,381-mile total: how far due north of
// Layton (41.06° N) each stop sits, at 69.09 miles per degree of latitude. That keeps
// every stop in true north-to-south order and makes the last stop land on 3,381.
// Mount Doom and the Last Stretch are made up, so they keep the poster's miles.
//
// To add a new destination later, add another object to JOURNEYS with the same shape.
// Each waypoint has:
//   mile     — where the stop sits on the trail
//   name     — used in sentences ("Next up: Ogden, Utah")
//   region   — finishes the sentence "Your team is …"
//   remember — the "Remember" card for this stretch (the poster's message for the stop)
//   sign     — (optional) the lines painted on the wooden signpost; defaults to the name
//   scene    — (optional) a hint for the storybook scene. Scenery it draws:
//              'start', 'halfway', 'arctic', 'volcano', 'finish', 'lake'
//              Seasons it keys on: 'canada', 'edmonton', 'north60', 'coast'
//   badge    — (optional) the team award for reaching this stop: { id, title, icon }
//              (icons are drawn in badges.js)
// Each journey can also list milestones: team awards at a mile with no signpost
// (a border crossing, the halfway point). kind is 'border' or 'milestone'.

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
        sign: ['Layton, UT'],
        scene: 'start',
        remember: "You can't pour from an empty mug! Set a self-care goal for this season.",
      },
      {
        mile: 11,
        name: 'Ogden, Utah',
        region: 'passing through Ogden',
        sign: ['Ogden, UT'],
        badge: { id: 'stop-ogden', title: 'Railroad Town', icon: 'train' },
        remember: "Take a 5-minute break. Breathe. You've got this!",
      },
      {
        mile: 47,
        name: 'Logan, Utah',
        region: 'in Logan and Cache Valley',
        sign: ['Logan, UT'],
        badge: { id: 'stop-logan', title: 'Cache Valley Creamery', icon: 'icecream' },
        remember: "Small steps lead to big changes. Notice 3 things you're grateful for.",
      },
      {
        mile: 126,
        name: 'Pocatello, Idaho',
        region: 'crossing Idaho at Pocatello',
        sign: ['Pocatello, ID'],
        badge: { id: 'stop-pocatello', title: 'Potato Country', icon: 'potato' },
        remember: 'Rest is productive too! Give yourself permission to slow down.',
      },
      {
        mile: 168,
        name: 'Idaho Falls, Idaho',
        region: 'beside the falls of the Snake River in Idaho Falls',
        sign: ['Idaho Falls, ID'],
        badge: { id: 'stop-idaho-falls', title: 'Snake River Falls', icon: 'falls' },
        remember: 'You are more than the work you do. Do something that brings you joy!',
      },
      {
        mile: 382,
        name: 'Helena, Montana',
        region: 'in Helena, Montana',
        sign: ['Helena, MT'],
        badge: { id: 'stop-helena', title: 'Last Chance Gulch', icon: 'pickaxe' },
        remember: "Compassion isn't just for clients. Speak to yourself with the same kindness you offer others.",
      },
      {
        mile: 445,
        name: 'Great Falls, Montana',
        region: 'in Great Falls, Montana',
        sign: ['Great Falls, MT'],
        badge: { id: 'stop-great-falls', title: 'Lewis and Clark Portage', icon: 'canoe' },
        remember: 'Boundaries are a gift you give yourself. Say no to one unnecessary obligation.',
      },
      {
        mile: 690,
        name: 'Calgary, Alberta',
        region: 'in Calgary, Alberta',
        sign: ['Calgary, AB'],
        scene: 'canada',
        badge: { id: 'stop-calgary', title: 'Stampede City', icon: 'cowboyhat' },
        remember: 'You are doing better than you think. Celebrate progress, not perfection.',
      },
      {
        mile: 862,
        name: 'Edmonton, Alberta',
        region: 'passing Edmonton',
        sign: ['Edmonton', 'AB'],
        scene: 'edmonton',
        badge: { id: 'stop-edmonton', title: 'Gateway to the North', icon: 'sun' },
        remember: 'Take time to refuel. Rest, nurture and do something that renews you.',
      },
      {
        mile: 975,
        name: 'Grande Prairie, Alberta',
        region: 'in Grande Prairie, Alberta',
        sign: ['Grande Prairie', 'AB'],
        badge: { id: 'stop-grande-prairie', title: 'Swan City', icon: 'swan' },
        remember: 'Joy is a form of self-care. Laughter lifts the soul!',
      },
      {
        mile: 1050,
        name: 'Fort St. John, British Columbia',
        region: 'on the Alaska Highway at Fort St. John',
        sign: ['Fort St. John', 'BC'],
        badge: { id: 'stop-fort-st-john', title: 'Alaska Highway', icon: 'highway' },
        remember: "Let go of what you can't control. Focus on what you can do.",
      },
      {
        mile: 1226,
        name: 'Fort Nelson, British Columbia',
        region: 'in Fort Nelson, in the Northern Rockies',
        sign: ['Fort Nelson', 'BC'],
        badge: { id: 'stop-fort-nelson', title: 'Serengeti of the North', icon: 'moose' },
        remember: 'You are enough. Give yourself grace today.',
      },
      {
        mile: 1313,
        name: 'Watson Lake, Yukon',
        region: 'at Watson Lake, the gateway to the Yukon',
        sign: ['Watson Lake', 'YT'],
        scene: 'north60',
        badge: { id: 'stop-watson-lake', title: 'Sign Post Forest', icon: 'signforest' },
        remember: 'Rest. Release. Reconnect. You matter.',
      },
      {
        mile: 1358,
        name: 'Whitehorse, Yukon',
        region: 'in Whitehorse, Yukon',
        sign: ['Whitehorse', 'YT'],
        badge: { id: 'stop-whitehorse', title: 'Sternwheeler Landing', icon: 'sternwheeler' },
        remember: 'Strengthen your spiritual foundation. Take time to pray, study or feel His love.',
      },
      {
        mile: 1589,
        name: 'Dawson City, Yukon',
        region: 'in Dawson City, Yukon',
        sign: ['Dawson City', 'YT'],
        badge: { id: 'stop-dawson-city', title: 'Klondike Gold', icon: 'goldpan' },
        remember: 'Find joy in the simple things. Nature can heal and restore.',
      },
      {
        mile: 1762,
        name: 'the Arctic Circle',
        region: 'above the Arctic Circle',
        sign: ['Arctic', 'Circle'],
        scene: 'arctic',
        badge: { id: 'stop-arctic', title: 'Crossed the Arctic Circle', icon: 'snowflake' },
        remember: 'Progress, not perfection! Every step counts.',
      },
      {
        mile: 1886,
        name: 'Inuvik, Northwest Territories',
        region: 'in Inuvik, Northwest Territories',
        sign: ['Inuvik, NT'],
        badge: { id: 'stop-inuvik', title: 'Igloo Church', icon: 'igloo' },
        remember: "You don't have to carry every burden. Release what isn't yours.",
      },
      {
        mile: 1961,
        name: 'Tuktoyaktuk, Northwest Territories',
        region: 'past Tuktoyaktuk, out on the Arctic sea ice',
        sign: ['Tuktoyaktuk', 'NT'],
        scene: 'coast',
        badge: { id: 'stop-tuktoyaktuk', title: 'Edge of the Continent', icon: 'wave' },
        remember: "Look how far you've come! Be proud of your hard work. Take time to notice the beauty around you.",
      },
      {
        mile: 3250,
        name: 'Mount Doom',
        region: 'skirting Mount Doom',
        sign: ['Mount Doom', 'Ahead!'],
        scene: 'volcano',
        badge: { id: 'stop-doom', title: 'Cleared Mt. Doom', icon: 'volcano' },
        remember: "Burnout ahead! Check in with your stress level. Rest, recharge and ask for support. You don't have to do it alone.",
      },
      {
        mile: 3340,
        name: 'the last stretch',
        region: 'on the last stretch',
        sign: ['Last', 'Stretch'],
        badge: { id: 'stop-last-stretch', title: 'The Last Stretch', icon: 'lantern' },
        remember: 'You can do hard things! Keep showing up. Your light matters.',
      },
      {
        mile: 3381,
        name: 'the North Pole',
        region: 'at the top of the world',
        sign: ['NORTH POLE'],
        scene: 'finish',
        badge: { id: 'stop-north-pole', title: 'Traveled to the North Pole', icon: 'candycane' },
        remember: 'We made it! Caring for ourselves helps us show up with more compassion, energy, and hope for others.',
      },
    ],
    milestones: [
      { mile: 65, name: 'the Idaho line', kind: 'border', badge: { id: 'out-of-utah', title: 'Out of Utah', icon: 'roadsign' } },
      { mile: 242, name: 'the Montana line at Monida Pass', kind: 'border', badge: { id: 'into-montana', title: 'Big Sky Country', icon: 'mountain' } },
      { mile: 548, name: 'the Canadian border', kind: 'border', badge: { id: 'into-canada', title: 'Into the Great White North', icon: 'mapleleaf' } },
      { mile: 1691, name: 'the halfway point', kind: 'milestone', badge: { id: 'stop-halfway', title: 'Halfway to Santa', icon: 'star' } },
      { mile: 2690, name: '80° North', kind: 'milestone', badge: { id: 'stop-80', title: 'Eighty Degrees North', icon: 'globe' } },
    ],
  },
};

// The server-side code in functions/ imports this same file so the awards
// use the very same stops. Browsers ignore this line.
if (typeof globalThis !== 'undefined') globalThis.JOURNEYS = JOURNEYS;
