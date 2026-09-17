/**
 * Favoritos (vehiculos guardados).
 *
 * Regla de privacidad: los favoritos de una cuenta viven SOLO en Supabase, con
 * RLS que los limita a su dueno. localStorage se usa unicamente para visitantes
 * sin sesion, y esa copia se borra en cuanto alguien inicia o cierra sesion.
 *
 * El motivo es un fallo real que tenia la version anterior: guardaba todo bajo
 * una unica clave "swapy:favorites" del navegador y la leia siempre, tuviera o
 * no sesion. Resultado: en un ordenador compartido, o despues de cerrar sesion,
 * el siguiente usuario veia los guardados del anterior.
 */

import { supabase } from './supabase'
import { isDevSessionActive } from './devAuth'
import { isUuid } from './validation'

/** Clave del navegador para los guardados de un visitante sin cuenta. */
const GUEST_FAVORITES_KEY = 'swapy:favorites:guest:v2'
function localFavorites() {
  return isDevSessionActive()
    ? { storage: sessionStorage, key: 'swapy:favorites:dev' }
    : { storage: localStorage, key: GUEST_FAVORITES_KEY }
}

/** Evento que emiten estas funciones para que la interfaz se refresque. */
export const FAVORITES_UPDATED_EVENT = 'swapy:favorites-updated'

/**
 * Normaliza el identificador de un anuncio, venga el objeto entero o solo el id.
 * @param {object|string|number} productOrId
 * @returns {string} id como texto, o cadena vacia si no hay
 */
function favoriteId(productOrId) {
  return String(productOrId?.id ?? productOrId ?? '')
}

/**
 * Copia reducida del anuncio que se guarda junto al favorito.
 * Permite pintar la tarjeta sin volver a consultar el anuncio, y que el
 * guardado siga teniendo sentido aunque el vendedor lo borre despues.
 * @param {object} product anuncio completo
 * @returns {object} solo los campos que necesita la tarjeta
 */
function productSnapshot(product) {
  return {
    id: product.id,
    title: product.title,
    make: product.make,
    model: product.model,
    vehicleType: product.vehicleType,
    price: product.price,
    mileage: product.mileage,
    sleeps: product.sleeps,
    wofExpiry: product.wofExpiry,
    location: product.location,
    region: product.region,
    image: product.image,
    status: product.status,
  }
}

/** Avisa a la interfaz de que la lista de guardados ha cambiado. */
function notifyChange() {
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT))
}

/**
 * Usuario autenticado, o null si la visita es anonima.
 * @returns {Promise<object|null>}
 */
