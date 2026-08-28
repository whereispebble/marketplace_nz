export const VEHICLE_TYPES = [
  { id: 'all', name: 'All vehicles' },
  { id: 'campervan', name: 'Campervans' },
  { id: 'motorhome', name: 'Motorhomes' },
  { id: 'van', name: 'Van conversions' },
  { id: '4x4', name: '4x4 campers' },
  { id: 'car', name: 'Cars soon' },
]

// Marcas: lista exacta de la API publica de Trade Me
// (https://api.trademe.co.nz/v1/Categories/UsedCars.json), 99 entradas.
// Modelos: catalogo curado de los mas vendidos en Nueva Zelanda para las marcas
// principales. Las marcas sin modelos listados dejan el campo como texto libre.
export const NZ_VEHICLE_CATALOG = [
  { make: 'Alfa Romeo', models: ['Giulia', 'Giulietta', 'Stelvio', 'Tonale'] },
  { make: 'Arcfox', models: [] },
  { make: 'Aston Martin', models: [] },
  { make: 'Audi', models: ['A1', 'A3', 'A4', 'A5', 'A6', 'e-tron', 'Q2', 'Q3', 'Q5', 'Q7', 'Q8', 'TT'] },
  { make: 'Austin', models: [] },
  { make: 'BAIC', models: [] },
  { make: 'Bentley', models: [] },
  { make: 'BMW', models: ['1 Series', '2 Series', '3 Series', '4 Series', '5 Series', '7 Series', 'i3', 'i4', 'iX', 'X1', 'X3', 'X5', 'X7'] },
  { make: 'Buick', models: [] },
  { make: 'BYD', models: ['Atto 3', 'Dolphin', 'Seal', 'Sealion', 'Shark'] },
  { make: 'Cadillac', models: [] },
  { make: 'Chery', models: [] },
  { make: 'Chevrolet', models: ['Camaro', 'Colorado', 'Corvette', 'Silverado'] },
  { make: 'Chrysler', models: ['300C', 'Grand Voyager', 'Voyager'] },
  { make: 'Citroen', models: ['Berlingo', 'C3', 'C4', 'C5', 'Dispatch', 'Jumper', 'Relay'] },
  { make: 'Cupra', models: [] },
  { make: 'Daewoo', models: [] },
  { make: 'Daihatsu', models: ['Charade', 'Hijet', 'Mira', 'Move', 'Terios'] },
  { make: 'Daimler', models: [] },
  { make: 'DENZA', models: [] },
  { make: 'DFSK', models: [] },
  { make: 'Dodge', models: ['Journey', 'Nitro', 'Ram'] },
  { make: 'Dongfeng', models: [] },
  { make: 'DS Automobiles', models: [] },
  { make: 'Farizon', models: [] },
  { make: 'Ferrari', models: [] },
  { make: 'Fiat', models: ['500', 'Doblo', 'Ducato', 'Scudo', 'Talento'] },
  { make: 'Ford', models: ['Econovan', 'Escape', 'Everest', 'Explorer', 'Fiesta', 'Focus', 'Mondeo', 'Mustang', 'Ranger', 'Territory', 'Tourneo', 'Transit', 'Transit Connect', 'Transit Custom'] },
  { make: 'Forthing', models: [] },
  { make: 'Foton', models: [] },
  { make: 'GAC', models: [] },
  { make: 'Geely', models: [] },
  { make: 'Genesis', models: [] },
  { make: 'GMC', models: [] },
  { make: 'GWM', models: ['Cannon', 'Haval H6', 'Ora', 'Tank 300', 'Tank 500'] },
  { make: 'HAVAL', models: ['H2', 'H6', 'H9', 'Jolion'] },
  { make: 'Holden', models: ['Astra', 'Barina', 'Captiva', 'Colorado', 'Commodore', 'Cruze', 'Trailblazer', 'Trax'] },
  { make: 'Honda', models: ['Accord', 'City', 'Civic', 'CR-V', 'Fit', 'Freed', 'HR-V', 'Jazz', 'Odyssey', 'Stepwgn'] },
  { make: 'Humber', models: [] },
  { make: 'Hummer', models: [] },
  { make: 'Hyundai', models: ['Elantra', 'H-1', 'i20', 'i30', 'Ioniq', 'iLoad', 'iMax', 'Kona', 'Santa Fe', 'Staria', 'Tucson'] },
  { make: 'INEOS', models: [] },
  { make: 'INFINITI', models: ['Q50', 'QX50', 'QX60'] },
  { make: 'Isuzu', models: ['Bighorn', 'D-Max', 'Elf', 'Fargo', 'MU-X', 'N-Series'] },
  { make: 'Iveco', models: ['Daily'] },
  { make: 'JAC', models: [] },
  { make: 'JAECOO', models: [] },
  { make: 'Jaguar', models: ['E-Pace', 'F-Pace', 'XE', 'XF', 'XJ'] },
  { make: 'Jeep', models: ['Cherokee', 'Compass', 'Grand Cherokee', 'Wrangler'] },
  { make: 'KGM', models: [] },
  { make: 'Kia', models: ['Carnival', 'Cerato', 'EV6', 'Niro', 'Picanto', 'Rio', 'Seltos', 'Sorento', 'Sportage', 'Stonic'] },
  { make: 'Lamborghini', models: [] },
  { make: 'Lancia', models: [] },
  { make: 'Land Rover', models: ['Defender', 'Discovery', 'Discovery Sport', 'Freelander', 'Range Rover', 'Range Rover Evoque', 'Range Rover Sport'] },
  { make: 'LDV', models: ['Deliver 9', 'eDeliver 9', 'G10', 'T60', 'V80'] },
  { make: 'Leapmotor', models: [] },
  { make: 'Lexus', models: ['CT', 'ES', 'IS', 'NX', 'RX', 'UX'] },
  { make: 'Lotus', models: [] },
  { make: 'Mahindra', models: ['Pik-Up', 'Scorpio', 'XUV700'] },
  { make: 'Maserati', models: [] },
  { make: 'Mazda', models: ['Atenza', 'Axela', 'Biante', 'Bongo', 'BT-50', 'CX-3', 'CX-5', 'CX-8', 'CX-9', 'Demio', 'Mazda2', 'Mazda3', 'Mazda6', 'MPV', 'Premacy'] },
  { make: 'McLaren', models: [] },
  { make: 'Mercedes-Benz', models: ['A-Class', 'C-Class', 'E-Class', 'GLA', 'GLC', 'GLE', 'Sprinter', 'V-Class', 'Valente', 'Vito'] },
  { make: 'MG', models: ['HS', 'MG3', 'MG4', 'MG5', 'ZS'] },
  { make: 'MINI', models: ['Clubman', 'Cooper', 'Countryman'] },
  { make: 'Mitsubishi', models: ['ASX', 'Delica', 'Eclipse Cross', 'L300', 'Lancer', 'Outlander', 'Pajero', 'Pajero Sport', 'Triton'] },
  { make: 'Morgan', models: [] },
  { make: 'Morris', models: [] },
  { make: 'Nio', models: [] },
  { make: 'Nissan', models: ['Caravan', 'Dualis', 'e-NV200', 'Elgrand', 'Juke', 'Leaf', 'Navara', 'Note', 'NV200', 'NV350', 'Pathfinder', 'Qashqai', 'Serena', 'Skyline', 'Tiida', 'X-Trail'] },
  { make: 'OMODA', models: [] },
  { make: 'Opel', models: ['Astra', 'Combo', 'Vivaro'] },
  { make: 'Peugeot', models: ['208', '2008', '308', '3008', '5008', 'Boxer', 'Expert', 'Partner', 'Traveller'] },
  { make: 'Polestar', models: ['Polestar 2', 'Polestar 3'] },
  { make: 'Pontiac', models: [] },
  { make: 'Porsche', models: ['911', 'Cayenne', 'Macan', 'Panamera'] },
  { make: 'Ram', models: ['1500', '2500', '3500'] },
  { make: 'Renault', models: ['Captur', 'Clio', 'Kangoo', 'Koleos', 'Master', 'Megane', 'Trafic'] },
  { make: 'Riley', models: [] },
  { make: 'Rolls-Royce', models: [] },
  { make: 'Rover', models: [] },
  { make: 'Saab', models: [] },
  { make: 'SEAT', models: ['Ibiza', 'Leon'] },
  { make: 'Skoda', models: ['Fabia', 'Karoq', 'Kodiaq', 'Octavia', 'Superb'] },
  { make: 'Smart', models: [] },
  { make: 'Ssangyong', models: ['Korando', 'Musso', 'Rexton', 'Tivoli'] },
  { make: 'Studebaker', models: [] },
  { make: 'Subaru', models: ['BRZ', 'Forester', 'Impreza', 'Legacy', 'Levorg', 'Outback', 'WRX', 'XV'] },
  { make: 'Suzuki', models: ['Baleno', 'Every', 'Ignis', 'Jimny', 'S-Cross', 'Swift', 'Vitara'] },
  { make: 'Tesla', models: ['Model 3', 'Model S', 'Model X', 'Model Y'] },
  { make: 'Toyota', models: ['Alphard', 'Aqua', 'Auris', 'Camry', 'Corolla', 'Estima', 'Hiace', 'Highlander', 'Hilux', 'Land Cruiser', 'Land Cruiser Prado', 'LiteAce', 'Noah', 'Prius', 'RAV4', 'Regius', 'Sienta', 'TownAce', 'Vitz', 'Voxy', 'Yaris', 'Yaris Cross'] },
  { make: 'Triumph', models: [] },
  { make: 'TVR', models: [] },
  { make: 'Vauxhall', models: [] },
  { make: 'Volkswagen', models: ['Amarok', 'Caddy', 'California', 'Caravelle', 'Crafter', 'Golf', 'ID.4', 'Multivan', 'Passat', 'Polo', 'Tiguan', 'Touareg', 'Transporter'] },
  { make: 'Volvo', models: ['EX30', 'S60', 'V40', 'V60', 'XC40', 'XC60', 'XC90'] },
  { make: 'XPENG', models: [] },
  { make: 'Zeekr', models: [] },
  { make: 'Other', models: [] },
]

