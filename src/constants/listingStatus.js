/**
 * Estados de un anuncio y como se muestran.
 *
 * Reglas de producto para los distintivos de la tarjeta:
 *   - Solo se etiqueta lo que deja de estar disponible (vendido, reservado).
 *     Un anuncio activo es el caso normal y no necesita cartel.
 *   - Salvo que sea recien publicado: durante la primera semana lleva "New",
 *     que es informacion util y caduca sola.
 *
 * Los identificadores son los mismos que guarda la columna products.status.
 */

/** Estados que puede tener un anuncio en la base de datos. */
export const LISTING_STATUS = {
  DRAFT: 'draft',
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  SOLD: 'sold',
}

/**
 * Estados visibles para cualquier visitante. Un borrador solo lo ve su dueno,
 * asi que no aparece aqui ni en las consultas publicas.
 */
export const PUBLIC_LISTING_STATUSES = [
  LISTING_STATUS.AVAILABLE,
  LISTING_STATUS.RESERVED,
  LISTING_STATUS.SOLD,
]

/**
 * Distintivo que se pinta sobre la tarjeta y en la ficha del anuncio.
 * Un estado que no este en esta tabla (available, draft o vacio) no pinta nada.
 */
export const STATUS_BADGES = {
  [LISTING_STATUS.SOLD]: { label: 'Sold', className: 'badge-sold' },
  [LISTING_STATUS.RESERVED]: { label: 'Booked', className: 'badge-booked' },
}

/** Un anuncio es "nuevo" durante su primera semana publicado. */
const NEW_LISTING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

/**
 * Indica si el anuncio se publico hace menos de una semana.
 *
 * Acepta los tres nombres con los que puede llegar la fecha: created_at desde
 * Supabase, y createdAt o publishedAt en datos de ejemplo o antiguos.
 *
 * @param {object} product anuncio
 * @returns {boolean} false tambien si no hay fecha o es ilegible
 */
export function isNewListing(product) {
  const raw = product?.created_at || product?.createdAt || product?.publishedAt
  if (!raw) return false

  const published = new Date(raw).getTime()
  if (Number.isNaN(published)) return false

  return Date.now() - published < NEW_LISTING_WINDOW_MS
}

/**
 * Distintivo que toca pintar en la tarjeta, o null si no toca ninguno.
 *
 * El estado manda sobre "New": ocupan la misma esquina y, si algo ya esta
 * vendido, saber eso importa mas que saber que se publico hace poco.
 *
 * @param {object} product anuncio con su campo status y su fecha de publicacion
 * @returns {{label: string, className: string} | null}
 */
export function listingBadge(product) {
  const statusBadge = STATUS_BADGES[product?.status]
  if (statusBadge) return statusBadge

  return isNewListing(product) ? { label: 'New', className: 'badge-new' } : null
}

/**
 * Solo el distintivo de estado, sin considerar si es reciente.
 * Lo usa la ficha del anuncio, donde "New" no aporta nada.
 *
 * @param {object} product anuncio con su campo status
 * @returns {{label: string, className: string} | null}
 */
export function listingStatusBadge(product) {
  return STATUS_BADGES[product?.status] || null
}
