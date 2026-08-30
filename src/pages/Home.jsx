import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBookmark, FiChevronDown, FiGrid, FiMap, FiSearch, FiSettings, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import heroSeaImage from '../assets/new-zealand-sea.webp.jpg'
import LocationField from '../components/LocationField'
import { MOCK_VEHICLES, NZ_VEHICLE_CATALOG } from '../data/mockVehicles'

let leafletPromise
const PAGE_SIZE = 50
const SAVED_SEARCHES_KEY = 'swapy:saved-searches'
const HOME_STATE_KEY = 'swapy:home-state'
const DEFAULT_FILTERS = {
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
const QUICK_SEARCHES = [
  { label: 'Campervan', filters: { vehicleType: 'campervan' } },
  { label: 'Toyota Hiace', filters: { search: 'Toyota Hiace' } },
  { label: 'Auckland', filters: { location: 'Auckland' } },
]

// "Best match" ordena por cercania cuando hay una ubicacion elegida y por
// fecha cuando no la hay, asi que no hace falta una opcion "mas cerca" aparte.
const SORT_OPTIONS = [
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

const FUEL_FILTERS = ['Diesel', 'Petrol', 'Hybrid', 'Electric', 'LPG']

const DRIVETRAIN_FILTERS = [
  { id: 'all', label: 'Any drivetrain' },
  { id: '4wd', label: '4WD / AWD only' },
  { id: '2wd', label: '2WD only' },
]

const CONDITION_FILTERS = ['Excellent', 'Very good', 'Good', 'Needs work', 'Project vehicle']

// Meses minimos que debe quedarle al papel para entrar en cada opcion.
const VALIDITY_FILTERS = [
  { id: 'all', label: 'Any' },
  { id: 'valid', label: 'Valid today' },
  { id: '3', label: '3+ months left' },
  { id: '6', label: '6+ months left' },
]

const LAYOUT_FILTERS = [
  'Rear bed',
  'Rear garage',
  'End lounge',
  'Pop-top',
  'Bunks',
  'Open plan',
  'Fixed double',
]

const TOILET_FILTERS = [
  { id: 'all', label: 'Any' },
  { id: 'fixed', label: 'Fixed toilet' },
  { id: 'portable', label: 'Portable toilet' },
  { id: 'none', label: 'No toilet' },
]

const VEHICLE_TYPE_FILTERS = [
  { id: 'all', label: 'All vehicle types' },
  { id: 'campervan', label: 'Campervan' },
  { id: 'motorhome', label: 'Motorhome' },
  { id: 'van', label: 'Van' },
  { id: '4x4', label: '4x4' },
  { id: 'car', label: 'Car' },
  { id: 'car-camper', label: 'Camperised car' },
]

const AMENITY_FILTERS = [
  { id: 'shower', label: 'Shower', terms: ['shower'] },
  { id: 'toilet', label: 'Toilet', terms: ['toilet', 'wc'] },
  { id: 'fridge', label: 'Fridge', terms: ['fridge', 'refrigerator'] },
  { id: 'heater', label: 'Heater', terms: ['heater', 'diesel heater', 'heating'] },
  { id: 'solar', label: 'Solar', terms: ['solar'] },
  { id: 'kitchen', label: 'Kitchen', terms: ['kitchen', 'sink', 'cooker', 'stove'] },
  { id: 'awning', label: 'Awning', terms: ['awning'] },
  { id: 'water', label: 'Water tank', terms: ['water', 'tank'] },
]

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const existingScript = document.getElementById('leaflet-js')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.body.appendChild(script)
  })

  return leafletPromise
}

const SEARCH_SYNONYMS = {
  camper: ['campervan', 'motorhome', 'rv', 'vanlife', 'selfcontained', 'self-contained'],
  van: ['campervan', 'hiace', 'transit', 'sprinter', 'caravan'],
  motorhome: ['rv', 'camper', 'ducato'],
  auckland: ['akl'],
  christchurch: ['chch', 'canterbury'],
  queenstown: ['otago', 'wanaka'],
  wof: ['warrant', 'roadworthy'],
}

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (!a || !b) return Math.max(a.length, b.length)
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index])
  for (let column = 1; column <= b.length; column += 1) rows[0][column] = column
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      )
    }
  }
  return rows[a.length][b.length]
}

function fuzzyIncludes(haystack, query) {
  const cleanQuery = normalise(query)
  if (!cleanQuery) return true

  const haystackText = normalise(haystack)
  if (haystackText.includes(cleanQuery)) return true

  const queryWords = cleanQuery.split(' ')
  const haystackWords = haystackText.split(' ')
  const expandedWords = queryWords.flatMap(word => [word, ...(SEARCH_SYNONYMS[word] || [])])

  return expandedWords.every(queryWord => (
    haystackWords.some(word => {
      if (word.includes(queryWord) || queryWord.includes(word)) return true
      const tolerance = queryWord.length > 6 ? 2 : 1
      return levenshtein(word, queryWord) <= tolerance
    })
  ))
}

// eslint-disable-next-line no-unused-vars
function parsePriceCeiling(value) {
  const cleanValue = normalise(value)
  if (!cleanValue || cleanValue === 'all' || cleanValue === 'any') return null

  const hasK = cleanValue.includes('k')
  const numericValue = Number(cleanValue.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null

  return hasK ? numericValue * 1000 : numericValue
}

function formatCompactCurrency(value) {
  const amount = Number(value || 0)
  if (amount >= 1000 && amount % 1000 === 0) return `${amount / 1000}k`
  return amount.toLocaleString('en-NZ')
}

function parsePositiveNumber(value) {
  const cleanValue = normalise(value)
  if (!cleanValue || cleanValue === 'all' || cleanValue === 'any') return null

  const hasK = cleanValue.includes('k')
  const numericValue = Number(cleanValue.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericValue) || numericValue < 0) return null

  return hasK ? numericValue * 1000 : numericValue
}

function distanceKm(first, second) {
  if (!first || !second) return null
  const lat1 = Number(first.lat)
  const lon1 = Number(first.lng)
  const lat2 = Number(second.lat)
  const lon2 = Number(second.lng)
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null

  const toRadians = degrees => degrees * Math.PI / 180
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// Meses que faltan para una fecha; negativo si ya paso.
function monthsUntil(value) {
  if (!value) return null
  const target = new Date(value)
  if (Number.isNaN(target.getTime())) return null
  return (target.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44)
}

function matchesValidity(value, rule) {
  if (rule === 'all') return true
  const months = monthsUntil(value)
  if (months === null) return false
  if (rule === 'valid') return months > 0
  return months >= Number(rule)
}

function matchesDrivetrain(vehicle, rule) {
  if (rule === 'all') return true
  const raw = normalise(vehicle.drivetrain)
  const isFourWheel = ['4wd', 'awd', '4x4', 'four wheel drive', 'all wheel drive'].includes(raw)
    || normalise(vehicle.vehicleType) === '4x4'
  return rule === '4wd' ? isFourWheel : Boolean(raw) && !isFourWheel
}

function matchesToilet(vehicle, rule) {
  if (rule === 'all') return true
  const raw = normalise(vehicle.toiletType)
  if (rule === 'none') return !raw || raw === 'none'
  if (rule === 'fixed') return raw.includes('fixed') || raw.includes('cassette')
  return raw.includes('portable')
}

function numberOrNull(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function compareAscending(first, second) {
  if (first === null && second === null) return 0
  if (first === null) return 1
  if (second === null) return -1
  return first - second
}

function compareDescending(first, second) {
  if (first === null && second === null) return 0
  if (first === null) return 1
  if (second === null) return -1
  return second - first
}

const SORTERS = {
  newest: (a, b) => compareDescending(numberOrNull(new Date(a.created_at || 0).getTime()), numberOrNull(new Date(b.created_at || 0).getTime())),
  price_asc: (a, b) => compareAscending(numberOrNull(a.price), numberOrNull(b.price)),
  price_desc: (a, b) => compareDescending(numberOrNull(a.price), numberOrNull(b.price)),
  mileage_asc: (a, b) => compareAscending(numberOrNull(a.mileage), numberOrNull(b.mileage)),
  mileage_desc: (a, b) => compareDescending(numberOrNull(a.mileage), numberOrNull(b.mileage)),
  year_desc: (a, b) => compareDescending(vehicleYear(a), vehicleYear(b)),
  year_asc: (a, b) => compareAscending(vehicleYear(a), vehicleYear(b)),
  sleeps_desc: (a, b) => compareDescending(numberOrNull(a.sleeps), numberOrNull(b.sleeps)),
  wof_desc: (a, b) => compareDescending(monthsUntil(a.wofExpiry), monthsUntil(b.wofExpiry)),
}

function vehicleHasAmenity(vehicle, amenity) {
  const text = normalise([
    vehicle.title,
    vehicle.description,
    vehicle.features,
    vehicle.amenities,
  ].flat().join(' '))

  return amenity.terms.some(term => text.includes(normalise(term)))
}

function vehicleSearchText(vehicle) {
  return [
    vehicle.title,
    vehicle.make,
    vehicle.model,
    vehicle.vehicleType,
    vehicle.location,
    vehicle.region,
    vehicle.condition,
    vehicle.wof,
    vehicle.selfContained ? 'self contained certified freedom camping' : 'not self contained',
    `${vehicle.sleeps} berth sleeps`,
    `${vehicle.belts} seat belts`,
  ].join(' ')
}

function vehicleMake(vehicle) {
  return vehicle.make || vehicle.model?.split(' ')[0] || ''
}

// Muchos anuncios guardan el modelo con la marca delante ("Toyota Hiace"); en el
// desplegable interesa solo "Hiace" para no duplicar entradas del catalogo.
function stripMakePrefix(model, make) {
  const cleanModel = String(model || '').trim()
  const cleanMake = String(make || '').trim()
  if (!cleanModel || !cleanMake) return cleanModel
  if (!normalise(cleanModel).startsWith(`${normalise(cleanMake)} `)) return cleanModel
  return cleanModel.slice(cleanMake.length).trim() || cleanModel
}

// Los anuncios reales pueden no traer `year`; en ese caso se intenta leer del
// titulo, donde suele ir por delante ("2014 Toyota Hiace...").
function vehicleYear(vehicle) {
  const direct = Number(vehicle.year)
  if (Number.isFinite(direct) && direct > 1900) return direct
  const fromTitle = String(vehicle.title || '').match(/\b(19|20)\d{2}\b/)
  return fromTitle ? Number(fromTitle[0]) : null
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]))
}

