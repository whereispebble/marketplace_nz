/**
 * Datos de ejemplo: cuando se usan y como se cargan.
 *
 * Regla: los anuncios de prueba pertenecen a la SESION DE PRUEBA, no al modo
 * desarrollo en general. Es decir:
 *
 *   - Sesion de prueba activa  -> se ven los anuncios de ejemplo.
 *   - Cuenta real (o sin sesion) -> solo lo que haya en Supabase, aunque este
 *     vacio. Una portada vacia es informacion correcta; una portada llena de
 *     vehiculos que no existen es una mentira.
 *
 * Asi se puede trabajar contra la base de datos real y contra los datos de
 * prueba en la misma sesion del navegador, cambiando con el panel DEV.
 *
 * ---------------------------------------------------------------------------
 * DISPONIBILIDAD EN EL DESPLIEGUE
 * ---------------------------------------------------------------------------
 * Los datos se cargan tambien en Vercel, pero exclusivamente despues de
 * activar la sesion de prueba. Define VITE_DEV_LOGIN=false para ocultar por
 * completo este modo en cualquier entorno.
 *
 * La carga es dinamica para que los datos no se descarguen hasta que hagan
 * falta.
 */

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
  return vehicles.map(vehicle => ({ ...vehicle, ...(overrides[String(vehicle.id)] || {}) }))
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
  if (!isMockDataEnabled()) return []

  const { MOCK_VEHICLES } = await import('../data/mockVehicles')
  return applyDevListingOverrides(MOCK_VEHICLES)
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

/**
 * Mezcla los anuncios reales con los de ejemplo sin repetir ninguno.
 *
 * Los reales van primero y mandan: si un anuncio de ejemplo comparte id con uno
 * real, se descarta el de ejemplo. Sin sesion de prueba devuelve la lista real
 * tal cual, sin tocar nada.
 *
 * @param {object[]} products anuncios que vienen de Supabase
 * @returns {Promise<object[]>}
 */
export async function withMockVehicles(products = []) {
  const realProducts = products.filter(Boolean)
  if (!isMockDataEnabled()) return realProducts

  const mockVehicles = await loadMockVehicles()
  const realIds = new Set(realProducts.map(product => String(product.id)))

  return [...realProducts, ...mockVehicles.filter(vehicle => !realIds.has(String(vehicle.id)))]
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

  return vehicles.slice(0, 4).map((vehicle, index) => ({
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
