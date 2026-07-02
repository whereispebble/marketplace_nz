import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiEye, FiHeart, FiMapPin, FiMessageCircle, FiShield, FiStar, FiUsers } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { MOCK_VEHICLES } from '../data/mockVehicles'

export default function ProductDetail() {
  const { id } = useParams()
  const fallbackVehicle = MOCK_VEHICLES.find(vehicle => String(vehicle.id) === String(id)) || MOCK_VEHICLES[0]
  const [product, setProduct] = useState(fallbackVehicle)
  const [selectedImage, setSelectedImage] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

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

  const images = useMemo(() => product.images?.length ? product.images : [product.image || fallbackVehicle.images[0]], [fallbackVehicle.images, product])

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
            <div className="media-viewer">
              <img src={images[selectedImage]} alt={product.title} />
            </div>
            {images.length > 1 && (
              <div className="thumb-row">
                {images.map((image, index) => (
                  <button
                    className={`thumb ${selectedImage === index ? 'is-active' : ''}`}
                    key={image}
                    type="button"
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
            </article>
          </div>

          <aside className="sidebar-stack">
            <section className="panel panel-pad">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-accent">{product.condition || 'Used'}</span>
                <span className={`badge ${product.selfContained ? 'badge-mint' : ''}`}>
                  {product.selfContained ? 'Self-contained' : 'Not self-contained'}
                </span>
              </div>
              <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{product.title}</h1>
              <p className="product-price" style={{ fontSize: '2.4rem', marginTop: 16 }}>
                NZ${Number(product.price || 0).toLocaleString('en-NZ')}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '16px 0 22px' }}>
                <span className="muted-row"><FiMapPin />{product.location || 'Location pending'}</span>
                <span className="muted-row"><FiEye />{product.views || 0} views</span>
              </div>

              <div className="vehicle-spec-grid">
                <Spec label="Model" value={product.model || '-'} />
                <Spec label="Mileage" value={product.mileage ? `${Number(product.mileage).toLocaleString('en-NZ')} km` : '-'} />
                <Spec label="WOF" value={product.wof || '-'} />
                <Spec label="Sleeps" value={product.sleeps || '-'} icon={<FiUsers />} />
                <Spec label="Seat belts" value={product.belts || '-'} />
                <Spec label="Certification" value={product.selfContained ? 'Self-contained' : 'No'} icon={<FiShield />} />
              </div>

              <button className="btn btn-primary btn-full" type="button" style={{ marginTop: 18 }}><FiMessageCircle />Contact seller</button>
              <button className="btn btn-secondary btn-full" type="button" style={{ marginTop: 10 }} onClick={() => setLiked(!liked)}>
                <FiHeart fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Saved' : 'Save vehicle'}
              </button>
            </section>

            <section className="panel panel-pad">
              <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 16 }}>Seller</h2>
              <div className="seller-row">
                <div className="avatar">{product.seller?.name?.[0] || 'U'}</div>
                <div>
                  <strong>{product.seller?.name || 'Private seller'}</strong>
                  <span className="muted-row" style={{ display: 'flex', marginTop: 4 }}><FiStar />{product.seller?.rating || 'New seller'} rating</span>
                </div>
              </div>
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