function mergeVehiclesWithMocks(products = []) {
  const realProducts = products.filter(Boolean)
  const realIds = new Set(realProducts.map(product => String(product.id)))
  return [...realProducts, ...MOCK_VEHICLES.filter(vehicle => !realIds.has(String(vehicle.id)))]
}

// Clave estable para comparar dos conjuntos de filtros sin depender del orden
// en el que se escribieron las propiedades.
function filtersKey(filters) {
  const normalised = {
    ...DEFAULT_FILTERS,
    ...(filters || {}),
    amenities: { ...DEFAULT_FILTERS.amenities, ...(filters?.amenities || {}) },
  }
  return JSON.stringify(Object.keys(normalised).sort().map(key => [key, normalised[key]]))
}

function readSavedSearches() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function readHomeState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HOME_STATE_KEY) || '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

function filterVehicles(vehicles, filters) {
  const minPrice = parsePositiveNumber(filters.minPrice)
  const maxPrice = parsePositiveNumber(filters.maxPrice)
  const maxMileage = parsePositiveNumber(filters.maxMileage)
  const minSleeps = parsePositiveNumber(filters.minSleeps)
  const minBelts = parsePositiveNumber(filters.minBelts)
  const minYear = parsePositiveNumber(filters.minYear)
  const maxYear = parsePositiveNumber(filters.maxYear)
  const minEngineCc = parsePositiveNumber(filters.minEngineCc)
  const maxEngineCc = parsePositiveNumber(filters.maxEngineCc)
  const minSeats = parsePositiveNumber(filters.minSeats)
  const minDoors = parsePositiveNumber(filters.minDoors)
  const minLengthM = parsePositiveNumber(filters.minLengthM)
  const maxLengthM = parsePositiveNumber(filters.maxLengthM)
  const maxWeightKg = parsePositiveNumber(filters.maxWeightKg)
  const minFreshWaterL = parsePositiveNumber(filters.minFreshWaterL)
  const minGreyWaterL = parsePositiveNumber(filters.minGreyWaterL)
  const minBatteryAh = parsePositiveNumber(filters.minBatteryAh)
  const minSolarW = parsePositiveNumber(filters.minSolarW)
  // Prioridad a las coordenadas reales de la ubicacion elegida en el
  // autocompletado; si no hay, se cae al anuncio que coincida por nombre.
  const point = filters.locationPoint
  const hasPoint = Number.isFinite(Number(point?.lat)) && Number.isFinite(Number(point?.lng))
  const origin = hasPoint
    ? { lat: Number(point.lat), lng: Number(point.lng) }
    : filters.location
      ? vehicles.find(vehicle => normalise(vehicle.location) === normalise(filters.location))
      : null
  const selectedAmenities = AMENITY_FILTERS.filter(amenity => filters.amenities?.[amenity.id])

  return vehicles
    .filter(vehicle => filters.vehicleType === 'all' || vehicle.vehicleType === filters.vehicleType || vehicle.category === filters.vehicleType)
    .filter(vehicle => fuzzyIncludes(vehicleMake(vehicle), filters.make))
    .filter(vehicle => fuzzyIncludes(`${vehicle.model} ${vehicle.title}`, filters.model))
    .filter(vehicle => {
      if (minYear === null && maxYear === null) return true
      const year = vehicleYear(vehicle)
      if (year === null) return false
      return (minYear === null || year >= minYear) && (maxYear === null || year <= maxYear)
    })
    .filter(vehicle => minPrice === null || Number(vehicle.price || 0) >= minPrice)
    .filter(vehicle => maxPrice === null || Number(vehicle.price || 0) <= maxPrice)
    .filter(vehicle => maxMileage === null || Number(vehicle.mileage || 0) <= maxMileage)
    .filter(vehicle => minSleeps === null || Number(vehicle.sleeps || 0) >= minSleeps)
    .filter(vehicle => minBelts === null || Number(vehicle.belts || 0) >= minBelts)
    .filter(vehicle => !filters.selfContainedOnly || Boolean(vehicle.selfContained))
    .filter(vehicle => filters.transmission === 'all' || normalise(vehicle.transmission) === normalise(filters.transmission))
    .filter(vehicle => filters.fuel === 'all' || normalise(vehicle.fuel) === normalise(filters.fuel))
    .filter(vehicle => matchesDrivetrain(vehicle, filters.drivetrain))
    .filter(vehicle => minEngineCc === null || Number(vehicle.engineCc || 0) >= minEngineCc)
    .filter(vehicle => maxEngineCc === null || (Number(vehicle.engineCc || 0) > 0 && Number(vehicle.engineCc) <= maxEngineCc))
    .filter(vehicle => minSeats === null || Number(vehicle.seats || vehicle.belts || 0) >= minSeats)
    .filter(vehicle => minDoors === null || Number(vehicle.doors || 0) >= minDoors)
    .filter(vehicle => filters.condition === 'all' || normalise(vehicle.condition) === normalise(filters.condition))
    .filter(vehicle => matchesValidity(vehicle.wofExpiry, filters.wofValidity))
    .filter(vehicle => matchesValidity(vehicle.regoExpiry, filters.regoValidity))
    .filter(vehicle => filters.layout === 'all' || normalise(vehicle.layout) === normalise(filters.layout))
    .filter(vehicle => minLengthM === null || Number(vehicle.lengthM || 0) >= minLengthM)
    .filter(vehicle => maxLengthM === null || (Number(vehicle.lengthM || 0) > 0 && Number(vehicle.lengthM) <= maxLengthM))
    .filter(vehicle => maxWeightKg === null || (Number(vehicle.weightKg || 0) > 0 && Number(vehicle.weightKg) <= maxWeightKg))
    // Un coche normal (clase 1) no puede pasar de 3.500 kg de peso bruto.
    .filter(vehicle => !filters.carLicenceOnly || Number(vehicle.weightKg || 0) <= 3500)
    .filter(vehicle => minFreshWaterL === null || Number(vehicle.freshWaterL || 0) >= minFreshWaterL)
    .filter(vehicle => minGreyWaterL === null || Number(vehicle.greyWaterL || 0) >= minGreyWaterL)
    .filter(vehicle => minBatteryAh === null || Number(vehicle.batteryAh || 0) >= minBatteryAh)
    .filter(vehicle => minSolarW === null || Number(vehicle.solarW || 0) >= minSolarW)
    .filter(vehicle => matchesToilet(vehicle, filters.toiletType))
    .filter(vehicle => {
      if (!filters.location) return true
      // Una ubicacion elegida en el desplegable tiene coordenadas: no descarta
      // anuncios, ordena por cercania. El texto escrito a mano si filtra.
      if (hasPoint) return true
      return fuzzyIncludes(`${vehicle.location} ${vehicle.region}`, filters.location)
    })
    .filter(vehicle => selectedAmenities.every(amenity => vehicleHasAmenity(vehicle, amenity)))
    .filter(vehicle => fuzzyIncludes(vehicleSearchText(vehicle), filters.search))
    .sort((a, b) => {
      const sorter = SORTERS[filters.sortBy]
      if (sorter) return sorter(a, b)
      // Best match: de mas cerca a mas lejos si hay una ubicacion de
      // referencia, y si no se deja el orden de llegada. 'distance' se sigue
      // aceptando por las busquedas guardadas antiguas.
      const from = origin || filters.sortPoint
      if (!from) return 0
      return compareAscending(distanceKm(from, a), distanceKm(from, b))
    })
}

