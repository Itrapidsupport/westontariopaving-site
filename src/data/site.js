// Every fact below is copied from westontariopaving.com (harvested 2026-11-15). Nothing invented.
export const biz = {
  name: 'West Ontario Paving',
  legal: 'West Ontario Paving Ltd.',
  email: 'info@westontariopaving.com',
  street: '14-3650 Langstaff Road, Suite 365',
  city: 'Woodbridge',
  region: 'ON',
  postal: 'L4L 9A8',
  phones: [
    { label: 'Office', num: '905-840-4089', tel: '+19058404089' },
    { label: 'Toronto', num: '416-886-7676', tel: '+14168867676' },
    { label: 'Toll free', num: '1-844-467-2831', tel: '+18444672831', vanity: '1-844-GOPAVE-1' },
  ],
  hours: '8:00 am – 8:00 pm',
  founded: '1994',
  facebook: 'https://www.facebook.com/westontario.paving',
  instagram: 'https://www.instagram.com/west_ontario_paving/',
};
export const tollFree = biz.phones[2];

export const areas = {
  gta: ['Toronto', 'North York', 'Etobicoke', 'Brampton', 'Mississauga', 'Oakville', 'Burlington', 'Vaughan', 'Woodbridge', 'Kleinburg', 'Maple', 'Richmond Hill', 'Thornhill', 'Markham', 'Aurora', 'Newmarket', 'King City', 'King Township', 'Bolton', 'Bradford', 'Nobleton', 'Caledon', 'Georgetown', 'Milton', 'Orangeville', 'Ajax'],
  simcoe: ['Barrie', 'Innisfil', 'Oro-Medonte', 'Midhurst', 'Springwater', 'Cookstown', 'Moonstone', 'Wasaga Beach', 'Collingwood', 'Clearview', 'Blue Mountain', 'Meaford', 'Beaver Valley', 'Orillia', 'Midland', 'Penetanguishene', 'Tiny', 'Gravenhurst'],
};

export const reviews = [
  { text: 'Recently secured West Ontario Paving to complete the reconstruction of my retaining walls and paving my driveway. Gaetano and his team saw to it that the job was completed efficiently, professionally and the end result was perfect. I can’t thank Gaetano enough, he kept his word from start to finish which resulted in zero stress for me. I highly recommend West Ontario Paving.', name: 'Olga', place: 'Toronto', stars: 5 },
  { text: 'Had a great experience with this company. Awesome crew, they were efficient, professional and hard working. They took the time to be sure the work was done properly, no cutting corners. Couldn’t be happier. Would definitely recommend.', name: 'Sandeep', place: 'Pefferlaw', stars: 5 },
  { text: 'Highly recommended as one of the most professional crew and well organized. Gaetano is professional and hands on when needed.', name: 'E Kenaci', place: 'Mississauga', stars: 5 },
  { text: 'Amazing work. Wonderful service. Everything was done in a timely manner. Professional and friendly. Have recommended and will continue to recommend!!', name: 'Client review', place: 'Barrie, Ontario', stars: 4 },
];

export const services = [
  { name: 'Asphalt paving', img: 'house', text: 'Driveways, laneways, parking lots and roadways, installed with proper grading, compaction and drainage.' },
  { name: 'Paving repairs', img: 'skid2', text: 'Crack filling, pothole patching and resurfacing on residential and commercial properties.' },
  { name: 'Concrete paving', img: 'walk', text: 'Concrete driveways, pads, curbs and commercial applications where long-term durability is the priority.' },
  { name: 'Interlock installation', img: 'stairs', text: 'Driveways, patios, walkways and retaining walls in interlocking stone, plus jewel stone.' },
];
