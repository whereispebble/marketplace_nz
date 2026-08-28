// Autocompletado de ubicaciones reales via Photon (OpenStreetMap), el mismo
// proveedor de datos que el mapa. Se limita a Nueva Zelanda por bbox + pais.
// Lo usan tanto el filtro de busqueda como el formulario de publicacion, para
// que un anuncio se guarde con el mismo nombre de sitio por el que se busca.
const GEOCODER_URL = 'https://photon.komoot.io/api/'
const NZ_BBOX = '166.0,-47.6,179.6,-34.0'

const PLACE_TYPES = ['city', 'town', 'village', 'suburb', 'locality', 'region', 'state', 'district', 'county']

export function formatPlace(feature) {
  const props = feature?.properties || {}
  const name = props.name
  if (!name) return null

  const area = [
    props.city && props.city !== name ? props.city : null,
    props.district && props.district !== name ? props.district : null,
    props.state,
  ].filter(Boolean)
  const unique = [...new Set(area)].slice(0, 2)

  return {
    id: `${props.osm_type || 'x'}${props.osm_id || Math.random()}`,
    name,
    // region es lo que se guarda en la columna region del anuncio.
    region: props.state || props.county || props.district || '',
    label: [name, ...unique].join(', '),
    context: unique.join(', '),
    lng: feature.geometry?.coordinates?.[0],
    lat: feature.geometry?.coordinates?.[1],
  }
}

export async function searchPlaces(query, signal) {
  const url = `${GEOCODER_URL}?q=${encodeURIComponent(query)}&lang=en&limit=8&bbox=${NZ_BBOX}`
  const response = await fetch(url, { signal })
  if (!response.ok) throw new Error('geocoder error')
  const data = await response.json()

  return (data.features || [])
    .filter(feature => (feature.properties?.countrycode || 'NZ') === 'NZ')
    .filter(feature => PLACE_TYPES.includes(feature.properties?.type || 'city'))
    .map(formatPlace)
    .filter(Boolean)
    .filter((place, index, all) => all.findIndex(other => other.label === place.label) === index)
    .slice(0, 6)
}
