import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiChevronLeft, FiChevronRight, FiEye, FiHeart, FiMapPin, FiMaximize2, FiMessageCircle, FiShield, FiStar, FiUsers, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { MOCK_VEHICLES, VEHICLE_TYPES } from '../data/mockVehicles'
import { FAVORITES_UPDATED_EVENT, isFavorite, toggleFavorite } from '../services/favorites'

export default function ProductDetail() {
  const { id } = useParams()
  const fallbackVehicle = MOCK_VEHICLES.find(vehicle => String(vehicle.id) === String(id)) || MOCK_VEHICLES[0]
  const [product, setProduct] = useState(fallbackVehicle)
  const [selectedImage, setSelectedImage] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [liked, setLiked] = useState(false)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const sellerId = product.seller_id || product.seller?.id || 'seller'
  const sellerName = product.seller?.name || 'Private seller'

  useEffect(() => {
    let ignore = false

    async function loadProduct() {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
      if (!ignore && !error && data) setProduct(data)
      if (!ignore) setLoading(false)
    }

    loadProduct()
    return () => { ignore = true }
  }, [id])

  useEffect(() => {
    let ignore = false

    async function loadFavoriteState() {
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
    { label: 'Year', value: product.year },
    { label: 'Mileage', value: numberWithUnit(product.mileage, 'km') },
    { label: 'Vehicle type', value: vehicleTypeName(product.vehicleType || product.category) },
    { label: 'Sleeps', value: product.sleeps, icon: <FiUsers /> },
    { label: 'Transmission', value: product.transmission },
    { label: 'Self-contained', value: product.selfContained ? 'Yes' : 'No', icon: <FiShield /> },
  ]), [product])

  const highlights = useMemo(() => ([
    vehicleTypeName(product.vehicleType || product.category),
    product.condition,
    product.fuel,
    product.transmission,
    product.drivetrain,
    product.layout,
    TOILET_LABELS[product.toiletType],
    product.selfContained ? 'Self-contained' : '',
    Number(product.solarW) > 0 ? 'Solar' : '',
  ].filter(Boolean)), [product])

  const specGroups = useMemo(() => ([
    {
      title: 'Vehicle',
      rows: cleanSpecs([
        { label: 'Make', value: product.make },
        { label: 'Model', value: product.model },
        { label: 'Year', value: product.year },
        { label: 'Mileage', value: numberWithUnit(product.mileage, 'km') },
        { label: 'Condition', value: product.condition },
        { label: 'Transmission', value: product.transmission },
        { label: 'Fuel', value: product.fuel },
        { label: 'Drivetrain', value: product.drivetrain },
        { label: 'Engine', value: numberWithUnit(product.engineCc, 'cc') },
        { label: 'Seats', value: product.seats },
        { label: 'Doors', value: product.doors },
      ]),
    },
    {
      title: 'New Zealand paperwork',
      rows: cleanSpecs([
        { label: 'WOF expiry', value: formatDate(product.wofExpiry), status: expiryStatus(product.wofExpiry) },
        { label: 'Rego expiry', value: formatDate(product.regoExpiry), status: expiryStatus(product.regoExpiry) },
      ]),
    },
    {
      title: 'Camper layout',
      rows: cleanSpecs([
        { label: 'Sleeps', value: product.sleeps },
        { label: 'Seat belts', value: product.belts },
        { label: 'Layout', value: product.layout },
        { label: 'Length', value: numberWithUnit(product.lengthM, 'm') },
        { label: 'Weight', value: numberWithUnit(product.weightKg, 'kg') },
      ]),
    },
    {
      title: 'Off-grid and self-containment',
      rows: cleanSpecs([
        { label: 'Fresh water', value: numberWithUnit(product.freshWaterL, 'L') },
        { label: 'Grey water', value: numberWithUnit(product.greyWaterL, 'L') },
        { label: 'Battery', value: numberWithUnit(product.batteryAh, 'Ah') },
        { label: 'Solar', value: numberWithUnit(product.solarW, 'W') },
        { label: 'Toilet', value: TOILET_LABELS[product.toiletType] },
        { label: 'Self-contained', value: product.selfContained ? 'Yes' : 'No' },
        { label: 'Self-contained expiry', value: formatDate(product.scExpiry), status: expiryStatus(product.scExpiry) },
      ]),
    },
  ].filter(group => group.rows.length > 0)), [product])

  const images = useMemo(() => product.images?.length ? product.images : [product.image || fallbackVehicle.images[0]], [fallbackVehicle.images, product])

  // Las flechas dan la vuelta al llegar al final para que no haya callejon sin
  // salida en una galeria de dos o tres fotos.
  const showImage = step => setSelectedImage(current => (current + step + images.length) % images.length)

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar compact />
        <div className="loading-state"><div><div className="spinner" />Loading vehicle...</div></div>
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
          <span>{product.vehicleType || product.category || 'Vehicle'}</span>
        </div>

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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className={`badge ${statusBadgeClass(product.status)}`}>
                  {formatStatus(product.status)}
                </span>
              </div>
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

              <Link className="btn btn-primary btn-full" to={`/chats/${sellerId}`} style={{ marginTop: 18 }} aria-label={`Contact ${sellerName} about ${product.title}`}>
                <FiMessageCircle />
                Contact seller
              </Link>
              <button
                className="btn btn-secondary btn-full"
                type="button"
                disabled={savingFavorite}
                style={{ marginTop: 10 }}
                aria-pressed={liked}
                aria-label={liked ? `Remove ${product.title} from saved vehicles` : `Save ${product.title}`}
                onClick={async () => {
                  setSavingFavorite(true)
                  const nextLiked = await toggleFavorite(product)
                  setLiked(nextLiked)
                  setSavingFavorite(false)
                }}
              >
                <FiHeart fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Saved' : 'Save vehicle'}
              </button>
            </section>

            <section className="panel panel-pad">
              <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 16 }}>Seller</h2>
              <Link className="seller-row seller-link" to={`/profile/${sellerId}`} aria-label={`View ${sellerName} profile`}>
                <div className="avatar">{sellerName?.[0] || 'U'}</div>
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

function formatStatus(status) {
  if (status === 'available') return 'Active'
  if (status === 'reserved') return 'Booked'
  if (!status) return 'Active'
  return status.charAt(0).toUpperCase() + status.slice(1)
}

// Solo tres estados visibles en la ficha: activo, reservado y vendido.
function statusBadgeClass(status) {
  if (status === 'reserved') return 'badge-accent'
  if (status === 'sold') return ''
  return 'badge-mint'
}

const TOILET_LABELS = {
  none: 'No toilet',
  portable: 'Portable toilet',
  fixed: 'Fixed toilet',
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