// El nombre se construye a partir de los mismos chips que se muestran en la
// barra de filtros activos, para que refleje todos los criterios y no solo unos
// pocos.
function describeSearch(filters) {
  const parts = activeFilterChips(filters).map(chip => chip.label)
  return parts.join(' · ') || 'All vehicles'
}

function activeFilterChips(filters) {
  const chips = []
  if (filters.search) chips.push({ id: 'search', label: filters.search })
  if (filters.vehicleType !== 'all') chips.push({ id: 'vehicleType', label: filters.vehicleType })
  if (filters.make) chips.push({ id: 'make', label: filters.make })
  if (filters.model) chips.push({ id: 'model', label: filters.model })
  if (filters.minYear && filters.maxYear) chips.push({ id: 'year', label: `${filters.minYear} - ${filters.maxYear}` })
  else if (filters.minYear) chips.push({ id: 'year', label: `${filters.minYear} or newer` })
  else if (filters.maxYear) chips.push({ id: 'year', label: `${filters.maxYear} or older` })
  if (filters.minPrice) chips.push({ id: 'minPrice', label: `From NZ$${Number(parsePositiveNumber(filters.minPrice) || 0).toLocaleString('en-NZ')}` })
  if (filters.maxPrice) chips.push({ id: 'maxPrice', label: `Under NZ$${formatCompactCurrency(parsePositiveNumber(filters.maxPrice))}` })
  if (filters.maxMileage) chips.push({ id: 'maxMileage', label: `Under ${Number(parsePositiveNumber(filters.maxMileage) || 0).toLocaleString('en-NZ')} km` })
  if (filters.minSleeps) chips.push({ id: 'minSleeps', label: `Sleeps ${filters.minSleeps}+` })
  if (filters.minBelts) chips.push({ id: 'minBelts', label: `${filters.minBelts}+ belts` })
  if (filters.selfContainedOnly) chips.push({ id: 'selfContainedOnly', label: 'Self-contained' })
  if (filters.transmission && filters.transmission !== 'all') chips.push({ id: 'transmission', label: filters.transmission })
  if (filters.fuel !== 'all') chips.push({ id: 'fuel', label: filters.fuel })
  if (filters.drivetrain !== 'all') chips.push({ id: 'drivetrain', label: DRIVETRAIN_FILTERS.find(item => item.id === filters.drivetrain)?.label || filters.drivetrain })
  if (filters.minEngineCc || filters.maxEngineCc) chips.push({ id: 'engineCc', label: `${filters.minEngineCc || '0'} - ${filters.maxEngineCc || 'any'} cc` })
  if (filters.minSeats) chips.push({ id: 'minSeats', label: `${filters.minSeats}+ seats` })
  if (filters.minDoors) chips.push({ id: 'minDoors', label: `${filters.minDoors}+ doors` })
  if (filters.condition !== 'all') chips.push({ id: 'condition', label: filters.condition })
  if (filters.wofValidity !== 'all') chips.push({ id: 'wofValidity', label: `WOF ${VALIDITY_FILTERS.find(item => item.id === filters.wofValidity)?.label.toLowerCase()}` })
  if (filters.regoValidity !== 'all') chips.push({ id: 'regoValidity', label: `Rego ${VALIDITY_FILTERS.find(item => item.id === filters.regoValidity)?.label.toLowerCase()}` })
  if (filters.layout !== 'all') chips.push({ id: 'layout', label: filters.layout })
  if (filters.minLengthM || filters.maxLengthM) chips.push({ id: 'lengthM', label: `${filters.minLengthM || '0'} - ${filters.maxLengthM || 'any'} m` })
  if (filters.maxWeightKg) chips.push({ id: 'maxWeightKg', label: `Under ${Number(filters.maxWeightKg).toLocaleString('en-NZ')} kg` })
  if (filters.carLicenceOnly) chips.push({ id: 'carLicenceOnly', label: 'Car licence' })
  if (filters.minFreshWaterL) chips.push({ id: 'minFreshWaterL', label: `${filters.minFreshWaterL}+ L fresh` })
  if (filters.minGreyWaterL) chips.push({ id: 'minGreyWaterL', label: `${filters.minGreyWaterL}+ L grey` })
  if (filters.minBatteryAh) chips.push({ id: 'minBatteryAh', label: `${filters.minBatteryAh}+ Ah` })
  if (filters.minSolarW) chips.push({ id: 'minSolarW', label: `${filters.minSolarW}+ W solar` })
  if (filters.toiletType !== 'all') chips.push({ id: 'toiletType', label: TOILET_FILTERS.find(item => item.id === filters.toiletType)?.label })
  if (filters.location) chips.push({ id: 'location', label: filters.location })
  AMENITY_FILTERS.forEach(amenity => {
    if (filters.amenities?.[amenity.id]) chips.push({ id: amenity.id, label: amenity.label })
  })
  return chips
}

