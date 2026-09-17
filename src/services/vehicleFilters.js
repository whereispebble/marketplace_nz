/**
 * Filtrado y ordenacion de vehiculos.
 *
 * Funciones puras, sin React ni acceso a red: reciben la lista de anuncios y un
 * objeto de filtros y devuelven el resultado. Estan separadas de la pantalla
 * para poder razonar sobre ellas (y probarlas) sin montar la interfaz.
 *
 * El filtrado ocurre en el navegador, sobre anuncios que el servidor ya ha
 * dejado ver: de otros usuarios solo llegan los publicados, nunca borradores.
 */

import { AMENITY_FILTERS, DEFAULT_FILTERS, DRIVETRAIN_FILTERS, TOILET_FILTERS, VALIDITY_FILTERS } from '../constants/filters'

const SEARCH_SYNONYMS = {
  camper: ['campervan', 'motorhome', 'rv', 'vanlife', 'selfcontained', 'self-contained'],
  van: ['campervan', 'hiace', 'transit', 'sprinter', 'caravan'],
  motorhome: ['rv', 'camper', 'ducato'],
  auckland: ['akl'],
  christchurch: ['chch', 'canterbury'],
  queenstown: ['otago', 'wanaka'],
  wof: ['warrant', 'roadworthy'],
}

export function normalise(value) {
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

export function fuzzyIncludes(haystack, query) {
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

export function parsePriceCeiling(value) {
  const cleanValue = normalise(value)
  if (!cleanValue || cleanValue === 'all' || cleanValue === 'any') return null

  const hasK = cleanValue.includes('k')
  const numericValue = Number(cleanValue.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null

  return hasK ? numericValue * 1000 : numericValue
}

export function formatCompactCurrency(value) {
  const amount = Number(value || 0)
  if (amount >= 1000 && amount % 1000 === 0) return `${amount / 1000}k`
  return amount.toLocaleString('en-NZ')
}

export function parsePositiveNumber(value) {
  const cleanValue = normalise(value)
  if (!cleanValue || cleanValue === 'all' || cleanValue === 'any') return null

  const hasK = cleanValue.includes('k')
  const numericValue = Number(cleanValue.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericValue) || numericValue < 0) return null

  return hasK ? numericValue * 1000 : numericValue
}

export function distanceKm(first, second) {
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
    vehicle.wofExpiry ? 'wof warrant of fitness' : '',
    vehicle.selfContained ? 'self contained certified freedom camping' : 'not self contained',
    `${vehicle.sleeps} berth sleeps`,
    `${vehicle.belts} seat belts`,
  ].join(' ')
}

export function vehicleMake(vehicle) {
  return vehicle.make || vehicle.model?.split(' ')[0] || ''
}

// Muchos anuncios guardan el modelo con la marca delante ("Toyota Hiace"); en el
// desplegable interesa solo "Hiace" para no duplicar entradas del catalogo.
export function stripMakePrefix(model, make) {
  const cleanModel = String(model || '').trim()
  const cleanMake = String(make || '').trim()
  if (!cleanModel || !cleanMake) return cleanModel
  if (!normalise(cleanModel).startsWith(`${normalise(cleanMake)} `)) return cleanModel
  return cleanModel.slice(cleanMake.length).trim() || cleanModel
}

// Los anuncios reales pueden no traer `year`; en ese caso se intenta leer del
// titulo, donde suele ir por delante ("2014 Toyota Hiace...").
export function vehicleYear(vehicle) {
  const direct = Number(vehicle.year)
  if (Number.isFinite(direct) && direct > 1900) return direct
  const fromTitle = String(vehicle.title || '').match(/\b(19|20)\d{2}\b/)
  return fromTitle ? Number(fromTitle[0]) : null
}


// Clave estable para comparar dos conjuntos de filtros sin depender del orden
// en el que se escribieron las propiedades.
export function filtersKey(filters) {
  const normalised = {
    ...DEFAULT_FILTERS,
    ...(filters || {}),
    amenities: { ...DEFAULT_FILTERS.amenities, ...(filters?.amenities || {}) },
  }
  return JSON.stringify(Object.keys(normalised).sort().map(key => [key, normalised[key]]))
}

export function filterVehicles(vehicles, filters) {
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
    .filter(vehicle => filters.vehicleType === 'all' || vehicle.vehicleType === filters.vehicleType)
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
export function describeSearch(filters) {
  const parts = activeFilterChips(filters).map(chip => chip.label)
  return parts.join(' · ') || 'All vehicles'
}

export function activeFilterChips(filters) {
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
