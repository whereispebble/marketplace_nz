import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiEye, FiHeart, FiMapPin, FiMessageCircle, FiShield, FiStar } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'

const MOCK_PRODUCT = {
  id: 1,
  title: 'iPhone 13 Pro 256GB',
  price: 650,
  condition: 'Good',
  location: 'Madrid',
  description: 'iPhone 13 Pro in great condition. Comes with original box, charger and two cases. Battery health at 91%. No scratches on screen, minor wear on the back.',
  category: 'Electronics',
  views: 128,
  images: [
    'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1603791440384-56cd371ee9a7?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02ff9?auto=format&fit=crop&w=1200&q=80',
  ],
  seller: { name: 'Alex M.', rating: 4.8, sales: 23, joined: '2022' },
}

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(MOCK_PRODUCT)
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

  const images = useMemo(() => product.images?.length ? product.images : [product.image || MOCK_PRODUCT.images[0]], [product])

  if (loading) {
    return (
      <div className="app-shell">
        <Navbar compact />
        <div className="loading-state"><div><div className="spinner" />Loading product...</div></div>
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
          <span>{product.category || 'Product'}</span>
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
              <p className="section-subtitle">{product.description || 'No description provided yet.'}</p>
            </article>
          </div>

          <aside className="sidebar-stack">
            <section className="panel panel-pad">
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                <span className="badge badge-accent">{product.condition || 'Used'}</span>
                <span className="badge">{product.category || 'General'}</span>
              </div>
              <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>{product.title}</h1>
              <p className="product-price" style={{ fontSize: '2.4rem', marginTop: 16 }}>
                {Number(product.price || 0).toLocaleString('es-ES')} EUR
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '16px 0 22px' }}>
                <span className="muted-row"><FiMapPin />{product.location || 'Unknown location'}</span>
                <span className="muted-row"><FiEye />{product.views || 0} views</span>
              </div>
              <button className="btn btn-primary btn-full" type="button"><FiMessageCircle />Contact seller</button>
              <button className="btn btn-secondary btn-full" type="button" style={{ marginTop: 10 }} onClick={() => setLiked(!liked)}>
                <FiHeart fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Saved' : 'Save to favorites'}
              </button>
            </section>

            <section className="panel panel-pad">
              <h2 className="section-title" style={{ fontSize: '1.2rem', marginBottom: 16 }}>Seller</h2>
              <div className="seller-row">
                <div className="avatar">{product.seller?.name?.[0] || 'U'}</div>
                <div>
                  <strong>{product.seller?.name || 'Anonymous seller'}</strong>
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
                Meet in public places, check the item before paying and keep payment inside trusted channels.
              </span>
            </section>
          </aside>
        </section>
      </main>
    </div>
  )
}