const FEATURED_MOCK_VEHICLES = [
  {
    id: 1,
    transmission: 'Manual',
    year: 2014,
    title: 'Toyota Hiace Self-Contained Camper',
    make: 'Toyota',
    model: 'Toyota Hiace',
    vehicleType: 'campervan',
    price: 38500,
    mileage: 168000,
    condition: 'Excellent',
    wof: 'Valid until Sep 2026',
    sleeps: 2,
    belts: 3,
    selfContained: true,
    location: 'Auckland',
    region: 'Auckland',
    lat: -36.8485,
    lng: 174.7633,
    category: 'campervan',
    image: 'https://images.unsplash.com/photo-1533591380348-14193f1de18f?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1533591380348-14193f1de18f?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Reliable NZ-new Hiace camper with certified self-contained setup, rear kitchen, solar, dual battery and a tidy fold-out bed. Great for North Island weekend trips or a full lap of Aotearoa.',
    views: 214,
    seller: { id: 'aroha-campers', name: 'Aroha Campers', rating: 4.9, sales: 18, joined: '2023' },
  },
  {
    id: 2,
    transmission: 'Automatic',
    year: 2018,
    title: 'Mercedes Sprinter Off-Grid Conversion',
    make: 'Mercedes-Benz',
    model: 'Mercedes Sprinter',
    vehicleType: 'van',
    price: 72900,
    mileage: 94000,
    condition: 'Very good',
    wof: 'Valid until Jan 2027',
    sleeps: 2,
    belts: 2,
    selfContained: true,
    location: 'Queenstown',
    region: 'Otago',
    lat: -45.0312,
    lng: 168.6626,
    category: 'van',
    image: 'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'High-roof Sprinter conversion with diesel heater, fixed bed, 300W solar, lithium battery and mountain-ready storage. Built for South Island seasons.',
    views: 331,
    seller: { id: 'southern-van-co', name: 'Southern Van Co.', rating: 4.8, sales: 31, joined: '2021' },
  },
  {
    id: 3,
    transmission: 'Automatic',
    year: 2012,
    title: 'Fiat Ducato 4 Berth Motorhome',
    make: 'Fiat',
    model: 'Fiat Ducato',
    vehicleType: 'motorhome',
    price: 89500,
    mileage: 76000,
    condition: 'Excellent',
    wof: 'Valid until Nov 2026',
    sleeps: 4,
    belts: 4,
    selfContained: true,
    location: 'Christchurch',
    region: 'Canterbury',
    lat: -43.5321,
    lng: 172.6362,
    category: 'motorhome',
    image: 'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Comfortable 4 berth Ducato motorhome with shower, toilet, full kitchen, certified self-contained status and excellent storage for family touring.',
    views: 186,
    seller: { id: 'canterbury-rv', name: 'Canterbury RV', rating: 4.7, sales: 44, joined: '2020' },
  },
  {
    id: 4,
    transmission: 'Manual',
    year: 2009,
    title: 'Mitsubishi Delica 4x4 Weekender',
    make: 'Mitsubishi',
    model: 'Mitsubishi Delica',
    vehicleType: '4x4',
    price: 24900,
    mileage: 201000,
    condition: 'Good',
    wof: 'Valid until Jul 2026',
    sleeps: 2,
    belts: 5,
    selfContained: false,
    location: 'Nelson',
    region: 'Nelson Tasman',
    lat: -41.2706,
    lng: 173.2840,
    category: '4x4',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Compact 4x4 camper for gravel roads, beaches and ski weekends. Simple bed platform, awning and plenty of gear storage.',
    views: 149,
    seller: { id: 'tama-r', name: 'Tama R.', rating: 4.6, sales: 6, joined: '2024' },
  },
  {
    id: 5,
    transmission: 'Manual',
    year: 2016,
    title: 'Ford Transit Custom Camper',
    make: 'Ford',
    model: 'Ford Transit',
    vehicleType: 'campervan',
    price: 46900,
    mileage: 112000,
    condition: 'Very good',
    wof: 'Valid until Aug 2026',
    sleeps: 2,
    belts: 3,
    selfContained: true,
    location: 'Wellington',
    region: 'Wellington',
    lat: -41.2865,
    lng: 174.7762,
    category: 'campervan',
    image: 'https://images.unsplash.com/photo-1594495894542-a46cc73e081a?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1594495894542-a46cc73e081a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Easy-driving Transit Custom with certified self-contained layout, removable table, fridge, sink and weekend-friendly storage.',
    views: 121,
    seller: { id: 'welly-vans', name: 'Welly Vans', rating: 4.8, sales: 13, joined: '2022' },
  },
  {
    id: 6,
    transmission: 'Manual',
    year: 2007,
    title: 'Nissan Caravan Budget Camper',
    make: 'Nissan',
    model: 'Nissan Caravan',
    vehicleType: 'campervan',
    price: 18900,
    mileage: 238000,
    condition: 'Needs work',
    wof: 'Valid until May 2026',
    sleeps: 2,
    belts: 3,
    selfContained: false,
    location: 'Rotorua',
    region: 'Bay of Plenty',
    lat: -38.1368,
    lng: 176.2497,
    category: 'campervan',
    image: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=900&q=80',
    images: [
      'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1533591380348-14193f1de18f?auto=format&fit=crop&w=1200&q=80',
    ],
    description: 'Simple and affordable camper setup with bed platform, curtains and camping storage. A practical first van for summer road trips.',
    views: 98,
    seller: { id: 'mia-k', name: 'Mia K.', rating: 4.5, sales: 3, joined: '2024' },
  },
]