async function getCurrentUser() {
  // La sesion de prueba de desarrollo no tiene token: para los guardados se
  // trata como visita anonima y se usa la copia local del navegador.
  if (isDevSessionActive()) return null

  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

/**
 * Guardados del visitante anonimo. Nunca se mezclan con los de una cuenta.
 * @returns {object[]} copias reducidas de anuncios
 */
function readGuestFavorites() {
  try {
    const { storage, key } = localFavorites()
    const parsed = JSON.parse(storage.getItem(key) || '[]')
    return Array.isArray(parsed) ? parsed.filter(item => item?.id) : []
  } catch {
    // localStorage bloqueado o contenido corrupto: se trata como lista vacia.
    return []
  }
}

/**
 * Reescribe la lista del visitante anonimo sin duplicados.
 * @param {object[]} favorites copias reducidas de anuncios
 */
function writeGuestFavorites(favorites) {
  try {
    const byId = new Map(favorites.map(product => [String(product.id), product]))
    const { storage, key } = localFavorites()
    storage.setItem(key, JSON.stringify([...byId.values()]))
  } catch {
    // Sin almacenamiento disponible se pierde la lista, pero la app sigue.
  }
  notifyChange()
}

/**
 * Borra la copia local. Se llama al iniciar y al cerrar sesion para que los
 * guardados de una persona no sobrevivan en el navegador de otra.
 */
export function clearGuestFavorites() {
  try {
    localStorage.removeItem(GUEST_FAVORITES_KEY)
  } catch {
    // Nada que hacer si el navegador no deja tocar el almacenamiento.
  }
  notifyChange()
}

/**
 * Pasa los guardados del visitante anonimo a su cuenta recien iniciada y vacia
 * la copia local. Se llama una sola vez, justo despues del login.
 * @param {string} userId id del usuario autenticado
 */
export async function mergeGuestFavoritesIntoAccount(userId) {
  if (isDevSessionActive() || !isUuid(userId)) return
  const guestFavorites = readGuestFavorites().filter(product => isUuid(product.id))
  if (guestFavorites.length === 0) {
    clearGuestFavorites()
    return
  }

  const { error } = await supabase.from('favorites').upsert(
    guestFavorites.map(product => ({
      user_id: userId,
      product_id: String(product.id),
      product_snapshot: product,
    })),
    { onConflict: 'user_id,product_id' },
  )

  if (!error) clearGuestFavorites()
}

/**
 * Indica si un anuncio esta guardado por quien esta mirando ahora mismo.
 * @param {object|string|number} productOrId
 * @returns {Promise<boolean>}
 */
export async function isFavorite(productOrId) {
  const productId = favoriteId(productOrId)
  if (!productId) return false

  const user = await getCurrentUser()

  // Sin sesion, la unica fuente es la copia local del navegador.
  if (!user) {
    return readGuestFavorites().some(product => String(product.id) === productId)
  }

  // Con sesion manda la base de datos. La politica RLS ya limita la consulta a
  // las filas del propio usuario; el filtro por user_id es defensa en capas.
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle()

  return !error && Boolean(data)
}

/**
 * Guarda o quita un anuncio de la lista, segun como este ahora.
 * @param {object} product anuncio completo
 * @returns {Promise<boolean>} true si queda guardado, false si se ha quitado
 */
export async function toggleFavorite(product) {
  const productId = favoriteId(product)
  if (!productId) return false

  const user = await getCurrentUser()

  if (!user) {
    const guestFavorites = readGuestFavorites()
    const alreadySaved = guestFavorites.some(item => String(item.id) === productId)

    writeGuestFavorites(
      alreadySaved
        ? guestFavorites.filter(item => String(item.id) !== productId)
        : [...guestFavorites, productSnapshot(product)],
    )
    return !alreadySaved
  }

  const saved = await isFavorite(productId)

  if (saved) {
    const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId)
    if (error) throw new Error('Could not update saved vehicles. Please try again.')
    notifyChange()
    return false
  }

  const { error } = await supabase.from('favorites').upsert(
    { user_id: user.id, product_id: productId, product_snapshot: productSnapshot(product) },
    { onConflict: 'user_id,product_id' },
  )
  if (error) throw new Error('Could not save this vehicle. Please try again.')
  notifyChange()
  return true
}

/**
 * Lista completa de anuncios guardados de quien esta mirando.
 * Con sesion devuelve los de su cuenta; sin sesion, los del navegador.
 * Nunca mezcla ambos, que era justo el origen de la fuga anterior.
 * @returns {Promise<object[]>}
 */
export async function getFavoriteProducts() {
  const user = await getCurrentUser()
  if (!user) return readGuestFavorites()

  const { data, error } = await supabase
    .from('favorites')
    .select('product_id, product_snapshot')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw new Error('Could not load saved vehicles.')
  if (!data) return []

  const ids = data.map(favorite => favorite.product_id).filter(isUuid)
  if (!ids.length) return []
  const { data: products, error: productsError } = await supabase.from('products').select('*').in('id', ids)
  if (productsError) throw new Error('Could not load saved vehicles.')
  const byId = new Map((products || []).map(product => [product.id, product]))
  return ids.map(id => byId.get(id)).filter(Boolean)
}
