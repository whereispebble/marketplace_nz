/** DEV data lives only in the current test session and never falls back to Supabase. */
import { DEV_USER, isDevSessionActive } from './devAuth'

// Cambios hechos sobre anuncios de prueba. sessionStorage hace que duren durante
// la pestaña actual, pero nunca llegan a Supabase ni a otros usuarios.
const DEV_LISTING_OVERRIDES_KEY = 'swapy:dev-listing-overrides'

function readDevListingOverrides() {
  try {
    return JSON.parse(sessionStorage.getItem(DEV_LISTING_OVERRIDES_KEY) || '{}')
  } catch {
    return {}
  }
}

function applyDevListingOverrides(vehicles) {
  const overrides = readDevListingOverrides()
  return vehicles
    .map(vehicle => ({ ...vehicle, ...(overrides[String(vehicle.id)] || {}) }))
    .filter(vehicle => !vehicle.deleted)
}

/** Guarda cambios de una ficha de prueba únicamente en la sesión actual. */
export function saveDevListing(id, changes) {
  if (!isDevSessionActive()) return
  try {
    const overrides = readDevListingOverrides()
    overrides[String(id)] = { ...(overrides[String(id)] || {}), ...changes }
    sessionStorage.setItem(DEV_LISTING_OVERRIDES_KEY, JSON.stringify(overrides))
  } catch {
    // Si el navegador bloquea el almacenamiento, la edición sigue visible en
    // la pantalla actual pero no se conservará al navegar.
  }
}

/**
 * Indica si ahora mismo corresponde usar datos de ejemplo.
 *
 * Es una funcion y no una constante porque la respuesta cambia durante la
 * ejecucion: depende de si la sesion de prueba esta activa.
 *
 * @returns {boolean}
 */
export function isMockDataEnabled() {
  return isDevSessionActive() && import.meta.env.VITE_USE_MOCK_DATA !== 'false'
}



/**
 * Carga los anuncios de ejemplo, o una lista vacia si no corresponde usarlos.
 * @returns {Promise<object[]>}
 */
export async function loadMockVehicles() {
  if (!import.meta.env.DEV || !isMockDataEnabled()) return []

  const { MOCK_VEHICLES } = await import('../data/mockVehicles')
  const vehicles = applyDevListingOverrides(MOCK_VEHICLES)
  const known = new Set(vehicles.map(vehicle => String(vehicle.id)))
  return [...vehicles, ...Object.entries(readDevListingOverrides()).filter(([id, value]) => !known.has(id) && !value.deleted).map(([id, value]) => ({ ...value, id }))]
}

/**
 * Busca un anuncio de ejemplo por su id.
 * Lo usa la ficha del anuncio cuando Supabase no encuentra nada, para poder
 * abrir un vehiculo de prueba desde la portada.
 *
 * @param {string|number} id
 * @returns {Promise<object|null>} null si no se usan datos de ejemplo
 */
export async function findMockVehicle(id) {
  const vehicles = await loadMockVehicles()
  return vehicles.find(vehicle => String(vehicle.id) === String(id)) || null
}

/** Choose exactly one data source; never concatenate real and test listings. */
export async function withMockVehicles(products = []) {
  const realProducts = products.filter(Boolean)
  if (!isMockDataEnabled()) return realProducts

  return loadMockVehicles()
}

/**
 * Anuncios de ejemplo atribuidos al usuario de prueba, para ver la pestana de
 * "Listings" con contenido y probar los estados vendido y reservado.
 *
 * @returns {Promise<object[]>} lista vacia si no hay sesion de prueba
 */
export async function loadDevListings() {
  const vehicles = await loadMockVehicles()
  const overrides = readDevListingOverrides()

  return vehicles.filter((vehicle, index) => index < 4 || vehicle.user_id === DEV_USER.id).map((vehicle, index) => ({
    ...vehicle,
    user_id: DEV_USER.id,
    status: index === 3 ? 'sold' : index === 2 ? 'reserved' : 'available',
    ...(overrides[String(vehicle.id)] || {}),
  }))
}

/** Obtiene uno de los anuncios propios de la sesión de prueba para editarlo. */
export async function findDevListing(id) {
  const listings = await loadDevListings()
  return listings.find(listing => String(listing.id) === String(id)) || null
}