const MOCK_LOCATIONS = [
  { location: 'Auckland', region: 'Auckland', lat: -36.8485, lng: 174.7633 },
  { location: 'Wellington', region: 'Wellington', lat: -41.2865, lng: 174.7762 },
  { location: 'Christchurch', region: 'Canterbury', lat: -43.5321, lng: 172.6362 },
  { location: 'Queenstown', region: 'Otago', lat: -45.0312, lng: 168.6626 },
  { location: 'Nelson', region: 'Nelson Tasman', lat: -41.2706, lng: 173.2840 },
  { location: 'Rotorua', region: 'Bay of Plenty', lat: -38.1368, lng: 176.2497 },
  { location: 'Tauranga', region: 'Bay of Plenty', lat: -37.6878, lng: 176.1651 },
  { location: 'Hamilton', region: 'Waikato', lat: -37.7870, lng: 175.2793 },
  { location: 'Dunedin', region: 'Otago', lat: -45.8788, lng: 170.5028 },
  { location: 'Napier', region: 'Hawke\'s Bay', lat: -39.4928, lng: 176.9120 },
  { location: 'New Plymouth', region: 'Taranaki', lat: -39.0556, lng: 174.0752 },
  { location: 'Whangarei', region: 'Northland', lat: -35.7251, lng: 174.3237 },
  { location: 'Wanaka', region: 'Otago', lat: -44.7032, lng: 169.1321 },
  { location: 'Invercargill', region: 'Southland', lat: -46.4132, lng: 168.3538 },
  { location: 'Palmerston North', region: 'Manawatu-Whanganui', lat: -40.3523, lng: 175.6082 },
  { location: 'Blenheim', region: 'Marlborough', lat: -41.5134, lng: 173.9612 },
  { location: 'Timaru', region: 'Canterbury', lat: -44.3967, lng: 171.2536 },
  { location: 'Gisborne', region: 'Gisborne', lat: -38.6623, lng: 178.0176 },
  { location: 'Taupo', region: 'Waikato', lat: -38.6857, lng: 176.0702 },
  { location: 'Picton', region: 'Marlborough', lat: -41.2906, lng: 174.0059 },
  { location: 'Hokitika', region: 'West Coast', lat: -42.7167, lng: 170.9667 },
  { location: 'Kerikeri', region: 'Northland', lat: -35.2268, lng: 173.9474 },
  { location: 'Greymouth', region: 'West Coast', lat: -42.4504, lng: 171.2108 },
  { location: 'Te Anau', region: 'Southland', lat: -45.4144, lng: 167.7181 },
]

