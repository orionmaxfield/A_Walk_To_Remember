// The journey. Miles are measured along a straight line due north from Layton, Utah
// (41.06° N, roughly along 112° W) to the North Pole: 3,381 miles, at about
// 69.09 miles per degree of latitude.
//
// To add a new destination later, add another object to JOURNEYS with the same shape.
// Each waypoint has:
//   mile   — where the stop sits on the trail
//   name   — used in sentences ("Next up: Ogden, Utah")
//   region — finishes the sentence "Your team is …"
//   fact   — the "Did you know?" card for this stretch
//   sign   — (optional) the lines painted on the wooden signpost; defaults to the name
//   kind   — (optional) 'border' marks a state, country or territory line rather than a town
//   scene  — (optional) a hint for the storybook scene. Scenery it draws:
//            'start', 'halfway', 'arctic', 'volcano', 'workshop', 'finish', 'lake'
//            Seasons it keys on: 'canada', 'edmonton', 'nwt', 'coast'
//   badge  — (optional) the team award for reaching this stop: { id, title, icon }
//            (icons are drawn in badges.js)

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
        fact: 'The North Pole is 3,381 miles due north of Layton. Walk in a straight line and you would never need to turn, just keep going north until north runs out.',
      },
      {
        mile: 11,
        name: 'Ogden, Utah',
        region: 'passing through Ogden',
        sign: ['Ogden, UT'],
        badge: { id: 'stop-ogden', title: 'Railroad Town', icon: 'train' },
        fact: 'Ogden grew up around the railroad. After the Golden Spike joined the transcontinental line nearby in 1869, the town adopted the slogan "You can\'t get anywhere without coming to Ogden."',
      },
      {
        mile: 47,
        name: 'Logan, Utah',
        region: 'in Logan and Cache Valley',
        sign: ['Logan, UT'],
        badge: { id: 'stop-logan', title: 'Cache Valley Creamery', icon: 'icecream' },
        fact: 'Logan sits in Cache Valley, named for the fur trappers who hid, or "cached," their pelts here in the 1820s. Today the valley is famous for cheese, and Utah State University has been scooping its Aggie Ice Cream for about a century.',
      },
      {
        mile: 65,
        name: 'the Idaho line',
        region: 'crossing into Idaho',
        sign: ['Welcome to', 'Idaho'],
        kind: 'border',
        badge: { id: 'out-of-utah', title: 'Out of Utah', icon: 'roadsign' },
        fact: 'Idaho grows about a third of all the potatoes in the United States, and its license plate has said "Famous Potatoes" since 1957. The border here follows the 42nd parallel, a line drawn in an 1819 treaty with Spain.',
      },
      {
        mile: 126,
        name: 'Pocatello, Idaho',
        region: 'crossing Idaho at Pocatello',
        sign: ['Pocatello, ID'],
        badge: { id: 'stop-pocatello', title: 'Potato Country', icon: 'potato' },
        fact: 'In 1948, after an especially harsh winter, Pocatello passed a law making it illegal not to smile. It was meant as a joke to lift spirits, and the "Smile Ordinance" was never repealed.',
      },
      {
        mile: 242,
        name: 'the Montana line at Monida Pass',
        region: 'climbing Monida Pass into Montana',
        sign: ['Welcome to', 'Montana'],
        kind: 'border',
        badge: { id: 'into-montana', title: 'Big Sky Country', icon: 'mountain' },
        fact: 'Monida Pass takes its name from MONtana and IDAho. It sits on the Continental Divide at 6,823 feet: rain that falls on one side runs to the Pacific, and on the other side to the Gulf of Mexico.',
      },
      {
        mile: 382,
        name: 'Helena, Montana',
        region: 'in Helena, Montana',
        sign: ['Helena, MT'],
        badge: { id: 'stop-helena', title: 'Last Chance Gulch', icon: 'pickaxe' },
        fact: 'Helena was founded in 1864 by four prospectors who struck gold in a gulch they had called their last chance. Last Chance Gulch is still the name of the main street downtown.',
      },
      {
        mile: 548,
        name: 'the Canadian border',
        region: 'crossing into Canada',
        sign: ['Welcome to', 'Canada'],
        kind: 'border',
        scene: 'canada',
        badge: { id: 'into-canada', title: 'Into the Great White North', icon: 'mapleleaf' },
        fact: 'The border between the United States and Canada is the longest international border in the world, about 5,500 miles. A 20-foot-wide strip of trees is kept cleared along its whole length so the line is always visible.',
      },
      {
        mile: 690,
        name: 'Calgary, Alberta',
        region: 'in Calgary, Alberta',
        sign: ['Calgary, AB'],
        badge: { id: 'stop-calgary', title: 'Stampede City', icon: 'cowboyhat' },
        fact: 'Calgary hosted the 1988 Winter Olympics, the Games that made the Jamaican bobsled team and Eddie "the Eagle" Edwards famous. Every July the Calgary Stampede calls itself the Greatest Outdoor Show on Earth.',
      },
      {
        mile: 862,
        name: 'Edmonton, Alberta',
        region: 'passing Edmonton',
        sign: ['Edmonton', 'AB'],
        scene: 'edmonton',
        badge: { id: 'stop-edmonton', title: 'Gateway to the North', icon: 'sun' },
        fact: 'Edmonton is one of the northernmost big cities in North America. In midsummer the sky stays light past 10 p.m., and for about 20 years the West Edmonton Mall was the largest shopping mall in the world.',
      },
      {
        mile: 1309,
        name: 'the Northwest Territories line',
        region: 'crossing the 60th parallel into the Northwest Territories',
        sign: ['Northwest', 'Territories'],
        kind: 'border',
        scene: 'nwt',
        badge: { id: 'into-nwt', title: 'North of 60', icon: 'compass' },
        fact: 'The 60th parallel is the line between Canada\'s provinces and its northern territories. The Northwest Territories is bigger than Texas and California combined, and only about 45,000 people live there.',
      },
      {
        mile: 1478,
        name: 'Great Slave Lake',
        region: 'passing Yellowknife on Great Slave Lake',
        sign: ['Great Slave', 'Lake'],
        scene: 'lake',
        badge: { id: 'stop-great-slave', title: 'Deepest Lake', icon: 'lake' },
        fact: 'Great Slave Lake is the deepest lake in North America, more than 2,000 feet deep. Yellowknife, on its north shore, is one of the best places on Earth to see the northern lights.',
      },
      {
        mile: 1691,
        name: 'the halfway mark',
        region: 'halfway to Santa',
        sign: ['Halfway', 'to Santa!'],
        scene: 'halfway',
        badge: { id: 'stop-halfway', title: 'Halfway to Santa', icon: 'star' },
        fact: 'Halfway there: 1,691 miles down, 1,690 to go. The elf has turned to a fresh page in the notebook and written HALFWAY in very large letters. Santa has been notified.',
      },
      {
        mile: 1762,
        name: 'the Arctic Circle',
        region: 'above the Arctic Circle',
        sign: ['Arctic', 'Circle'],
        scene: 'arctic',
        badge: { id: 'stop-arctic', title: 'Crossed the Arctic Circle', icon: 'snowflake' },
        fact: 'North of this line, the sun stays up for at least one full day each summer and stays down for at least one full day each winter. Keep an eye out for polar bears.',
      },
      {
        mile: 1861,
        name: 'the Arctic Ocean coast',
        region: 'at the edge of the Arctic Ocean',
        sign: ['Arctic', 'Ocean'],
        scene: 'coast',
        badge: { id: 'stop-coast', title: 'Edge of the Continent', icon: 'wave' },
        fact: 'Here the mainland of North America ends. The nearest town is Kugluktuk, a village of about 1,500 people at the mouth of the Coppermine River, where the Arctic Ocean freezes solid every winter and the sea ice becomes the road.',
      },
      {
        mile: 2065,
        name: 'Victoria Island',
        region: 'crossing Victoria Island',
        sign: ['Victoria', 'Island'],
        badge: { id: 'stop-victoria', title: 'Island Hopper', icon: 'island' },
        fact: 'Victoria Island is the eighth-largest island in the world, bigger than Great Britain, yet only about 2,000 people live on it. Its biggest town, Cambridge Bay, is a stop on the Northwest Passage.',
      },
      {
        mile: 2345,
        name: '75° North, where the sea ice begins',
        region: 'stepping onto the sea ice at 75° North',
        sign: ['75° North', 'Sea Ice'],
        fact: 'From here on there is no land at all, only frozen ocean. The ice is often just 6 to 10 feet thick, floating on water that is more than two miles deep at the Pole.',
      },
      {
        mile: 2690,
        name: '80° North',
        region: 'in the high Arctic at 80° North',
        sign: ['80° North'],
        badge: { id: 'stop-80', title: 'Eighty Degrees North', icon: 'globe' },
        fact: 'You are now farther north than almost every settlement on Earth. In 1958 the submarine USS Nautilus became the first vessel to reach the North Pole, by sailing underneath the ice.',
      },
      {
        mile: 2875,
        name: 'Mt. Doom',
        region: 'skirting Mt. Doom',
        sign: ['Mt. Doom', 'Ahead!'],
        scene: 'volcano',
        badge: { id: 'stop-doom', title: 'Cleared Mt. Doom', icon: 'volcano' },
        fact: 'Our office map insists a volcano smolders out here on the ice. The elf\'s notes read: "Lava is warm. Do not touch the lava. Keep walking." Marshmallows were not provided.',
      },
      {
        mile: 3036,
        name: '85° North',
        region: 'nearly there, at 85° North',
        sign: ['85° North'],
        fact: 'Explorers argued for a century about who reached the Pole first. The first trip everyone agrees on was in 1968, by snowmobile, and it took Ralph Plaisted\'s team 43 days.',
      },
      {
        mile: 3300,
        name: "Santa's Workshop",
        region: "at Santa's Workshop",
        sign: ["Santa's", 'Workshop'],
        scene: 'workshop',
        badge: { id: 'stop-workshop', title: 'Workshop Visitor', icon: 'gift' },
        fact: 'The lights are on and the cocoa is hot. The counselor elf stops in to check on everybody: 81 miles to go, and every one of them has been earned together.',
      },
      {
        mile: 3381,
        name: 'the North Pole',
        region: 'at the top of the world',
        sign: ['NORTH POLE'],
        scene: 'finish',
        badge: { id: 'stop-north-pole', title: 'Traveled to the North Pole', icon: 'candycane' },
        fact: 'At the North Pole every direction is south, every time zone meets, and the sun rises and sets only once a year. You walked 3,381 miles to stand here.',
      },
    ],
  },
};

// The server-side code in functions/ imports this same file so the awards
// use the very same stops. Browsers ignore this line.
if (typeof globalThis !== 'undefined') globalThis.JOURNEYS = JOURNEYS;
