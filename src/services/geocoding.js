import { hasCoordinates } from './validation.js'
// Shared New Zealand autocomplete for addresses, localities and named places.
// Decimal GPS coordinates are resolved locally, without sending them to a provider.
const GEOCODER_URL = 'https://photon.komoot.io/api/'

// Regional bounds for directly entered/device coordinates, including Chatham Islands.
// Text results additionally require the provider's NZ country code.
export function isNewZealandCoordinate(point) {
  if (!hasCoordinates(point)) return false
  const { lat, lng } = point
  return (lat >= -48 && lat <= -34 && lng >= 166 && lng <= 180)
    || (lat >= -44.5 && lat <= -43.5 && lng >= -177.5 && lng <= -175.5)
}

export function parseCoordinates(query) {
  const match = query.trim().match(/^([+-]?\d+(?:\.\d+)?)\s*[,;]\s*([+-]?\d+(?:\.\d+)?)$/)
  if (!match) return null
  const point = { lat: Number(match[1]), lng: Number(match[2]) }
  if (!hasCoordinates(point)) return null
  const name = `${point.lat}, ${point.lng}`
  return { ...point, id: `gps:${name}`, name, label: name, context: 'GPS coordinates', region: '', isAddress: false }
}

export function formatPlace(feature) {
  const props = feature?.properties || {}
  const isAddress = Boolean(props.street) || ['street', 'house'].includes(props.type)
  const name = props.housenumber && props.street ? `${props.housenumber} ${props.street}` : props.name || props.street
  if (!name) return null

  const area = [
    props.city && props.city !== name ? props.city : null,
    props.district && props.district !== name ? props.district : null,
    props.state,
    props.postcode,
    props.country,
  ].filter(Boolean)
  const unique = [...new Set(area)].filter(part => part !== name)

  return {
    id: `${props.osm_type || 'x'}${props.osm_id || Math.random()}`,
    name,
    isAddress,
    // region es lo que se guarda en la columna region del anuncio.
    region: props.state || props.county || props.district || '',
    label: [name, ...unique].join(', '),
    context: unique.join(', '),
    lng: feature.geometry?.coordinates?.[0],
    lat: feature.geometry?.coordinates?.[1],
  }
}

export async function searchPlaces(query, signal) {
  const text = query.trim()
  if (!text) return []
  const coordinates = parseCoordinates(text)
  if (coordinates) return isNewZealandCoordinate(coordinates) ? [coordinates] : []
  // A malformed coordinate pair must not turn into an unrelated address result.
  if (/^[+\-\d.\s]+[,;][+\-\d.\s]+$/.test(text)) return []
  const url = `${GEOCODER_URL}?q=${encodeURIComponent(text)}&lang=en&limit=8&countrycode=NZ`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('geocoder error')
  const data = await response.json()

  return (data.features || [])
    .filter(feature => String(feature.properties?.countrycode || '').toUpperCase() === 'NZ')
    .map(formatPlace)
    .filter(hasCoordinates)
    .filter((place, index, all) => all.findIndex(other => other.label === place.label) === index)
    .slice(0, 6)
}