const MOCK_SELLERS = [
  { id: 'kiwi-road-ready', name: 'Kiwi Road Ready', rating: 4.9, sales: 41, joined: '2020' },
  { id: 'northland-vans', name: 'Northland Vans', rating: 4.7, sales: 16, joined: '2022' },
  { id: 'greenstone-campers', name: 'Greenstone Campers', rating: 4.8, sales: 28, joined: '2021' },
  { id: 'otago-motorhomes', name: 'Otago Motorhomes', rating: 4.9, sales: 37, joined: '2019' },
  { id: 'bay-weekenders', name: 'Bay Weekenders', rating: 4.6, sales: 12, joined: '2023' },
  { id: 'waikato-vanworks', name: 'Waikato Vanworks', rating: 4.8, sales: 22, joined: '2021' },
  { id: 'coastal-rv-nz', name: 'Coastal RV NZ', rating: 4.7, sales: 35, joined: '2020' },
  { id: 'mainland-conversions', name: 'Mainland Conversions', rating: 4.9, sales: 51, joined: '2018' },
  { id: 'taranaki-travel-vans', name: 'Taranaki Travel Vans', rating: 4.5, sales: 9, joined: '2024' },
  { id: 'lake-district-campers', name: 'Lake District Campers', rating: 4.8, sales: 19, joined: '2022' },
  { id: 'marlborough-motors', name: 'Marlborough Motors', rating: 4.6, sales: 14, joined: '2023' },
  { id: 'southland-roamers', name: 'Southland Roamers', rating: 4.7, sales: 17, joined: '2022' },
]

