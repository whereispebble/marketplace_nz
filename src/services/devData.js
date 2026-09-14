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
 * POR QUE NO LLEGAN AL PAQUETE DE PRODUCCION
 * ---------------------------------------------------------------------------
 * isDevSessionActive() devuelve false de inmediato cuando DEV_LOGIN_ENABLED es
 * false, y esa constante se apoya en import.meta.env.DEV, que vale false en
 * `npm run build`. El empaquetador lo resuelve en tiempo de compilacion y
 * elimina la rama, incluido el import dinamico de data/mockVehicles.js.
 *
 * Por eso la carga es con import() y no con un import normal arriba: un import
 * estatico se incluiria siempre, aunque nunca se ejecutara, y se llevaria 27 KB
 * de datos falsos al paquete final. Comprobado empaquetando: en produccion el
 * punto de entrada no referencia ese fichero en ningun sitio.
 */

import { DEV_USER, isDevSessionActive } from './devAuth'

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
  // Corte en tiempo de compilacion. isMockDataEnabled() se decide durante la
  // ejecucion (depende de la sesion de prueba), asi que el empaquetador no
  // puede demostrar por si solo que lo de abajo sea inalcanzable. Esta linea si
  // la resuelve: import.meta.env.DEV se sustituye por false al compilar, todo
  // lo que sigue queda muerto y se elimina, incluido el import dinamico.
  // Escrita asi, literal y en el propio if, y no a traves de una constante
  // intermedia: algunos empaquetadores no propagan la constante y se dejarian
  // el import dentro. En desarrollo manda isMockDataEnabled().
  if (!import.meta.env.DEV) return []
  if (!isMockDataEnabled()) return []

  const { MOCK_VEHICLES } = await import('../data/mockVehicles')
  return MOCK_VEHICLES
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
  if (!import.meta.env.DEV || !isMockDataEnabled()) return realProducts

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

  return vehicles.slice(0, 4).map((vehicle, index) => ({
    ...vehicle,
    user_id: DEV_USER.id,
    status: index === 3 ? 'sold' : index === 2 ? 'reserved' : 'available',
  }))
}