export default function Home() {
  const restoredHomeState = useMemo(() => readHomeState(), [])
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES)
  const [loading, setLoading] = useState(false)
  const resultsRef = useRef(null)
  const restoredDraft = { ...DEFAULT_FILTERS, ...(restoredHomeState.draftFilters || {}) }
  const restoredApplied = { ...DEFAULT_FILTERS, ...(restoredHomeState.appliedFilters || {}) }
  const [search, setSearch] = useState(restoredDraft.search)
  const [vehicleType, setVehicleType] = useState(restoredDraft.vehicleType)
  const [make, setMake] = useState(restoredDraft.make)
  const [model, setModel] = useState(restoredDraft.model)
  const [minYear, setMinYear] = useState(restoredDraft.minYear)
  const [maxYear, setMaxYear] = useState(restoredDraft.maxYear)
  const [transmission, setTransmission] = useState(restoredDraft.transmission)
  const [fuel, setFuel] = useState(restoredDraft.fuel)
  const [drivetrain, setDrivetrain] = useState(restoredDraft.drivetrain)
  const [minEngineCc, setMinEngineCc] = useState(restoredDraft.minEngineCc)
  const [maxEngineCc, setMaxEngineCc] = useState(restoredDraft.maxEngineCc)
  const [minSeats, setMinSeats] = useState(restoredDraft.minSeats)
  const [minDoors, setMinDoors] = useState(restoredDraft.minDoors)
  const [condition, setCondition] = useState(restoredDraft.condition)
  const [wofValidity, setWofValidity] = useState(restoredDraft.wofValidity)
  const [regoValidity, setRegoValidity] = useState(restoredDraft.regoValidity)
  const [layout, setLayout] = useState(restoredDraft.layout)
  const [minLengthM, setMinLengthM] = useState(restoredDraft.minLengthM)
  const [maxLengthM, setMaxLengthM] = useState(restoredDraft.maxLengthM)
  const [maxWeightKg, setMaxWeightKg] = useState(restoredDraft.maxWeightKg)
  const [carLicenceOnly, setCarLicenceOnly] = useState(restoredDraft.carLicenceOnly)
  const [minFreshWaterL, setMinFreshWaterL] = useState(restoredDraft.minFreshWaterL)
  const [minGreyWaterL, setMinGreyWaterL] = useState(restoredDraft.minGreyWaterL)
  const [minBatteryAh, setMinBatteryAh] = useState(restoredDraft.minBatteryAh)
  const [minSolarW, setMinSolarW] = useState(restoredDraft.minSolarW)
  const [toiletType, setToiletType] = useState(restoredDraft.toiletType)
  // Posicion del dispositivo: solo se usa para ordenar por cercania, no se
  // guarda con los filtros.
  const [devicePoint, setDevicePoint] = useState(null)
  const [locatingDevice, setLocatingDevice] = useState(false)
  const [minPrice, setMinPrice] = useState(restoredDraft.minPrice)
  const [maxPrice, setMaxPrice] = useState(restoredDraft.maxPrice)
  const [maxMileage, setMaxMileage] = useState(restoredDraft.maxMileage)
  const [minSleeps, setMinSleeps] = useState(restoredDraft.minSleeps)
  const [minBelts, setMinBelts] = useState(restoredDraft.minBelts)
  const [selfContainedOnly, setSelfContainedOnly] = useState(restoredDraft.selfContainedOnly)
  const [location, setLocation] = useState(restoredDraft.location)
  const [locationPoint, setLocationPoint] = useState(restoredDraft.locationPoint || null)
  const [amenities, setAmenities] = useState({ ...DEFAULT_FILTERS.amenities, ...(restoredDraft.amenities || {}) })
  const [sortBy, setSortBy] = useState(restoredDraft.sortBy)
  const [appliedFilters, setAppliedFilters] = useState({
    ...restoredApplied,
    amenities: { ...DEFAULT_FILTERS.amenities, ...(restoredApplied.amenities || {}) },
  })
  const [hasSearched, setHasSearched] = useState(Boolean(restoredHomeState.hasSearched))
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState(restoredHomeState.viewMode || 'grid')
  const [currentPage, setCurrentPage] = useState(restoredHomeState.currentPage || 1)
  const [savedSearches, setSavedSearches] = useState(readSavedSearches)

  useEffect(() => {
    let ignore = false

    async function loadVehicles() {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (!ignore && !error && data?.length) setVehicles(mergeVehiclesWithMocks(data))
      if (!ignore) setLoading(false)
    }

    loadVehicles()
    return () => { ignore = true }
  }, [])

  // Catalogo de Trade Me como base, mas cualquier marca que aparezca en los
  // anuncios y no este en la lista.
  const makes = useMemo(() => {
    const fromCatalog = NZ_VEHICLE_CATALOG.map(entry => entry.make)
    const fromListings = vehicles.map(vehicleMake).filter(Boolean)
    return [...new Set([...fromCatalog, ...fromListings])].sort((a, b) => a.localeCompare(b))
  }, [vehicles])

  // Con una marca elegida se muestran solo sus modelos: los del catalogo mas los
  // que aparezcan en anuncios reales de esa marca. Sin marca, los de anuncios.
  const models = useMemo(() => {
    const listingModels = vehicles
      .filter(vehicle => !make || normalise(vehicleMake(vehicle)) === normalise(make))
      .map(vehicle => stripMakePrefix(vehicle.model, vehicleMake(vehicle)))
      .filter(Boolean)

    if (!make) return [...new Set(listingModels)].sort((a, b) => a.localeCompare(b))

    const catalogEntry = NZ_VEHICLE_CATALOG.find(entry => normalise(entry.make) === normalise(make))
    return [...new Set([...(catalogEntry?.models || []), ...listingModels])].sort((a, b) => a.localeCompare(b))
  }, [vehicles, make])

  const years = useMemo(() => (
    [...new Set(vehicles.map(vehicleYear).filter(Boolean))].sort((a, b) => b - a)
  ), [vehicles])

  const draftFilters = useMemo(() => ({
    search,
    vehicleType,
    make,
    model,
    minYear,
    maxYear,
    transmission,
    fuel,
    drivetrain,
    minEngineCc,
    maxEngineCc,
      minSeats,
    minDoors,
    condition,
    wofValidity,
    regoValidity,
    layout,
    minLengthM,
    maxLengthM,
    maxWeightKg,
    carLicenceOnly,
    minFreshWaterL,
    minGreyWaterL,
    minBatteryAh,
    minSolarW,
    toiletType,
    minPrice,
    maxPrice,
    maxMileage,
    minSleeps,
    minBelts,
    selfContainedOnly,
    location,
    locationPoint,
    sortBy,
    amenities,
  }), [search, vehicleType, make, model, minYear, maxYear, transmission, fuel, drivetrain, minEngineCc, maxEngineCc, minSeats, minDoors, condition, wofValidity, regoValidity, layout, minLengthM, maxLengthM, maxWeightKg, carLicenceOnly, minFreshWaterL, minGreyWaterL, minBatteryAh, minSolarW, toiletType, minPrice, maxPrice, maxMileage, minSleeps, minBelts, selfContainedOnly, location, locationPoint, sortBy, amenities])

  const filtered = useMemo(() => (
    filterVehicles(vehicles, {
      ...appliedFilters,
      make,
      model,
      minYear,
      maxYear,
      transmission,
      fuel,
      drivetrain,
      minEngineCc,
      maxEngineCc,
        minSeats,
      minDoors,
      condition,
      wofValidity,
      regoValidity,
      layout,
      minLengthM,
      maxLengthM,
      maxWeightKg,
      carLicenceOnly,
      minFreshWaterL,
      minGreyWaterL,
      minBatteryAh,
      minSolarW,
      toiletType,
      minPrice,
      maxPrice,
      maxMileage,
      minSleeps,
      minBelts,
      selfContainedOnly,
      location,
      locationPoint,
      amenities,
      sortBy,
      sortPoint: devicePoint,
    })
  ), [vehicles, devicePoint, sortBy, appliedFilters, make, model, minYear, maxYear, transmission, fuel, drivetrain, minEngineCc, maxEngineCc, minSeats, minDoors, condition, wofValidity, regoValidity, layout, minLengthM, maxLengthM, maxWeightKg, carLicenceOnly, minFreshWaterL, minGreyWaterL, minBatteryAh, minSolarW, toiletType, minPrice, maxPrice, maxMileage, minSleeps, minBelts, selfContainedOnly, location, locationPoint, amenities])

  const appliedChips = useMemo(() => activeFilterChips(appliedFilters), [appliedFilters])

  useEffect(() => {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches))
  }, [savedSearches])

  useEffect(() => {
    sessionStorage.setItem(HOME_STATE_KEY, JSON.stringify({
      draftFilters,
      appliedFilters,
      hasSearched,
      viewMode,
      currentPage,
    }))
  }, [draftFilters, appliedFilters, hasSearched, viewMode, currentPage])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageStart = (activePage - 1) * PAGE_SIZE
  const pageVehicles = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    if (!advancedFiltersOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') setAdvancedFiltersOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [advancedFiltersOpen])

  const scrollToResults = () => {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const applySearch = () => {
    setAppliedFilters(draftFilters)
    setCurrentPage(1)
    setHasSearched(true)
    scrollToResults()
  }

  const QUICK_FILTER_SETTERS = {
    search: setSearch,
    vehicleType: setVehicleType,
    make: setMake,
    model: setModel,
    minYear: setMinYear,
    maxYear: setMaxYear,
    transmission: setTransmission,
    fuel: setFuel,
    drivetrain: setDrivetrain,
    condition: setCondition,
    layout: setLayout,
    minPrice: setMinPrice,
    maxPrice: setMaxPrice,
    maxMileage: setMaxMileage,
    minSleeps: setMinSleeps,
    minBelts: setMinBelts,
    selfContainedOnly: setSelfContainedOnly,
    location: setLocation,
    sortBy: setSortBy,
  }

  const applyQuickFilter = updates => {
    Object.entries(updates).forEach(([key, value]) => QUICK_FILTER_SETTERS[key]?.(value))
    // Una sugerencia escribe el nombre pero no fija coordenadas: el radio
    // sigue necesitando una eleccion en el autocompletado.
    if ('location' in updates) setLocationPoint(null)
    setAppliedFilters({ ...draftFilters, ...updates, ...('location' in updates ? { locationPoint: null } : {}) })
    setCurrentPage(1)
    setHasSearched(true)
    scrollToResults()
  }

  const FILTER_RESETTERS = {
    search: setSearch,
    fuel: () => setFuel('all'),
    drivetrain: () => setDrivetrain('all'),
    minSeats: setMinSeats,
    minDoors: setMinDoors,
    condition: () => setCondition('all'),
    wofValidity: () => setWofValidity('all'),
    regoValidity: () => setRegoValidity('all'),
    layout: () => setLayout('all'),
    maxWeightKg: setMaxWeightKg,
    carLicenceOnly: () => setCarLicenceOnly(false),
    minFreshWaterL: setMinFreshWaterL,
    minGreyWaterL: setMinGreyWaterL,
    minBatteryAh: setMinBatteryAh,
    minSolarW: setMinSolarW,
    toiletType: () => setToiletType('all'),
    vehicleType: () => setVehicleType(DEFAULT_FILTERS.vehicleType),
    make: setMake,
    model: setModel,
    minPrice: setMinPrice,
    maxPrice: setMaxPrice,
    maxMileage: setMaxMileage,
    minSleeps: setMinSleeps,
    minBelts: setMinBelts,
    selfContainedOnly: () => setSelfContainedOnly(false),
  }

  const removeFilter = filterId => {
    if (filterId === 'location') {
      setLocation('')
      setLocationPoint(null)
    } else if (filterId === 'year') {
      setMinYear('')
      setMaxYear('')
    } else if (filterId === 'engineCc') {
      setMinEngineCc('')
      setMaxEngineCc('')
    } else if (filterId === 'lengthM') {
      setMinLengthM('')
      setMaxLengthM('')
    } else if (filterId === 'transmission') {
      setTransmission('all')
    } else if (filterId in FILTER_RESETTERS) {
      FILTER_RESETTERS[filterId](DEFAULT_FILTERS[filterId])
    } else {
      setAmenities(current => ({ ...current, [filterId]: false }))
    }

    setAppliedFilters(current => {
      if (filterId === 'location') return { ...current, location: '', locationPoint: null }
      if (filterId === 'year') return { ...current, minYear: '', maxYear: '' }
      if (filterId === 'engineCc') return { ...current, minEngineCc: '', maxEngineCc: '' }
      if (filterId === 'lengthM') return { ...current, minLengthM: '', maxLengthM: '' }
      if (filterId === 'transmission') return { ...current, transmission: 'all' }
      if (filterId in DEFAULT_FILTERS) return { ...current, [filterId]: DEFAULT_FILTERS[filterId] }
      return { ...current, amenities: { ...current.amenities, [filterId]: false } }
    })
    setCurrentPage(1)
  }

  const showAdvancedFilters = () => {
    setAdvancedFiltersOpen(true)
  }

  const applyAdvancedFilters = () => {
    setAppliedFilters(draftFilters)
    setCurrentPage(1)
    setHasSearched(true)
    setAdvancedFiltersOpen(false)
    scrollToResults()
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') applySearch()
  }

  const handleFilterChange = setter => value => setter(value)

  const handleSearchChange = handleFilterChange(setSearch)
  const handleVehicleTypeChange = handleFilterChange(setVehicleType)
  // Al cambiar de marca el modelo anterior deja de tener sentido.
  const handleMakeChange = value => {
    setMake(value)
    setModel('')
  }

  const handleModelChange = handleFilterChange(setModel)
  const handleMinYearChange = handleFilterChange(setMinYear)
  const handleMaxYearChange = handleFilterChange(setMaxYear)
  const handleTransmissionChange = handleFilterChange(setTransmission)
  const handleFuelChange = handleFilterChange(setFuel)
  const handleDrivetrainChange = handleFilterChange(setDrivetrain)
  const handleMinEngineCcChange = handleFilterChange(setMinEngineCc)
  const handleMaxEngineCcChange = handleFilterChange(setMaxEngineCc)
  const handleMinSeatsChange = handleFilterChange(setMinSeats)
  const handleMinDoorsChange = handleFilterChange(setMinDoors)
  const handleConditionChange = handleFilterChange(setCondition)
  const handleWofValidityChange = handleFilterChange(setWofValidity)
  const handleRegoValidityChange = handleFilterChange(setRegoValidity)
  const handleLayoutChange = handleFilterChange(setLayout)
  const handleMinLengthChange = handleFilterChange(setMinLengthM)
  const handleMaxLengthChange = handleFilterChange(setMaxLengthM)
  const handleMaxWeightChange = handleFilterChange(setMaxWeightKg)
  const handleMinFreshWaterChange = handleFilterChange(setMinFreshWaterL)
  const handleMinGreyWaterChange = handleFilterChange(setMinGreyWaterL)
  const handleMinBatteryChange = handleFilterChange(setMinBatteryAh)
  const handleMinSolarChange = handleFilterChange(setMinSolarW)
  const handleToiletTypeChange = handleFilterChange(setToiletType)

  // Geolocalizacion del navegador para ordenar por cercania sin escribir ciudad.
  const useDeviceLocation = () => {
    if (!navigator.geolocation) return
    setLocatingDevice(true)
    navigator.geolocation.getCurrentPosition(
      position => {
        const point = { label: 'My location', lat: position.coords.latitude, lng: position.coords.longitude, device: true }
        setDevicePoint(point)
        setLocation('My location')
        setLocationPoint(point)
        setLocatingDevice(false)
      },
      () => setLocatingDevice(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }
  const handleMinPriceChange = handleFilterChange(setMinPrice)
  const handleMaxPriceChange = handleFilterChange(setMaxPrice)
  const handleMaxMileageChange = handleFilterChange(setMaxMileage)
  const handleMinSleepsChange = handleFilterChange(setMinSleeps)
  const handleMinBeltsChange = handleFilterChange(setMinBelts)
  // Escribir a mano invalida las coordenadas: solo una sugerencia real las fija.
  const handleLocationChange = value => {
    setLocation(value)
    setLocationPoint(null)
  }

  const handleLocationSelect = place => {
    setLocation(place.label)
    setLocationPoint({ label: place.label, region: place.region, lat: place.lat, lng: place.lng })
  }

  const handleAmenityChange = amenityId => {
    setAmenities(current => ({ ...current, [amenityId]: !current[amenityId] }))
  }

  const clearFilters = () => {
    setSearch('')
    setVehicleType('all')
    setMake('')
    setModel('')
    setMinYear('')
    setMaxYear('')
    setTransmission('all')
    setFuel('all')
    setDrivetrain('all')
    setMinEngineCc('')
    setMaxEngineCc('')
    setMinSeats('')
    setMinDoors('')
    setCondition('all')
    setWofValidity('all')
    setRegoValidity('all')
    setLayout('all')
    setMinLengthM('')
    setMaxLengthM('')
    setMaxWeightKg('')
    setCarLicenceOnly(false)
    setMinFreshWaterL('')
    setMinGreyWaterL('')
    setMinBatteryAh('')
    setMinSolarW('')
    setToiletType('all')
    setMinPrice('')
    setMaxPrice('')
    setMaxMileage('')
    setMinSleeps('')
    setMinBelts('')
    setSelfContainedOnly(false)
    setLocation('')
    setLocationPoint(null)
    setAmenities(DEFAULT_FILTERS.amenities)
    setSortBy('recent')
    setAppliedFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  const appliedKey = filtersKey(appliedFilters)
  const draftKey = filtersKey(draftFilters)
  const isCurrentSearchSaved = savedSearches.some(item => filtersKey(item.filters) === appliedKey)
  const isDraftSaved = savedSearches.some(item => filtersKey(item.filters) === draftKey)

  const saveSearch = filters => {
    const key = filtersKey(filters)
    const entryName = describeSearch(filters)

    setSavedSearches(current => {
      const existingIndex = current.findIndex(item => filtersKey(item.filters) === key)
      const entry = {
        id: existingIndex >= 0 ? current[existingIndex].id : `${Date.now()}`,
        name: entryName,
        filters,
        lastCount: filtered.length,
        lastCheckedAt: new Date().toISOString(),
      }
      if (existingIndex >= 0) return current.map((item, index) => index === existingIndex ? entry : item)
      return [entry, ...current].slice(0, 8)
    })
  }

  const removeSavedSearch = id => {
    setSavedSearches(current => current.filter(item => item.id !== id))
  }

  // El icono de marcador actua como interruptor: guarda la busqueda actual o la
  // quita si ya estaba guardada.
  const toggleSaveCurrentSearch = () => {
    if (isCurrentSearchSaved) {
      setSavedSearches(current => current.filter(item => filtersKey(item.filters) !== appliedKey))
      return
    }
    saveSearch(appliedFilters)
  }

  const applyFiltersObject = filters => {
    const next = {
      ...DEFAULT_FILTERS,
      ...filters,
      amenities: { ...DEFAULT_FILTERS.amenities, ...(filters?.amenities || {}) },
    }

    setSearch(next.search)
    setVehicleType(next.vehicleType)
    setMake(next.make)
    setModel(next.model)
    setMinYear(next.minYear)
    setMaxYear(next.maxYear)
    setTransmission(next.transmission)
    setFuel(next.fuel)
    setDrivetrain(next.drivetrain)
    setMinEngineCc(next.minEngineCc)
    setMaxEngineCc(next.maxEngineCc)
    setMinSeats(next.minSeats)
    setMinDoors(next.minDoors)
    setCondition(next.condition)
    setWofValidity(next.wofValidity)
    setRegoValidity(next.regoValidity)
    setLayout(next.layout)
    setMinLengthM(next.minLengthM)
    setMaxLengthM(next.maxLengthM)
    setMaxWeightKg(next.maxWeightKg)
    setCarLicenceOnly(next.carLicenceOnly)
    setMinFreshWaterL(next.minFreshWaterL)
    setMinGreyWaterL(next.minGreyWaterL)
    setMinBatteryAh(next.minBatteryAh)
    setMinSolarW(next.minSolarW)
    setToiletType(next.toiletType)
    setMinPrice(next.minPrice)
    setMaxPrice(next.maxPrice)
    setMaxMileage(next.maxMileage)
    setMinSleeps(next.minSleeps)
    setMinBelts(next.minBelts)
    setSelfContainedOnly(next.selfContainedOnly)
    setLocation(next.location)
    setLocationPoint(next.locationPoint || null)
    setSortBy(next.sortBy)
    setAmenities(next.amenities)
    setAppliedFilters(next)
    setCurrentPage(1)
    setHasSearched(true)
  }

  const applySavedSearch = saved => {
    applyFiltersObject(saved.filters)
    setAdvancedFiltersOpen(false)
    scrollToResults()
  }

  return (
    <div className={`app-shell ${hasSearched ? 'has-searched' : 'is-pre-search'}`}>
      <Navbar />

      <header className="hero" style={{ backgroundImage: `url(${heroSeaImage})` }}>
        <div className="hero-inner">
          <h1>What are you looking for?</h1>

          <div className="hero-quick-filters" aria-label="Search suggestions">
            {QUICK_SEARCHES.map(suggestion => (
              <button key={suggestion.label} type="button" onClick={() => applyQuickFilter(suggestion.filters)}>
                {suggestion.label}
              </button>
            ))}
          </div>

          <div className="hero-search">
            <input
              type="search"
              placeholder="Model, city, WOF..."
              value={search}
              onChange={event => handleSearchChange(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button
              className={`hero-search-save ${isCurrentSearchSaved ? 'is-saved' : ''}`}
              type="button"
              onClick={toggleSaveCurrentSearch}
              aria-pressed={isCurrentSearchSaved}
              aria-label={isCurrentSearchSaved ? 'Remove saved search' : 'Save this search'}
            >
              <FiBookmark />
            </button>
            <span className="hero-search-divider" aria-hidden="true" />
            <button className="hero-search-filters" type="button" onClick={showAdvancedFilters}>
              <FiSettings />
              Filters
            </button>
          </div>
        </div>
      </header>

      <main className="container page-section">
        <div className={`active-filter-bar ${appliedChips.length === 0 ? 'is-empty' : ''}`}>
          <div className="active-filter-scroll" aria-label="Active filters">
            {appliedChips.length > 0 ? (
              <>
                <span className="active-filter-label">Active filters:</span>
                {appliedChips.map(chip => (
                  <span className="active-filter-chip" key={chip.id}>
                    {chip.label}
                    <button type="button" onClick={() => removeFilter(chip.id)} aria-label={`Remove ${chip.label} filter`}>
                      <FiX />
                    </button>
                  </span>
                ))}
              </>
            ) : (
              <span className="active-filter-chip active-filter-chip-static">All vehicles</span>
            )}
          </div>
          <div className="active-filter-actions">
            <button className="active-filter-clear" type="button" onClick={clearFilters}>Clear all</button>
          </div>
        </div>

        <div className="section-header results-header" ref={resultsRef}>
          <div>
            <h2 className="section-title">{filtered.length} vehicles</h2>
          </div>
          <SortMenu value={sortBy} options={SORT_OPTIONS} onChange={setSortBy} />
          <div className="segmented-control" aria-label="View mode">
            <div className="view-toggle" role="group" aria-label="Results view">
              <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" aria-pressed={viewMode === 'grid'} onClick={() => setViewMode('grid')}><FiGrid />Grid</button>
              <button className={viewMode === 'map' ? 'is-active' : ''} type="button" aria-pressed={viewMode === 'map'} onClick={() => { setViewMode('map'); scrollToResults() }}><FiMap />Map</button>
            </div>
            <button className="results-filter-button" type="button" onClick={() => setAdvancedFiltersOpen(true)}>
              <FiSettings />
              Filters
            </button>
          </div>
        </div>

        <div className="search-results-main">
          {loading ? (
            <div className="loading-state">
              <div>
                <div className="spinner" />
                Loading vehicles...
              </div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state panel">
              <div>
                <FiSearch size={42} />
                <h2>No vehicles found</h2>
                <p>Try a broader model, region or price range.</p>
                <button className="btn btn-primary" type="button" onClick={clearFilters}>
                  Clear filters
                  <FiArrowRight />
                </button>
              </div>
            </div>
          ) : viewMode === 'map' ? (
            <VehicleMap vehicles={filtered} focusPoint={locationPoint} />
          ) : (
            <>
              <div className="products-grid">
                {pageVehicles.map(vehicle => <ProductCard key={vehicle.id} product={vehicle} />)}
              </div>
              <PaginationBar
                currentPage={activePage}
                totalPages={totalPages}
                totalItems={filtered.length}
                onPrevious={() => setCurrentPage(page => Math.max(1, page - 1))}
                onNext={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
              />
            </>
          )}
        </div>

        <AdvancedFiltersModal
          vehicleType={vehicleType}
          make={make}
          model={model}
          minYear={minYear}
          maxYear={maxYear}
          transmission={transmission}
          fuel={fuel}
          drivetrain={drivetrain}
          minEngineCc={minEngineCc}
          maxEngineCc={maxEngineCc}
          minSeats={minSeats}
          minDoors={minDoors}
          condition={condition}
          wofValidity={wofValidity}
          regoValidity={regoValidity}
          layout={layout}
          minLengthM={minLengthM}
          maxLengthM={maxLengthM}
          maxWeightKg={maxWeightKg}
          carLicenceOnly={carLicenceOnly}
          minFreshWaterL={minFreshWaterL}
          minGreyWaterL={minGreyWaterL}
          minBatteryAh={minBatteryAh}
          minSolarW={minSolarW}
          toiletType={toiletType}
          sortBy={sortBy}
          locatingDevice={locatingDevice}
          minPrice={minPrice}
          maxPrice={maxPrice}
          maxMileage={maxMileage}
          minSleeps={minSleeps}
          minBelts={minBelts}
          selfContainedOnly={selfContainedOnly}
          location={location}
          locationPoint={locationPoint}
          amenities={amenities}
          makes={makes}
          models={models}
          years={years}
          onVehicleTypeChange={handleVehicleTypeChange}
          onMakeChange={handleMakeChange}
          onModelChange={handleModelChange}
          onMinYearChange={handleMinYearChange}
          onMaxYearChange={handleMaxYearChange}
          onTransmissionChange={handleTransmissionChange}
          onFuelChange={handleFuelChange}
          onDrivetrainChange={handleDrivetrainChange}
          onMinEngineCcChange={handleMinEngineCcChange}
          onMaxEngineCcChange={handleMaxEngineCcChange}
          onMinSeatsChange={handleMinSeatsChange}
          onMinDoorsChange={handleMinDoorsChange}
          onConditionChange={handleConditionChange}
          onWofValidityChange={handleWofValidityChange}
          onRegoValidityChange={handleRegoValidityChange}
          onLayoutChange={handleLayoutChange}
          onMinLengthChange={handleMinLengthChange}
          onMaxLengthChange={handleMaxLengthChange}
          onMaxWeightChange={handleMaxWeightChange}
          onCarLicenceChange={setCarLicenceOnly}
          onMinFreshWaterChange={handleMinFreshWaterChange}
          onMinGreyWaterChange={handleMinGreyWaterChange}
          onMinBatteryChange={handleMinBatteryChange}
          onMinSolarChange={handleMinSolarChange}
          onToiletTypeChange={handleToiletTypeChange}
          onSortByChange={setSortBy}
          onUseDeviceLocation={useDeviceLocation}
          onMinPriceChange={handleMinPriceChange}
          onMaxPriceChange={handleMaxPriceChange}
          onMaxMileageChange={handleMaxMileageChange}
          onMinSleepsChange={handleMinSleepsChange}
          onMinBeltsChange={handleMinBeltsChange}
          onSelfContainedChange={setSelfContainedOnly}
          onLocationChange={handleLocationChange}
          onLocationSelect={handleLocationSelect}
          onAmenityChange={handleAmenityChange}
          onClear={clearFilters}
          onApply={applyAdvancedFilters}
          open={advancedFiltersOpen}
          onOpenChange={setAdvancedFiltersOpen}
          savedSearches={savedSearches}
          isDraftSaved={isDraftSaved}
          onSaveDraft={() => saveSearch(draftFilters)}
          onApplySaved={applySavedSearch}
          onRemoveSaved={removeSavedSearch}
        />
      </main>

      <Footer />
    </div>
  )
}

function AdvancedFilterFields({
  idPrefix,
  vehicleType,
  make,
  model,
  minYear,
  maxYear,
  transmission,
  fuel,
  drivetrain,
  minEngineCc,
  maxEngineCc,
  minSeats,
  minDoors,
  condition,
  wofValidity,
  regoValidity,
  layout,
  minLengthM,
  maxLengthM,
  maxWeightKg,
  carLicenceOnly,
  minFreshWaterL,
  minGreyWaterL,
  minBatteryAh,
  minSolarW,
  toiletType,
  sortBy,
  locatingDevice,
  minPrice,
  maxPrice,
  maxMileage,
  minSleeps,
  minBelts,
  selfContainedOnly,
  location,
  locationPoint,
  amenities,
  makes = [],
  models = [],
  years = [],
  onVehicleTypeChange,
  onMakeChange,
  onModelChange,
  onMinYearChange,
  onMaxYearChange,
  onTransmissionChange,
  onFuelChange,
  onDrivetrainChange,
  onMinEngineCcChange,
  onMaxEngineCcChange,
  onMinSeatsChange,
  onMinDoorsChange,
  onConditionChange,
  onWofValidityChange,
  onRegoValidityChange,
  onLayoutChange,
  onMinLengthChange,
  onMaxLengthChange,
  onMaxWeightChange,
  onCarLicenceChange,
  onMinFreshWaterChange,
  onMinGreyWaterChange,
  onMinBatteryChange,
  onMinSolarChange,
  onToiletTypeChange,
  onSortByChange,
  onUseDeviceLocation,
  onMinPriceChange,
  onMaxPriceChange,
  onMaxMileageChange,
  onMinSleepsChange,
  onMinBeltsChange,
  onSelfContainedChange,
  onLocationChange,
  onLocationSelect,
  onAmenityChange,
}) {
  const yearListId = `${idPrefix}-advanced-year-options`
  // Un modelo restaurado de un filtro guardado puede no estar en la lista de la
  // marca actual: se anade para que el select no aparezca vacio.
  const modelOptions = model && !models.includes(model) ? [model, ...models] : models

  return (
    <>
      <div className="advanced-filter-group">
        <strong>Vehicle type</strong>
        <label className="field-group">
          <span>Type</span>
          <select className="field" value={vehicleType} onChange={event => onVehicleTypeChange(event.target.value)}>
            {VEHICLE_TYPE_FILTERS.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Make and model</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>Make</span>
            <select className="field" value={make} onChange={event => onMakeChange(event.target.value)}>
              <option value="">Any make</option>
              {makes.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field-group">
            <span>Model</span>
            {modelOptions.length > 0 ? (
              <select className="field" value={model} onChange={event => onModelChange(event.target.value)}>
                <option value="">Any model</option>
                {modelOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            ) : (
              <input className="field" placeholder="Any model" value={model} onChange={event => onModelChange(event.target.value)} />
            )}
          </label>
        </div>
      </div>

      <div className="advanced-filter-group">
        <strong>Price range</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>Min NZ$</span>
            <input className="field" inputMode="numeric" placeholder="15k" value={minPrice} onChange={event => onMinPriceChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Max NZ$</span>
            <input className="field" inputMode="numeric" placeholder="80k" value={maxPrice} onChange={event => onMaxPriceChange(event.target.value)} />
          </label>
        </div>
        <RangeSlider
          min={0}
          max={150000}
          step={5000}
          minValue={minPrice}
          maxValue={maxPrice}
          minLabel="0"
          maxLabel="150k"
          onMinChange={onMinPriceChange}
          onMaxChange={onMaxPriceChange}
        />
      </div>

      <div className="advanced-filter-group">
        <strong>Location</strong>
        <LocationField
          idPrefix={idPrefix}
          value={location}
          selected={locationPoint}
          hint="Pick a suggestion to sort by distance."
          locating={locatingDevice}
          onChange={onLocationChange}
          onSelect={onLocationSelect}
          onUseMyLocation={onUseDeviceLocation}
        />
        <p className="filter-note">
          Pick a suggestion and the results are ordered from closest to furthest.
        </p>
      </div>

      <div className="advanced-filter-group">
        <strong>Vehicle details</strong>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Year from</span>
            <input className="field" inputMode="numeric" list={yearListId} placeholder="Any year" value={minYear} onChange={event => onMinYearChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Year to</span>
            <input className="field" inputMode="numeric" list={yearListId} placeholder="Any year" value={maxYear} onChange={event => onMaxYearChange(event.target.value)} />
          </label>
        </div>
        <datalist id={yearListId}>
          {years.map(item => <option key={item} value={item} />)}
        </datalist>
        <label className="field-group">
          <span>Transmission</span>
          <select className="field" value={transmission} onChange={event => onTransmissionChange(event.target.value)}>
            <option value="all">Any transmission</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label className="field-group">
          <span>Max mileage</span>
          <input className="field" inputMode="numeric" placeholder="150000" value={maxMileage} onChange={event => onMaxMileageChange(event.target.value)} />
        </label>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Sleeps min</span>
            <input className="field" inputMode="numeric" placeholder="2" value={minSleeps} onChange={event => onMinSleepsChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Belts min</span>
            <input className="field" inputMode="numeric" placeholder="3" value={minBelts} onChange={event => onMinBeltsChange(event.target.value)} />
          </label>
        </div>
        <label className="field-group">
          <span>Condition</span>
          <select className="field" value={condition} onChange={event => onConditionChange(event.target.value)}>
            <option value="all">Any condition</option>
            {CONDITION_FILTERS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Mechanical</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>Fuel</span>
            <select className="field" value={fuel} onChange={event => onFuelChange(event.target.value)}>
              <option value="all">Any fuel</option>
              {FUEL_FILTERS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field-group">
            <span>Drivetrain</span>
            <select className="field" value={drivetrain} onChange={event => onDrivetrainChange(event.target.value)}>
              {DRIVETRAIN_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Engine from (cc)</span>
            <input className="field" inputMode="numeric" placeholder="2000" value={minEngineCc} onChange={event => onMinEngineCcChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Engine to (cc)</span>
            <input className="field" inputMode="numeric" placeholder="3000" value={maxEngineCc} onChange={event => onMaxEngineCcChange(event.target.value)} />
          </label>
        </div>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Seats min</span>
            <input className="field" inputMode="numeric" placeholder="4" value={minSeats} onChange={event => onMinSeatsChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Doors min</span>
            <input className="field" inputMode="numeric" placeholder="3" value={minDoors} onChange={event => onMinDoorsChange(event.target.value)} />
          </label>
        </div>
      </div>

      <div className="advanced-filter-group">
        <strong>Paperwork</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>WOF</span>
            <select className="field" value={wofValidity} onChange={event => onWofValidityChange(event.target.value)}>
              {VALIDITY_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="field-group">
            <span>Rego</span>
            <select className="field" value={regoValidity} onChange={event => onRegoValidityChange(event.target.value)}>
              {VALIDITY_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="advanced-filter-group">
        <strong>Layout and size</strong>
        <label className="field-group">
          <span>Layout</span>
          <select className="field" value={layout} onChange={event => onLayoutChange(event.target.value)}>
            <option value="all">Any layout</option>
            {LAYOUT_FILTERS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Length from (m)</span>
            <input className="field" inputMode="decimal" placeholder="5" value={minLengthM} onChange={event => onMinLengthChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Length to (m)</span>
            <input className="field" inputMode="decimal" placeholder="7" value={maxLengthM} onChange={event => onMaxLengthChange(event.target.value)} />
          </label>
        </div>
        <label className="field-group">
          <span>Max weight (kg)</span>
          <input className="field" inputMode="numeric" placeholder="3500" value={maxWeightKg} onChange={event => onMaxWeightChange(event.target.value)} />
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={carLicenceOnly} onChange={event => onCarLicenceChange(event.target.checked)} />
          Drivable on a car licence (up to 3,500 kg)
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Off-grid capacity</strong>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Fresh water min (L)</span>
            <input className="field" inputMode="numeric" placeholder="60" value={minFreshWaterL} onChange={event => onMinFreshWaterChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Grey water min (L)</span>
            <input className="field" inputMode="numeric" placeholder="60" value={minGreyWaterL} onChange={event => onMinGreyWaterChange(event.target.value)} />
          </label>
        </div>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Battery min (Ah)</span>
            <input className="field" inputMode="numeric" placeholder="100" value={minBatteryAh} onChange={event => onMinBatteryChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Solar min (W)</span>
            <input className="field" inputMode="numeric" placeholder="200" value={minSolarW} onChange={event => onMinSolarChange(event.target.value)} />
          </label>
        </div>
        <label className="field-group">
          <span>Toilet</span>
          <select className="field" value={toiletType} onChange={event => onToiletTypeChange(event.target.value)}>
            {TOILET_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Self-containment</strong>
        <label className="toggle-row">
          <input type="checkbox" checked={selfContainedOnly} onChange={event => onSelfContainedChange(event.target.checked)} />
          Self-contained only
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Sort</strong>
        <label className="field-group">
          <span>Order results by</span>
          <select className="field" value={sortBy} onChange={event => onSortByChange(event.target.value)}>
            {SORT_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <p className="filter-note">
          "Best match" shows the closest vehicles first when you pick a location, and the newest listings when you do not.
        </p>
      </div>

      <div className="advanced-filter-group">
        <strong>Equipment</strong>
        <div className="amenity-grid">
          {AMENITY_FILTERS.map(amenity => (
            <label className="amenity-check" key={amenity.id}>
              <input type="checkbox" checked={Boolean(amenities[amenity.id])} onChange={() => onAmenityChange(amenity.id)} />
              <span>{amenity.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )
}

function AdvancedFiltersModal({
  onClear,
  onApply,
  open,
  onOpenChange,
  savedSearches = [],
  isDraftSaved = false,
  onSaveDraft,
  onApplySaved,
  onRemoveSaved,
  ...fieldProps
}) {
  if (!open) return null

  return (
    <div className="filters-modal-overlay" onClick={() => onOpenChange(false)}>
      <div className="filters-modal-sheet panel" role="dialog" aria-modal="true" aria-label="Filters" onClick={event => event.stopPropagation()}>
        <div className="filters-modal-head">
          <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Filters</h2>
          <button className="icon-btn" type="button" aria-label="Close filters" onClick={() => onOpenChange(false)}>
            <FiX />
          </button>
        </div>

        <div className="filters-modal-body">
          <AdvancedFilterFields {...fieldProps} idPrefix="modal" />

          <div className="advanced-filter-group saved-filters-group">
            <div className="saved-filters-head">
              <strong>Saved filters</strong>
              <button
                className={`saved-filters-save ${isDraftSaved ? 'is-saved' : ''}`}
                type="button"
                onClick={onSaveDraft}
                aria-pressed={isDraftSaved}
              >
                <FiBookmark />
                {isDraftSaved ? 'Saved' : 'Save these filters'}
              </button>
            </div>

            {savedSearches.length === 0 ? (
              <p className="saved-filters-empty">You have no saved filters yet.</p>
            ) : (
              <ul className="saved-filters-list">
                {savedSearches.map(saved => (
                  <li key={saved.id}>
                    <button className="saved-filters-item" type="button" onClick={() => onApplySaved(saved)}>
                      <span className="saved-filters-name">{saved.name}</span>
                      <span className="saved-filters-count">{saved.lastCount} vehicles</span>
                    </button>
                    <button
                      className="saved-filters-remove"
                      type="button"
                      onClick={() => onRemoveSaved(saved.id)}
                      aria-label={`Remove saved filter ${saved.name}`}
                    >
                      <FiX />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="advanced-filter-actions">
          <button className="btn btn-secondary" type="button" onClick={onClear}>Clear</button>
          <button className="btn btn-primary" type="button" onClick={onApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}

function RangeSlider({
  min,
  max,
  step,
  minValue,
  maxValue,
  minLabel,
  maxLabel,
  single = false,
  onMinChange,
  onMaxChange,
}) {
  const cleanMin = parsePositiveNumber(minValue)
  const cleanMax = parsePositiveNumber(maxValue)
  const lower = Math.min(Math.max(cleanMin ?? min, min), max)
  const upper = Math.min(Math.max(cleanMax ?? max, min), max)
  const leftPercent = single ? 0 : ((lower - min) / (max - min)) * 100
  const rightPercent = ((upper - min) / (max - min)) * 100

  const handleMinChange = value => {
    const nextValue = Math.min(Number(value), upper)
    onMinChange?.(String(nextValue || ''))
  }

  const handleMaxChange = value => {
    const nextValue = Math.max(Number(value), single ? min : lower)
    onMaxChange?.(String(nextValue || ''))
  }

  return (
    <div className="range-control">
      <div
        className="range-track"
        style={{
          '--range-start': `${leftPercent}%`,
          '--range-end': `${rightPercent}%`,
        }}
      >
        {!single && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lower}
            onChange={event => handleMinChange(event.target.value)}
            aria-label="Minimum"
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={upper}
          onChange={event => handleMaxChange(event.target.value)}
          aria-label="Maximum"
        />
      </div>
      <div className="range-labels">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}

function PaginationBar({ currentPage, totalPages, totalItems, onPrevious, onNext }) {
  if (totalItems <= PAGE_SIZE) return null

  return (
    <nav className="pagination-bar" aria-label="Product pages">
      <button className="pagination-nav" type="button" disabled={currentPage === 1} onClick={onPrevious}>
        <FiArrowLeft />
        Previous
      </button>
      <span>
        <strong>Page {currentPage} of {totalPages}</strong>
      </span>
      <button className="pagination-nav" type="button" disabled={currentPage === totalPages} onClick={onNext}>
        Next
        <FiArrowRight />
      </button>
    </nav>
  )
}

function SortMenu({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const active = options.find(option => option.id === value) || options[0]

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="results-sort" ref={containerRef}>
      <button
        className="results-sort-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort results, currently ${active.label}`}
        onClick={() => setOpen(current => !current)}
      >
        <FiChevronDown className="results-sort-caret" />
        <span className="results-sort-label">Sort</span>
        <span className="results-sort-value">{active.label}</span>
      </button>

      {open && (
        <ul className="results-sort-menu" role="listbox">
          {options.map(option => (
            <li key={option.id}>
              <button
                className={`results-sort-option ${option.id === value ? 'is-active' : ''}`}
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => { onChange(option.id); setOpen(false) }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function VehicleMap({ vehicles, focusPoint }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let ignore = false

    async function setupMap() {
      try {
        const L = await loadLeaflet()
        if (ignore || !mapRef.current || leafletMapRef.current) return

        const map = L.map(mapRef.current, {
          center: [-41.2, 172.8],
          zoom: 5,
          minZoom: 5,
          maxZoom: 19,
          // La rueda hace scroll de la pagina, no zoom del mapa: encadenaba
          // cargas de tiles hasta bloquear el render. Se usan los botones +/-,
          // el pinch en movil o ctrl + rueda.
          scrollWheelZoom: false,
          zoomControl: true,
        })

        map.getContainer().addEventListener('wheel', event => {
          if (!event.ctrlKey && !event.metaKey) return
          event.preventDefault()
          map.setZoom(map.getZoom() + (event.deltaY < 0 ? 1 : -1))
        }, { passive: false })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        markerLayerRef.current = L.layerGroup().addTo(map)
        leafletMapRef.current = map
        setMapReady(true)
        setTimeout(() => map.invalidateSize(), 120)
      } catch {
        if (!ignore) setMapError('Map service could not load. Check your connection and try again.')
      }
    }

    setupMap()

    return () => {
      ignore = true
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
      markerLayerRef.current = null
      setMapReady(false)
    }
  }, [])

  const focusLat = Number(focusPoint?.lat)
  const focusLng = Number(focusPoint?.lng)
  const hasFocus = Number.isFinite(focusLat) && Number.isFinite(focusLng)

  useEffect(() => {
    const L = window.L
    const map = leafletMapRef.current
    const layer = markerLayerRef.current
    if (!mapReady || !L || !map || !layer) return

    layer.clearLayers()
    const bounds = []

    vehicles.forEach(vehicle => {
      if (!vehicle.lat || !vehicle.lng) return
      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: L.divIcon({
          className: 'swapy-map-marker',
          html: `<span>NZ${Math.round(Number(vehicle.price || 0) / 1000)}k</span>`,
          iconSize: [62, 38],
          iconAnchor: [31, 38],
        }),
      }).addTo(layer)

      const image = vehicle.image || 'https://placehold.co/640x480/f1ede5/171717?text=Swapy'
      const price = Number(vehicle.price || 0).toLocaleString('en-NZ')
      const meta = [vehicle.location || 'New Zealand', vehicle.model].filter(Boolean).join(' · ')

      marker.bindPopup(`
        <div class="map-popup">
          <img class="map-popup-image" src="${escapeHtml(image)}" alt="" />
          <div class="map-popup-body">
            <strong>${escapeHtml(vehicle.title)}</strong>
            <p class="map-popup-price">NZ$${price}</p>
            <p class="map-popup-meta">${escapeHtml(meta)}</p>
            <a href="/product/${encodeURIComponent(vehicle.id)}">View listing</a>
          </div>
        </div>
      `, { minWidth: 220, maxWidth: 240 })
      bounds.push([vehicle.lat, vehicle.lng])
    })

    if (hasFocus) {
      const focus = { lat: focusLat, lng: focusLng }

      L.circleMarker([focusLat, focusLng], {
        className: 'swapy-map-focus',
        radius: 9,
        weight: 3,
        color: '#14bc7d',
        fillColor: '#14bc7d',
        fillOpacity: 0.25,
      })
        .addTo(layer)
        .bindTooltip(escapeHtml(focusPoint.label || 'Selected location'), { direction: 'top', offset: [0, -10] })

      // El encuadre cubre la ubicacion elegida y los anuncios mas cercanos, no
      // todo el pais: asi se ve el sitio buscado y algo de oferta alrededor.
      const nearest = vehicles
        .filter(vehicle => vehicle.lat && vehicle.lng)
        .map(vehicle => ({ vehicle, distance: distanceKm(focus, vehicle) }))
        .filter(entry => entry.distance !== null)
        .sort((first, second) => first.distance - second.distance)
        .slice(0, 5)
        .map(entry => [entry.vehicle.lat, entry.vehicle.lng])

      map.fitBounds([[focusLat, focusLng], ...nearest], { padding: [40, 40], maxZoom: 11 })
      return
    }

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 8 })
    }
  }, [vehicles, mapReady, hasFocus, focusLat, focusLng, focusPoint?.label])

  useEffect(() => {
    const map = leafletMapRef.current
    if (!mapReady || !map) return
    const timer = setTimeout(() => map.invalidateSize(), 80)
    return () => clearTimeout(timer)
  }, [mapReady, vehicles.length])

  return (
    <section className="map-layout">
      <div className="street-map panel">
        <div className="street-map-canvas" ref={mapRef} aria-label="Interactive New Zealand vehicle map" />
        {mapError && <div className="map-error">{mapError}</div>}
      </div>
    </section>
  )
}