const MOCK_TEMPLATES = [
  { make: 'Toyota', model: 'Toyota Hiace', vehicleType: 'campervan', title: 'Toyota Hiace Certified Camper', basePrice: 36500, mileage: 152000, sleeps: 2, belts: 3, selfContained: true },
  { make: 'Nissan', model: 'Nissan NV350', vehicleType: 'campervan', title: 'Nissan NV350 Weekend Camper', basePrice: 32900, mileage: 141000, sleeps: 2, belts: 3, selfContained: true },
  { make: 'Ford', model: 'Ford Transit', vehicleType: 'van', title: 'Ford Transit Long Wheelbase Conversion', basePrice: 52500, mileage: 118000, sleeps: 2, belts: 3, selfContained: true },
  { make: 'Mercedes-Benz', model: 'Mercedes Sprinter', vehicleType: 'van', title: 'Mercedes Sprinter Off-Grid Van', basePrice: 76500, mileage: 98000, sleeps: 2, belts: 2, selfContained: true },
  { make: 'Fiat', model: 'Fiat Ducato', vehicleType: 'motorhome', title: 'Fiat Ducato Family Motorhome', basePrice: 87500, mileage: 84000, sleeps: 4, belts: 4, selfContained: true },
  { make: 'Mitsubishi', model: 'Mitsubishi Delica', vehicleType: '4x4', title: 'Mitsubishi Delica 4x4 Camper', basePrice: 26800, mileage: 196000, sleeps: 2, belts: 5, selfContained: false },
  { make: 'Mazda', model: 'Mazda Bongo', vehicleType: 'campervan', title: 'Mazda Bongo Pop-Top Camper', basePrice: 23900, mileage: 178000, sleeps: 2, belts: 4, selfContained: false },
  { make: 'Volkswagen', model: 'Volkswagen Transporter', vehicleType: 'campervan', title: 'Volkswagen Transporter Surf Camper', basePrice: 48900, mileage: 126000, sleeps: 2, belts: 3, selfContained: true },
  { make: 'LDV', model: 'LDV Deliver 9', vehicleType: 'van', title: 'LDV Deliver 9 Fresh Conversion', basePrice: 58900, mileage: 62000, sleeps: 2, belts: 3, selfContained: true },
  { make: 'Renault', model: 'Renault Master', vehicleType: 'van', title: 'Renault Master High-Roof Camper', basePrice: 64500, mileage: 105000, sleeps: 2, belts: 3, selfContained: true },
  { make: 'Hyundai', model: 'Hyundai iLoad', vehicleType: 'campervan', title: 'Hyundai iLoad Compact Camper', basePrice: 31800, mileage: 133000, sleeps: 2, belts: 5, selfContained: false },
  { make: 'Peugeot', model: 'Peugeot Boxer', vehicleType: 'motorhome', title: 'Peugeot Boxer Two-Berth Motorhome', basePrice: 71500, mileage: 91000, sleeps: 2, belts: 2, selfContained: true },
  { make: 'Iveco', model: 'Iveco Daily', vehicleType: 'motorhome', title: 'Iveco Daily Spacious Motorhome', basePrice: 98500, mileage: 112000, sleeps: 4, belts: 4, selfContained: true },
  { make: 'Honda', model: 'Honda Stepwgn', vehicleType: 'campervan', title: 'Honda Stepwgn Mini Camper', basePrice: 20900, mileage: 162000, sleeps: 2, belts: 5, selfContained: false },
  { make: 'Toyota', model: 'Toyota Estima', vehicleType: 'car', title: 'Toyota Estima Road Trip Sleeper', basePrice: 16900, mileage: 151000, sleeps: 2, belts: 7, selfContained: false },
  { make: 'Subaru', model: 'Subaru Outback', vehicleType: 'car', title: 'Subaru Outback Touring Setup', basePrice: 21900, mileage: 124000, sleeps: 2, belts: 5, selfContained: false },
]

