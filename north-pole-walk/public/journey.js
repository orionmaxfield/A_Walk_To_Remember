// The journey. Miles follow the office tracker poster: 2,000 miles from Layton, Utah
// to the North Pole, with a signpost at every stop along the way.
//
// To add a new destination later, add another object to JOURNEYS with the same shape.
// Each waypoint has:
//   mile   — where the stop sits on the trail
//   name   — used in sentences ("Next up: Ogden, Utah")
//   region — finishes the sentence "Your team is …"
//   fact   — the "Did you know?" card for this stretch
//   sign   — (optional) the lines painted on the wooden signpost; defaults to the name
//   scene  — (optional) extra scenery the storybook scene draws here:
//            'start', 'halfway', 'arctic', 'volcano', 'workshop', 'finish'
//   kind   — (optional) 'border' marks a state or country line rather than a town
//   badge  — the team award for reaching this stop: { id, title, icon }
//            (icons are drawn in badges.js)

const JOURNEYS = {
  'north-pole': {
    id: 'north-pole',
    title: 'The Walk to the North Pole',
    start: 'Layton, Utah',
    end: 'The North Pole',
    totalMiles: 2000,
    waypoints: [
      {
        mile: 0,
        name: 'Layton, Utah',
        region: 'leaving Layton',
        sign: ['Layton, UT'],
        scene: 'start',
        fact: 'Layton sits at the foot of the Wasatch Mountains next to Hill Air Force Base, and it is the biggest city in Davis County. Our office map says the North Pole is 2,000 miles from here. Lace up.',
      },
      {
        mile: 105,
        name: 'Ogden, Utah',
        region: 'passing through Ogden',
        sign: ['Ogden, UT'],
        badge: { id: 'stop-ogden', title: 'Railroad Town', icon: 'train' },
        fact: 'Ogden grew up around the railroad. After the Golden Spike joined the transcontinental line nearby in 1869, the town adopted the slogan "You can\'t get anywhere without coming to Ogden."',
      },
      {
        mile: 210,
        name: 'Logan, Utah',
        region: 'in Logan and Cache Valley',
        sign: ['Logan, UT'],
        badge: { id: 'stop-logan', title: 'Cache Valley Creamery', icon: 'icecream' },
        fact: 'Logan sits in Cache Valley, named for the fur trappers who hid, or "cached," their pelts here in the 1820s. Today the valley is famous for cheese, and Utah State University has been scooping its Aggie Ice Cream for about a century.',
      },
      {
        mile: 260,
        name: 'the Idaho line',
        region: 'crossing into Idaho',
        sign: ['Welcome to', 'Idaho'],
        kind: 'border',
        badge: { id: 'out-of-utah', title: 'Out of Utah', icon: 'roadsign' },
        fact: 'Idaho grows about a third of all the potatoes in the United States, and the state license plate has said "Famous Potatoes" since 1957. The border here follows the 42nd parallel, a line drawn in an 1819 treaty with Spain.',
      },
      {
        mile: 421,
        name: 'Pocatello, Idaho',
        region: 'crossing Idaho at Pocatello',
        sign: ['Pocatello, ID'],
        badge: { id: 'stop-pocatello', title: 'Potato Country', icon: 'potato' },
        fact: 'In 1948, after an especially harsh winter, Pocatello passed a law making it illegal not to smile. It was meant as a joke to lift spirits, and the "Smile Ordinance" was never repealed.',
      },
      {
        mile: 632,
        name: 'Helena, Montana',
        region: 'in Helena, Montana',
        sign: ['Helena, MT'],
        badge: { id: 'stop-helena', title: 'Last Chance Gulch', icon: 'pickaxe' },
        fact: 'Helena was founded in 1864 by four prospectors who struck gold in a gulch they had called their last chance. Last Chance Gulch is still the name of the main street downtown.',
      },
      {
        mile: 740,
        name: 'the Canadian border',
        region: 'crossing into Canada',
        sign: ['Welcome to', 'Canada'],
        kind: 'border',
        badge: { id: 'into-canada', title: 'Into the Great White North', icon: 'mapleleaf' },
        fact: 'The border between the United States and Canada is the longest international border in the world, about 5,500 miles. A 20-foot-wide strip of trees is kept cleared along its whole length so the line is always visible.',
      },
      {
        mile: 842,
        name: 'Calgary, Alberta',
        region: 'in Calgary, Alberta',
        sign: ['Calgary, AB'],
        badge: { id: 'stop-calgary', title: 'Stampede City', icon: 'cowboyhat' },
        fact: 'Calgary hosted the 1988 Winter Olympics, the Games that made the Jamaican bobsled team and Eddie "the Eagle" Edwards famous. Every July the Calgary Stampede calls itself the Greatest Outdoor Show on Earth.',
      },
      {
        mile: 1000,
        name: 'the halfway mark',
        region: 'halfway to Santa',
        sign: ['Halfway', 'to Santa!'],
        badge: { id: 'stop-halfway', title: 'Halfway to Santa', icon: 'star' },
        scene: 'halfway',
        fact: 'One thousand miles down, one thousand to go. The elf has turned to a fresh page in the notebook and written HALFWAY in very large letters. Santa has been notified.',
      },
      {
        mile: 1053,
        name: 'Edmonton, Alberta',
        region: 'passing Edmonton',
        sign: ['Edmonton', 'AB'],
        badge: { id: 'stop-edmonton', title: 'Gateway to the North', icon: 'sun' },
        fact: 'Edmonton is one of the northernmost big cities in North America. In midsummer the sky stays light past 10 p.m., and for about 20 years the West Edmonton Mall was the largest shopping mall in the world.',
      },
      {
        mile: 1263,
        name: 'the Yukon wilderness',
        region: 'deep in the Yukon wilderness',
        sign: ['Yukon', 'Wilderness'],
        badge: { id: 'stop-yukon', title: 'Yukon Wild', icon: 'moose' },
        fact: 'The Yukon is bigger than California, yet only about 45,000 people live there, most of them in Whitehorse. Mount Logan, the tallest mountain in Canada, is here, and moose outnumber people.',
      },
      {
        mile: 1474,
        name: 'the Arctic Circle',
        region: 'above the Arctic Circle',
        sign: ['Arctic', 'Circle'],
        badge: { id: 'stop-arctic', title: 'Crossed the Arctic Circle', icon: 'snowflake' },
        scene: 'arctic',
        fact: 'North of this line, the sun stays up for at least one full day each summer and stays down for at least one full day each winter. Keep an eye out for polar bears.',
      },
      {
        mile: 1700,
        name: 'Mt. Doom',
        region: 'skirting Mt. Doom',
        sign: ['Mt. Doom', 'Ahead!'],
        badge: { id: 'stop-doom', title: 'Cleared Mt. Doom', icon: 'volcano' },
        scene: 'volcano',
        fact: 'Our office map insists a volcano smolders here. The elf\'s notes read: "Lava is warm. Do not touch the lava. Keep walking." Marshmallows were not provided.',
      },
      {
        mile: 1895,
        name: "Santa's Workshop",
        region: "at Santa's Workshop",
        sign: ["Santa's", 'Workshop'],
        badge: { id: 'stop-workshop', title: 'Workshop Visitor', icon: 'gift' },
        scene: 'workshop',
        fact: 'The lights are on and the cocoa is hot. The counselor elf stops in to check on everybody: 105 miles to go, and every one of them has been earned together.',
      },
      {
        mile: 2000,
        name: 'the North Pole',
        region: 'at the top of the world',
        sign: ['NORTH POLE'],
        badge: { id: 'stop-north-pole', title: 'Traveled to the North Pole', icon: 'candycane' },
        scene: 'finish',
        fact: 'At the North Pole every direction is south, every time zone meets, and the sun rises and sets only once a year. You walked 2,000 miles to stand here.',
      },
    ],
  },
};

// The server-side code in functions/ imports this same file so the awards
// use the very same stops. Browsers ignore this line.
if (typeof globalThis !== 'undefined') globalThis.JOURNEYS = JOURNEYS;
