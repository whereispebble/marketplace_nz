import { MOCK_VEHICLES } from '../data/mockVehicles'
import { supabase } from './supabase'

const FAVORITES_STORAGE_KEY = 'swapy:favorites'
export const FAVORITES_UPDATED_EVENT = 'swapy:favorites-updated'

function favoriteId(productOrId) {
  return String(productOrId?.id ?? productOrId ?? '')
}

function normaliseLocalFavorites(rawFavorites) {
  return rawFavorites
    .map(item => {
      if (typeof item === 'string' || typeof item === 'number') {
        const product = getMockProductById(item)
        return { id: String(item), product: product ? productSnapshot(product) : null }
      }

      const product = item.product || item.product_snapshot || item
      return { id: favoriteId(product || item.id), product: product?.id ? productSnapshot(product) : null }
    })
    .filter(item => item.id)
}

function readLocalFavorites() {
  try {
    return normaliseLocalFavorites(JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]'))
  } catch {
    return []
  }
}

function readLocalFavoriteIds() {
  return readLocalFavorites().map(favorite => favorite.id)
}

function writeLocalFavorites(favorites) {
  const byId = new Map()
  normaliseLocalFavorites(favorites).forEach(favorite => {
    byId.set(favorite.id, favorite)
  })

  localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify([...byId.values()]))
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT))
}

function saveLocalFavorite(product) {
  writeLocalFavorites([...readLocalFavorites(), { id: favoriteId(product), product: productSnapshot(product) }])
}

function removeLocalFavorite(productId) {
  writeLocalFavorites(readLocalFavorites().filter(favorite => favorite.id !== String(productId)))
}

function getMockProductById(id) {
  return MOCK_VEHICLES.find(vehicle => String(vehicle.id) === String(id))
}

function productSnapshot(product) {
  return {
    id: product.id,
    title: product.title,
    make: product.make,
    model: product.model,
    vehicleType: product.vehicleType,
    category: product.category,
    price: product.price,
    mileage: product.mileage,
    condition: product.condition,
    wof: product.wof,
    wofExpiry: product.wofExpiry,
    sleeps: product.sleeps,
    belts: product.belts,
    selfContained: product.selfContained,
    location: product.location,
    region: product.region,
    lat: product.lat,
    lng: product.lng,
    image: product.image,
    images: product.images,
    description: product.description,
    seller: product.seller,
    seller_id: product.seller_id,
  }
}

async function getCurrentUser() {
  const { data } = await supabase.auth.getUser()
  return data?.user || null
}

async function fetchRemoteFavorite(productId, userId) {
  const { data, error } = await supabase
    .from('favorites')
    .select('product_id')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (error) return null
  return data
}

async function saveRemoteFavorite(product, userId) {
  const payload = {
    user_id: userId,
    product_id: favoriteId(product),
    product_snapshot: productSnapshot(product),
  }

  const { error } = await supabase.from('favorites').upsert(payload, { onConflict: 'user_id,product_id' })
  if (!error) return true

  const fallback = await supabase
    .from('favorites')
    .upsert({ user_id: userId, product_id: favoriteId(product) }, { onConflict: 'user_id,product_id' })

  return !fallback.error
}

async function removeRemoteFavorite(productId, userId) {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  return !error
}

export async function isFavorite(productOrId) {
  const productId = favoriteId(productOrId)
  if (!productId) return false

  const localIds = readLocalFavoriteIds()
  if (localIds.includes(productId)) return true

  const user = await getCurrentUser()
  if (!user) return false

  const remoteFavorite = await fetchRemoteFavorite(productId, user.id)
  return Boolean(remoteFavorite)
}

export async function toggleFavorite(product) {
  const productId = favoriteId(product)
  if (!productId) return false

  const localIds = readLocalFavoriteIds()
  const isLocalFavorite = localIds.includes(productId)
  const user = await getCurrentUser()
  const remoteFavorite = user ? await fetchRemoteFavorite(productId, user.id) : null
  const shouldRemove = isLocalFavorite || Boolean(remoteFavorite)

  if (shouldRemove) {
    removeLocalFavorite(productId)
    if (user) await removeRemoteFavorite(productId, user.id)
    return false
  }

  saveLocalFavorite(product)
  if (user) {
    await saveRemoteFavorite(product, user.id)
  }
  return true
}

export async function getFavoriteProducts() {
  const localProducts = readLocalFavorites()
    .map(favorite => favorite.product || getMockProductById(favorite.id))
    .filter(Boolean)
  const user = await getCurrentUser()

  if (!user) return localProducts

  const snapshotResponse = await supabase
    .from('favorites')
    .select('product_id, product_snapshot')
    .eq('user_id', user.id)

  let remoteProducts
  if (!snapshotResponse.error && snapshotResponse.data) {
    remoteProducts = snapshotResponse.data
      .map(favorite => favorite.product_snapshot || getMockProductById(favorite.product_id))
      .filter(Boolean)
  } else {
    const legacyResponse = await supabase
      .from('favorites')
      .select('product_id, products(*)')
      .eq('user_id', user.id)

    remoteProducts = (legacyResponse.data || [])
      .map(favorite => favorite.products || getMockProductById(favorite.product_id))
      .filter(Boolean)
  }

  const byId = new Map()
  ;[...remoteProducts, ...localProducts].forEach(product => {
    byId.set(String(product.id), product)
  })

  return [...byId.values()]
}