const MOCK_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1533591380348-14193f1de18f?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1527786356703-4b100091cd2c?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1516939884455-1445c8652f83?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1594495894542-a46cc73e081a?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80',
]

const MOCK_CONDITIONS = ['Excellent', 'Very good', 'Good', 'Needs work', 'Project vehicle']
const MOCK_WOF_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function createGeneratedVehicles() {
  return Array.from({ length: 72 }, (_, index) => {
    const template = MOCK_TEMPLATES[index % MOCK_TEMPLATES.length]
    const place = MOCK_LOCATIONS[index % MOCK_LOCATIONS.length]
    const seller = MOCK_SELLERS[index % MOCK_SELLERS.length]
    const image = MOCK_IMAGE_POOL[index % MOCK_IMAGE_POOL.length]
    const secondaryImage = MOCK_IMAGE_POOL[(index + 3) % MOCK_IMAGE_POOL.length]
    // El indice elige la plantilla cada 16 posiciones, asi que el anio se
    // desplaza tambien con el numero de vuelta para que cada modelo aparezca en
    // varios anios distintos y no siempre en el mismo.
    const year = 2009 + ((index * 5 + Math.floor(index / 16) * 3) % 16)
    const priceAdjustment = ((index % 9) - 4) * 1700
    const mileageAdjustment = ((index % 11) - 5) * 8500
    const price = Math.max(9900, template.basePrice + priceAdjustment)
    const mileage = Math.max(42000, template.mileage + mileageAdjustment)
    const suburbOffset = ((index % 7) - 3) * 0.018
    const roadTripTone = template.selfContained
      ? 'certified self-contained setup, practical storage and a layout ready for NZ freedom camping rules'
      : 'simple touring setup, flexible seating and enough storage for weekends away'

    return {
      id: index + 7,
      transmission: index % 3 === 0 ? 'Manual' : 'Automatic',
      year,
      title: `${year} ${template.title}`,
      make: template.make,
      model: template.model,
      vehicleType: template.vehicleType,
      price,
      mileage,
      condition: MOCK_CONDITIONS[index % MOCK_CONDITIONS.length],
      wof: `Valid until ${MOCK_WOF_MONTHS[index % MOCK_WOF_MONTHS.length]} 2027`,
      sleeps: template.sleeps,
      belts: template.belts,
      selfContained: template.selfContained,
      location: place.location,
      region: place.region,
      lat: Number((place.lat + suburbOffset).toFixed(5)),
      lng: Number((place.lng - suburbOffset).toFixed(5)),
      category: template.vehicleType,
      image,
      images: [image, secondaryImage, MOCK_IMAGE_POOL[(index + 5) % MOCK_IMAGE_POOL.length]],
      description: `${year} ${template.model} listed in ${place.location}. Includes ${roadTripTone}. Good option for buyers comparing WOF, mileage, sleeping capacity and location before viewing.`,
      views: 72 + ((index * 23) % 520),
      status: index % 13 === 0 ? 'sold' : 'available',
      seller: { ...seller },
    }
  })
}

