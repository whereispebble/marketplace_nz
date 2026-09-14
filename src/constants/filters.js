/**
 * Catalogos de los filtros de busqueda.
 *
 * Un unico sitio donde estan las opciones que se ofrecen y el estado inicial de
 * cada filtro, para que el panel, los distintivos de filtro activo y las
 * busquedas guardadas no puedan desincronizarse entre si.
 */


/** Numero de anuncios por pagina en la parrilla de resultados. */
export const PAGE_SIZE = 50

export const DEFAULT_FILTERS = {
  search: '',
  vehicleType: 'all',
  make: '',
  model: '',
  minYear: '',
  maxYear: '',
  transmission: 'all',
  fuel: 'all',
  drivetrain: 'all',
  minEngineCc: '',
  maxEngineCc: '',
  minSeats: '',
  minDoors: '',
  condition: 'all',
  wofValidity: 'all',
  regoValidity: 'all',
  layout: 'all',
  minLengthM: '',
  maxLengthM: '',
  maxWeightKg: '',
  carLicenceOnly: false,
  minFreshWaterL: '',
  minGreyWaterL: '',
  minBatteryAh: '',
  minSolarW: '',
  toiletType: 'all',
  minPrice: '',
  maxPrice: '',
  maxMileage: '',
  minSleeps: '',
  minBelts: '',
  selfContainedOnly: false,
  location: '',
  locationPoint: null,
  sortBy: 'recent',
  amenities: {
    shower: false,
    toilet: false,
    fridge: false,
    heater: false,
    solar: false,
    kitchen: false,
    awning: false,
    water: false,
  },
}

// Sugerencias rapidas del hero: mismas en movil y escritorio.
export const QUICK_SEARCHES = [
  { label: 'Campervan', filters: { vehicleType: 'campervan' } },
  { label: 'Toyota Hiace', filters: { search: 'Toyota Hiace' } },
  { label: 'Auckland', filters: { location: 'Auckland' } },
]

// "Best match" ordena por cercania cuando hay una ubicacion elegida y por
// fecha cuando no la hay, asi que no hace falta una opcion "mas cerca" aparte.
export const SORT_OPTIONS = [
  { id: 'recent', label: 'Best match' },
  { id: 'newest', label: 'Newest listings' },
  { id: 'price_asc', label: 'Price: low to high' },
  { id: 'price_desc', label: 'Price: high to low' },
  { id: 'mileage_asc', label: 'Lowest mileage' },
  { id: 'mileage_desc', label: 'Highest mileage' },
  { id: 'year_desc', label: 'Year: newest first' },
  { id: 'year_asc', label: 'Year: oldest first' },
  { id: 'sleeps_desc', label: 'Most berths' },
  { id: 'wof_desc', label: 'Longest WOF left' },
]

export const FUEL_FILTERS = ['Diesel', 'Petrol', 'Hybrid', 'Electric', 'LPG']

export const DRIVETRAIN_FILTERS = [
  { id: 'all', label: 'Any drivetrain' },
  { id: '4wd', label: '4WD / AWD only' },
  { id: '2wd', label: '2WD only' },
]

export const CONDITION_FILTERS = ['Excellent', 'Very good', 'Good', 'Needs work', 'Project vehicle']

// Meses minimos que debe quedarle al papel para entrar en cada opcion.
export const VALIDITY_FILTERS = [
  { id: 'all', label: 'Any' },
  { id: 'valid', label: 'Valid today' },
  { id: '3', label: '3+ months left' },
  { id: '6', label: '6+ months left' },
]

export const LAYOUT_FILTERS = [
  'Rear bed',
  'Rear garage',
  'End lounge',
  'Pop-top',
  'Bunks',
  'Open plan',
  'Fixed double',
]

export const TOILET_FILTERS = [
  { id: 'all', label: 'Any' },
  { id: 'fixed', label: 'Fixed toilet' },
  { id: 'portable', label: 'Portable toilet' },
  { id: 'none', label: 'No toilet' },
]

export const VEHICLE_TYPE_FILTERS = [
  { id: 'all', label: 'All vehicle types' },
  { id: 'campervan', label: 'Campervan' },
  { id: 'motorhome', label: 'Motorhome' },
  { id: 'van', label: 'Van' },
  { id: '4x4', label: '4x4' },
  { id: 'car', label: 'Car' },
  { id: 'car-camper', label: 'Camperised car' },
]

export const AMENITY_FILTERS = [
  { id: 'shower', label: 'Shower', terms: ['shower'] },
  { id: 'toilet', label: 'Toilet', terms: ['toilet', 'wc'] },
  { id: 'fridge', label: 'Fridge', terms: ['fridge', 'refrigerator'] },
  { id: 'heater', label: 'Heater', terms: ['heater', 'diesel heater', 'heating'] },
  { id: 'solar', label: 'Solar', terms: ['solar'] },
  { id: 'kitchen', label: 'Kitchen', terms: ['kitchen', 'sink', 'cooker', 'stove'] },
  { id: 'awning', label: 'Awning', terms: ['awning'] },
  { id: 'water', label: 'Water tank', terms: ['water', 'tank'] },
]
