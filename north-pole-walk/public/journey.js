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
        fact: 'Ogden grew up around the railroad. After the Golden Spike joined the transcontinental line nearby in 1869, the town adopted the slogan "You can\'t get anywhere without coming to Ogden."',
      },
      {
        mile: 210,
        name: 'Logan, Utah',
        region: 'in Logan and Cache Valley',
        sign: ['Logan, UT'],
        fact: 'Logan sits in Cache Valley, named for the fur trappers who hid, or "cached," their pelts here in the 1820s. Today the valley is famous for cheese, and Utah State University has been scooping its Aggie Ice Cream for about a century.',
      },
      {
        mile: 421,
        name: 'Pocatello, Idaho',
        region: 'crossing Idaho at Pocatello',
        sign: ['Pocatello, ID'],
        fact: 'In 1948, after an especially harsh winter, Pocatello passed a law making it illegal not to smile. It was meant as a joke to lift spirits, and the "Smile Ordinance" was never repealed.',
      },
      {
        mile: 632,
        name: 'Helena, Montana',
        region: 'in Helena, Montana',
        sign: ['Helena, MT'],
        fact: 'Helena was founded in 1864 by four prospectors who struck gold in a gulch they had called their last chance. Last Chance Gulch is still the name of the main street downtown.',
      },
      {
        mile: 842,
        name: 'Calgary, Alberta',
        region: 'in Calgary, Alberta',
        sign: ['Calgary, AB'],
        fact: 'Calgary hosted the 1988 Winter Olympics, the Games that made the Jamaican bobsled team and Eddie "the Eagle" Edwards famous. Every July the Calgary Stampede calls itself the Greatest Outdoor Show on Earth.',
      },
      {
        mile: 1000,
        name: 'the halfway mark',
        region: 'halfway to Santa',
        sign: ['Halfway', 'to Santa!'],
        scene: 'halfway',
        fact: 'One thousand miles down, one thousand to go. The elf has turned to a fresh page in the notebook and written HALFWAY in very large letters. Santa has been notified.',
      },
      {
        mile: 1053,
        name: 'Edmonton, Alberta',
        region: 'passing Edmonton',
        sign: ['Edmonton', 'AB'],
        fact: 'Edmonton is one of the northernmost big cities in North America. In midsummer the sky stays light past 10 p.m., and for about 20 years the West Edmonton Mall was the largest shopping mall in the world.',
      },
      {
        mile: 1263,
        name: 'the Yukon wilderness',
        region: 'deep in the Yukon wilderness',
        sign: ['Yukon', 'Wilderness'],
        fact: 'The Yukon is bigger than California, yet only about 45,000 people live there, most of them in Whitehorse. Mount Logan, the tallest mountain in Canada, is here, and moose outnumber people.',
      },
      {
        mile: 1474,
        name: 'the Arctic Circle',
        region: 'above the Arctic Circle',
        sign: ['Arctic', 'Circle'],
        scene: 'arctic',
        fact: 'North of this line, the sun stays up for at least one full day each summer and stays down for at least one full day each winter. Keep an eye out for polar bears.',
      },
      {
        mile: 1700,
        name: 'Mt. Doom',
        region: 'skirting Mt. Doom',
        sign: ['Mt. Doom', 'Ahead!'],
        scene: 'volcano',
        fact: 'Our office map insists a volcano smolders here. The elf\'s notes read: "Lava is warm. Do not touch the lava. Keep walking." Marshmallows were not provided.',
      },
      {
        mile: 1895,
        name: "Santa's Workshop",
        region: "at Santa's Workshop",
        sign: ["Santa's", 'Workshop'],
        scene: 'workshop',
        fact: 'The lights are on and the cocoa is hot. The counselor elf stops in to check on everybody: 105 miles to go, and every one of them has been earned together.',
      },
      {
        mile: 2000,
        name: 'the North Pole',
        region: 'at the top of the world',
        sign: ['NORTH POLE'],
        scene: 'finish',
        fact: 'At the North Pole every direction is south, every time zone meets, and the sun rises and sets only once a year. You walked 2,000 miles to stand here.',
      },
    ],
  },
};