const DAY_MS = 24 * 60 * 60 * 1000

// Reparte fechas de publicacion simuladas: algunos anuncios caen dentro de la
// ultima semana para que se vea el badge "New" y el resto quedan mas antiguos.
function withMockCreatedAt(vehicles) {
  const now = Date.now()

  return vehicles.map((vehicle, index) => {
    if (vehicle.created_at) return vehicle
    const daysAgo = index % 5 === 0 ? index % 6 : 9 + (index % 60)
    return { ...vehicle, created_at: new Date(now - daysAgo * DAY_MS).toISOString() }
  })
}

const MOCK_LAYOUTS = ['Rear bed', 'Rear garage', 'End lounge', 'Pop-top', 'Bunks', 'Open plan', 'Fixed double']
const MOCK_FUELS = ['Diesel', 'Petrol', 'Hybrid', 'Electric', 'LPG']

function isoDateInMonths(months) {
  const date = new Date()
  date.setMonth(date.getMonth() + months)
  return date.toISOString().slice(0, 10)
}

// Rellena de forma determinista los campos que alimentan los filtros nuevos.
// Solo toca los anuncios que no los traen, asi que un anuncio real de Supabase
// con sus propios datos se respeta tal cual.
function withMockSpecs(vehicles) {
  return vehicles.map((vehicle, index) => {
    const camper = ['campervan', 'motorhome', 'van'].includes(vehicle.vehicleType)
    const fourWheel = vehicle.vehicleType === '4x4' || index % 6 === 0
    const certified = Boolean(vehicle.selfContained)

    return {
      // En NZ el diesel domina en camper, pero hay bastante Hiace y Bongo de
      // gasolina: se reparte para que el filtro tenga resultados en ambos.
      fuel: camper || fourWheel
        ? (index % 4 === 1 ? 'Petrol' : 'Diesel')
        : MOCK_FUELS[index % MOCK_FUELS.length],
      drivetrain: fourWheel ? (index % 2 === 0 ? '4WD' : 'AWD') : '2WD',
      engineCc: 1800 + ((index * 137) % 1400),
      seats: vehicle.belts || 4,
      doors: camper ? 3 + (index % 2) : 4 + (index % 2),
      // Uno de cada siete anuncios lleva el WOF caducado a proposito.
      wofExpiry: isoDateInMonths(index % 7 === 0 ? -1 : 1 + (index % 11)),
      regoExpiry: isoDateInMonths(index % 9 === 0 ? -2 : 1 + (index % 12)),
      layout: camper ? MOCK_LAYOUTS[index % MOCK_LAYOUTS.length] : '',
      lengthM: camper ? Number((4.8 + ((index % 12) * 0.22)).toFixed(1)) : Number((4.4 + ((index % 5) * 0.15)).toFixed(1)),
      weightKg: camper ? 2400 + ((index % 10) * 220) : 1500 + ((index % 8) * 120),
      freshWaterL: certified ? 40 + ((index % 9) * 10) : (index % 3) * 12,
      greyWaterL: certified ? 40 + ((index % 8) * 10) : (index % 3) * 10,
      batteryAh: certified ? 80 + ((index % 7) * 20) : (index % 4) * 25,
      solarW: certified ? 100 + ((index % 6) * 60) : (index % 5) * 40,
      toiletType: certified ? 'fixed' : (index % 3 === 0 ? 'portable' : 'none'),
      // La verde exige inodoro fijo; la amarilla solo vale en sitios NZMCA.
      scCertification: certified ? (index % 4 === 0 ? 'yellow' : 'green') : '',
      scExpiry: certified ? isoDateInMonths(index % 11 === 0 ? -3 : 6 + (index % 30)) : null,
      ...vehicle,
    }
  })
}

export const MOCK_VEHICLES = withMockSpecs(withMockCreatedAt([...FEATURED_MOCK_VEHICLES, ...createGeneratedVehicles()]))
