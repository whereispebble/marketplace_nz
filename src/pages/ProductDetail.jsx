/**
 * Ficha de un anuncio.
 *
 * Muestra las fotos con visor a pantalla completa, la ficha tecnica, los avisos
 * de WOF y rego, y los datos del vendedor. Si el anuncio no esta en Supabase
 * (por ejemplo uno de ejemplo) cae en los datos locales.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiEdit3, FiEye, FiHeart, FiMapPin, FiMaximize2, FiMessageCircle, FiSearch, FiShield, FiStar, FiUsers, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingScreen from '../components/LoadingScreen'
import { VEHICLE_TYPES } from '../data/nzVehicleCatalog'
import { findMockVehicle, loadMockVehicles } from '../services/devData'
import { FAVORITES_UPDATED_EVENT, isFavorite, toggleFavorite } from '../services/favorites'
import { LISTING_STATUS, listingStatusBadge } from '../constants/listingStatus'
import { useSession } from '../services/session'
import { isDevSessionActive } from '../services/devAuth'
import { isUuid } from '../services/validation'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useSession()
  // El anuncio empieza vacio: se pinta cuando llega el de la base de datos.
  const [product, setProduct] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  // Los anuncios reales usan user_id como propietario. seller_id solo existe
  // en algunos datos antiguos/mock.
  const sellerId = product?.user_id || product?.seller_id || product?.seller?.id || 'seller'
  const sellerName = product?.seller?.name || 'Private seller'
  const isOwner = Boolean(user?.id && product?.user_id && String(user.id) === String(product.user_id))

  useEffect(() => {
    let ignore = false

    async function loadProduct() {
      setLoading(true)
      setProduct(null)
      setNotFound(false)
      setSelectedImage(0)
      setLightboxOpen(false)
      const devMode = isDevSessionActive()
      if (!devMode && !isUuid(id)) { setNotFound(true); setLoading(false); return }
      const { data, error } = devMode
        ? { data: null, error: null }
        : await supabase.from('products').select('*').eq('id', id).maybeSingle()

      if (ignore) return

      if (!error && data) {
        const ownerId = data.user_id || data.seller_id
        const { data: seller } = await supabase.from('public_profiles')
          .select('id, username, avatar_url, rating, total_sales, joined')
          .eq('id', ownerId).maybeSingle()
        if (ignore) return
        setProduct({ ...data, seller: seller ? {
          id: seller.id, name: seller.username || 'Private seller', avatar_url: seller.avatar_url,
          rating: seller.rating, sales: seller.total_sales, joined: seller.joined,
        } : null })
        setLoading(false)
        return
      }

      // En desarrollo se puede abrir un anuncio de ejemplo; en produccion, si
      // no esta en la base de datos es que no existe o no se puede ver.
      const mockVehicle = devMode ? await findMockVehicle(id) : null
      if (ignore) return

      if (mockVehicle) setProduct(mockVehicle)
      else setNotFound(true)
      setLoading(false)
    }

    loadProduct().catch(() => { if (!ignore) { setNotFound(true); setLoading(false) } })
    return () => { ignore = true }
  }, [id])

  useEffect(() => {
    if (!product) return undefined
    let ignore = false

    async function loadRelatedProducts() {
      const candidates = isDevSessionActive()
        ? await loadMockVehicles()
        : (await supabase
          .from('products')
          .select('*')
          .eq('status', LISTING_STATUS.AVAILABLE)
          .neq('id', product.id)
          .limit(80)).data || []

      if (ignore) return
      setRelatedProducts(rankRelatedProducts(product, candidates))
    }

    loadRelatedProducts().catch(() => { if (!ignore) setRelatedProducts([]) })
    return () => { ignore = true }
  }, [product])

  useEffect(() => {
    let ignore = false

    async function loadFavoriteState() {
      if (!product) return
      const saved = await isFavorite(product)
      if (!ignore) setLiked(saved)
    }

    loadFavoriteState()
    window.addEventListener(FAVORITES_UPDATED_EVENT, loadFavoriteState)

    return () => {
      ignore = true
      window.removeEventListener(FAVORITES_UPDATED_EVENT, loadFavoriteState)
    }
  }, [product])

  // Derecha: solo lo esencial. Debajo de la descripcion: etiquetas cortas con
  // los rasgos del vehiculo y la ficha tecnica completa agrupada por bloques.
  // La localizacion va aparte, fuera de los cuadraditos.
  const essentialSpecs = useMemo(() => cleanSpecs([
    { label: 'Year', value: product?.year },
    { label: 'Mileage', value: numberWithUnit(product?.mileage, 'km') },
    { label: 'Vehicle type', value: vehicleTypeName(product?.vehicleType) },
    { label: 'Sleeps', value: product?.sleeps, icon: <FiUsers /> },
    { label: 'Transmission', value: product?.transmission },
    { label: 'Self-contained', value: product?.selfContained ? 'Yes' : 'No', icon: <FiShield /> },
  ]), [product])

  const highlights = useMemo(() => ([
    vehicleTypeName(product?.vehicleType),
    product?.condition,
    product?.fuel,
    product?.transmission,
    product?.drivetrain,
    product?.layout,
    TOILET_LABELS[product?.toiletType],
    product?.selfContained ? 'Self-contained' : '',
    Number(product?.solarW) > 0 ? 'Solar' : '',
  ].filter(Boolean)), [product])

  const specGroups = useMemo(() => ([
    {
      title: 'Vehicle',
      rows: cleanSpecs([
        { label: 'Make', value: product?.make },
        { label: 'Model', value: product?.model },
        { label: 'Year', value: product?.year },
        { label: 'Mileage', value: numberWithUnit(product?.mileage, 'km') },
        { label: 'Condition', value: product?.condition },
        { label: 'Transmission', value: product?.transmission },
        { label: 'Fuel', value: product?.fuel },
        { label: 'Drivetrain', value: product?.drivetrain },
        { label: 'Engine', value: numberWithUnit(product?.engineCc, 'cc') },
        { label: 'Seats', value: product?.seats },
        { label: 'Doors', value: product?.doors },
      ]),
    },
    {
      title: 'New Zealand paperwork',
      rows: cleanSpecs([
        { label: 'WOF expiry', value: formatDate(product?.wofExpiry), status: expiryStatus(product?.wofExpiry) },
        { label: 'Rego expiry', value: formatDate(product?.regoExpiry), status: expiryStatus(product?.regoExpiry) },
      ]),
    },
    {
      title: 'Camper layout',
      rows: cleanSpecs([
        { label: 'Sleeps', value: product?.sleeps },
        { label: 'Seat belts', value: product?.belts },
        { label: 'Layout', value: product?.layout },
        { label: 'Length', value: numberWithUnit(product?.lengthM, 'm') },
        { label: 'Weight', value: numberWithUnit(product?.weightKg, 'kg') },
      ]),
    },
    {
      title: 'Off-grid and self-containment',
      rows: cleanSpecs([
        { label: 'Fresh water', value: numberWithUnit(product?.freshWaterL, 'L') },
        { label: 'Grey water', value: numberWithUnit(product?.greyWaterL, 'L') },
        { label: 'Battery', value: numberWithUnit(product?.batteryAh, 'Ah') },
        { label: 'Solar', value: numberWithUnit(product?.solarW, 'W') },
        { label: 'Toilet', value: TOILET_LABELS[product?.toiletType] },
        { label: 'Self-contained', value: product?.selfContained ? 'Yes' : 'No' },
        { label: 'Self-contained expiry', value: formatDate(product?.scExpiry), status: expiryStatus(product?.scExpiry) },
      ]),
    },
  ].filter(group => group.rows.length > 0)), [product])

  // Distintivo de estado: null mientras el anuncio siga disponible.
  const statusBadge = listingStatusBadge(product)

  // Si el anuncio no trae fotos se usa un marcador, para no romper el visor.
  const images = useMemo(() => {
    if (product?.images?.length) return product.images
    if (product?.image) return [product.image]
    return ['https://placehold.co/640x480/f1ede5/171717?text=Swapy']
  }, [product])

  // Las flechas dan la vuelta al llegar al final para que no haya callejon sin
  // salida en una galeria de dos o tres fotos.
  const showImage = step => setSelectedImage(current => (current + step + images.length) % images.length)

  if (loading) {
    return <LoadingScreen fullPage label="Loading vehicle" />
  }

  // Anuncio inexistente, borrado, o que este visitante no puede ver. Se dice
  // claramente en vez de pintar una ficha a medias.
  if (notFound || !product) {
    return (
      <div className="app-shell">
        <Navbar compact />
        <main className="container page-section">
          <div className="empty-state panel">
            <div>
              <FiSearch size={42} />
              <h2>This listing is no longer available</h2>
              <p>It may have been sold or removed by the seller.</p>
              <Link to="/" className="btn btn-primary">Browse vehicles</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section">
        <div className="muted-row" style={{ marginBottom: 18 }}>
          <Link to="/" style={{ color: 'var(--accent)', fontWeight: 900, textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span>{product.vehicleType || 'Vehicle'}</span>
        </div>

        {favoriteError && <p role="alert">{favoriteError}</p>}
        <section className="detail-grid">
          <div>
            <button
              className="media-viewer media-viewer-button"
              type="button"
              aria-label="Open photo full screen"
              onClick={() => setLightboxOpen(true)}
            >
              <img src={images[selectedImage]} alt={product.title} />
              <span className="media-viewer-zoom" aria-hidden="true"><FiMaximize2 /></span>
              {images.length > 1 && (
                <span className="media-viewer-count">{selectedImage + 1} / {images.length}</span>
              )}
            </button>
            {images.length > 1 && (
              <div className="thumb-row">
                {images.map((image, index) => (
                  <button
                    className={`thumb ${selectedImage === index ? 'is-active' : ''}`}
                    key={image}
                    type="button"
                    aria-label={`Show vehicle photo ${index + 1}`}
                    aria-pressed={selectedImage === index}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
            )}

            <article className="panel panel-pad" style={{ marginTop: 18 }}>
              <h2 className="section-title" style={{ fontSize: '1.35rem' }}>Description</h2>
              <p className="section-subtitle">{product.description || 'The seller has not added a description yet.'}</p>
              {highlights.length > 0 && (
                <div className="spec-tag-row">
                  {highlights.map(item => <span className="spec-tag" key={item}>{item}</span>)}
                </div>
              )}
            </article>

            {specGroups.length > 0 && (
              <article className="panel panel-pad" style={{ marginTop: 18 }}>
                <h2 className="section-title" style={{ fontSize: '1.35rem' }}>Vehicle details</h2>
                <div className="spec-sheet">
                  {specGroups.map(group => (
                    <div className="spec-sheet-group" key={group.title}>
                      <h3>{group.title}</h3>
                      <dl>
                        {group.rows.map(row => (
                          <div className="spec-sheet-row" key={row.label}>
                            <dt>{row.label}</dt>
                            <dd>
                              {row.value}
                              {row.status && <em className={`spec-flag spec-flag-${row.status.tone}`}>{row.status.label}</em>}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  ))}
                </div>
              </article>
            )}
          </div>

          <aside className="sidebar-stack detail-sidebar">
            <section className="panel panel-pad">
              {statusBadge && (
                <div className="detail-status-row">
                  <span className={`badge ${statusBadge.className}`}>{statusBadge.label}</span>
                </div>
              )}
              <h1 className="page-title">{product.title}</h1>
              <p className="product-price" style={{ fontSize: '2.4rem', marginTop: 16 }}>
                NZ${Number(product.price || 0).toLocaleString('en-NZ')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '16px 0 22px' }}>
                <span className="muted-row"><FiMapPin />{product.location || 'Location pending'}</span>
                <span className="muted-row"><FiEye />{product.views || 0} views</span>
              </div>

              <div className="vehicle-spec-grid">
                {essentialSpecs.map(spec => (
                  <Spec key={spec.label} label={spec.label} value={spec.value} icon={spec.icon} />
                ))}
              </div>

              {isOwner ? (
                <Link className="btn btn-primary btn-full" to={`/product/${product.id}/edit`} style={{ marginTop: 18 }}>
                  <FiEdit3 />
                  Manage listing
                </Link>
              ) : <Link className="btn btn-primary btn-full" to={`/chats?productId=${encodeURIComponent(product.id)}&sellerId=${encodeURIComponent(sellerId)}`} style={{ marginTop: 18 }} aria-label={`Contact ${sellerName} about ${product.title}`}>
                <FiMessageCircle />
                Contact seller
              </Link>}
              {!isOwner && <button
                className="btn btn-secondary btn-full"
                type="button"
                disabled={savingFavorite}
                style={{ marginTop: 10 }}
                aria-pressed={liked}
                aria-label={liked ? `Remove ${product.title} from saved vehicles` : `Save ${product.title}`}
                onClick={async () => {
                  setSavingFavorite(true)
                  try {
                    setFavoriteError('')
                    setLiked(await toggleFavorite(product))
                  } catch {
                    setFavoriteError('Could not update saved vehicles. Please try again.')
                  } finally { setSavingFavorite(false) }
                }}
              >
                <FiHeart fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Saved' : 'Save vehicle'}
              </button>}
            </section>

            <section className="panel panel-pad">
              <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 16 }}>Seller</h2>
              <Link className="seller-row seller-link" to={`/profile/${sellerId}`} aria-label={`View ${sellerName} profile`}>
                <div className="avatar">
                  {product.seller?.avatar_url
                    ? <img src={product.seller.avatar_url} alt={`${sellerName} profile`} />
                    : (sellerName?.[0] || 'U')}
                </div>
                <div>
                  <strong>{sellerName}</strong>
                  <span className="muted-row" style={{ display: 'flex', marginTop: 4 }}><FiStar />{product.seller?.rating || 'New seller'} rating</span>
                </div>
              </Link>
              <div className="stats-grid" style={{ marginTop: 16 }}>
                <div className="stat-box"><strong>{product.seller?.sales || 0}</strong><span>Sales</span></div>
                <div className="stat-box"><strong>{product.seller?.rating || '-'}</strong><span>Rating</span></div>
                <div className="stat-box"><strong>{product.seller?.joined || '-'}</strong><span>Joined</span></div>
              </div>
            </section>

            {relatedProducts.length > 0 && (
              <section className="panel panel-pad related-listings">
                <h2 className="section-title" style={{ fontSize: '1.2rem' }}>Related listings</h2>
                <div className="related-listings-list">
                  {relatedProducts.map(item => (
                    <Link className="related-listing" to={`/product/${item.id}`} key={item.id}>
                      <img src={item.image || item.images?.[0] || 'https://placehold.co/240x180/f1ede5/171717?text=Swapy'} alt="" />
                      <span className="related-listing-copy">
                        <strong>{item.title}</strong>
                        <span>{vehicleTypeName(item.vehicleType)}{item.model ? ` · ${item.model}` : ''}</span>
                        <b>NZ${Number(item.price || 0).toLocaleString('en-NZ')}</b>
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="panel panel-pad">
              <span className="muted-row" style={{ alignItems: 'flex-start' }}>
                <FiShield style={{ marginTop: 3, color: 'var(--mint)' }} />
                Check WOF, service history, self-contained certification and ownership documents before paying a deposit.
              </span>
            </section>
          </aside>
        </section>
      </main>

      {lightboxOpen && (
        <Lightbox
          images={images}
          index={selectedImage}
          title={product.title}
          onClose={() => setLightboxOpen(false)}
          onStep={showImage}
          onSelect={setSelectedImage}
        />
      )}

      <Footer />
    </div>
  )
}

// Visor a pantalla completa: flechas a los lados, teclado, deslizar en movil y
// bloqueo del scroll de la pagina de detras mientras esta abierto.
function Lightbox({ images, index, title, onClose, onStep, onSelect }) {
  const touchStartX = useRef(null)
  const hasMany = images.length > 1

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') onClose()
      if (!hasMany) return
      if (event.key === 'ArrowRight') onStep(1)
      if (event.key === 'ArrowLeft') onStep(-1)
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [hasMany, onClose, onStep])

  const handleTouchStart = event => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = event => {
    if (touchStartX.current === null || !hasMany) return
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    // Menos de 45 px es un toque, no un deslizamiento.
    if (Math.abs(delta) > 45) onStep(delta < 0 ? 1 : -1)
    touchStartX.current = null
  }

  return (
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} photos`}
      onClick={onClose}
    >
      <button className="lightbox-close" type="button" aria-label="Close photos" onClick={onClose}>
        <FiX />
      </button>

      {hasMany && (
        <button
          className="lightbox-arrow lightbox-arrow-prev"
          type="button"
          aria-label="Previous photo"
          onClick={event => { event.stopPropagation(); onStep(-1) }}
        >
          <FiChevronLeft />
        </button>
      )}

      <figure
        className="lightbox-figure"
        onClick={event => event.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img src={images[index]} alt={`${title}, photo ${index + 1} of ${images.length}`} />
        {hasMany && <figcaption>{index + 1} / {images.length}</figcaption>}
      </figure>

      {hasMany && (
        <button
          className="lightbox-arrow lightbox-arrow-next"
          type="button"
          aria-label="Next photo"
          onClick={event => { event.stopPropagation(); onStep(1) }}
        >
          <FiChevronRight />
        </button>
      )}

      {hasMany && (
        <div className="lightbox-thumbs" onClick={event => event.stopPropagation()}>
          {images.map((image, position) => (
            <button
              className={`lightbox-thumb ${position === index ? 'is-active' : ''}`}
              key={`${image}-${position}`}
              type="button"
              aria-label={`Show photo ${position + 1}`}
              aria-pressed={position === index}
              onClick={() => onSelect(position)}
            >
              <img src={image} alt="" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Spec({ label, value, icon }) {
  return (
    <div className="vehicle-spec">
      <span>{icon}{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

const TOILET_LABELS = {
  none: 'No toilet',
  portable: 'Portable toilet',
  fixed: 'Fixed toilet',
}

const CAMPERISED_TYPES = new Set(['campervan', 'motorhome', 'van', 'car-camper'])

function normaliseComparison(value) {
  return String(value || '').trim().toLocaleLowerCase('en-NZ')
}

function comparableModel(vehicle) {
  const model = normaliseComparison(vehicle?.model)
  const make = normaliseComparison(vehicle?.make)
  return make && model.startsWith(`${make} `) ? model.slice(make.length + 1) : model
}

function relatedScore(source, candidate) {
  let score = 0
  if (normaliseComparison(candidate.vehicleType) === normaliseComparison(source.vehicleType)) score += 100
  if (CAMPERISED_TYPES.has(candidate.vehicleType) === CAMPERISED_TYPES.has(source.vehicleType)) score += 40
  if (comparableModel(candidate) && comparableModel(candidate) === comparableModel(source)) score += 25
  if (normaliseComparison(candidate.make) === normaliseComparison(source.make)) score += 10
  return score
}

function rankRelatedProducts(source, candidates) {
  return candidates
    .filter(candidate => String(candidate.id) !== String(source.id) && candidate.status !== LISTING_STATUS.SOLD)
    .map(candidate => ({ candidate, score: relatedScore(source, candidate) }))
    .filter(item => item.score > 0)
    .sort((left, right) => right.score - left.score || new Date(right.candidate.created_at || 0) - new Date(left.candidate.created_at || 0))
    .slice(0, 3)
    .map(item => item.candidate)
}

// WOF y rego caducados o a punto de caducar son lo primero que mira un
// comprador en NZ, asi que se marcan en la ficha tecnica.
function expiryStatus(value) {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const days = Math.ceil((date.getTime() - Date.now()) / 86400000)
  if (days < 0) return { tone: 'expired', label: 'Expired' }
  if (days <= 30) return { tone: 'soon', label: 'Expires soon' }
  return null
}

function cleanSpecs(list) {
  return list.filter(spec => spec.value !== null && spec.value !== undefined && spec.value !== '' && spec.value !== 0)
}

function vehicleTypeName(id) {
  if (!id) return ''
  return VEHICLE_TYPES.find(type => type.id === id)?.name || id
}

function numberWithUnit(value, unit) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return ''
  return `${Number(value).toLocaleString('en-NZ')} ${unit}`
}

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })
}
