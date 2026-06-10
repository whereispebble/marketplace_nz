import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../services/supabase'

const MOCK_PRODUCT = {
  id: 1,
  title: 'iPhone 13 Pro',
  price: 650,
  condition: 'Good',
  location: 'Madrid',
  description: 'iPhone 13 Pro in great condition. Comes with original box, charger and two cases. Battery health at 91%. No scratches on screen, minor wear on the back.',
  category: 'Electronics',
  status: 'available',
  views: 128,
  created_at: '2024-03-15',
  images: [
    'https://via.placeholder.com/600x400?text=iPhone+Front',
    'https://via.placeholder.com/600x400?text=iPhone+Back',
    'https://via.placeholder.com/600x400?text=iPhone+Box',
  ],
  seller: {
    name: 'Alex M.',
    avatar: 'https://via.placeholder.com/60x60?text=AM',
    rating: 4.8,
    sales: 23,
    joined: '2022',
  }
}

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(MOCK_PRODUCT)
  const [selectedImage, setSelectedImage] = useState(0)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
    if (!error && data) setProduct(data)
    setLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FDF6F8' }}>
      <div style={{
        width: '40px', height: '40px',
        border: '4px solid #F5C6D8',
        borderTopColor: '#A8D4E8',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6F8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        background: 'white',
        borderBottom: '2px solid #F5C6D8',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(245,198,216,0.2)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', padding: '4px 12px', borderRadius: '8px' }}>MKT</span>
          <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>place</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ cursor: 'pointer', color: '#c084a0', fontSize: '1.3rem' }}>♡</span>
          <span style={{ cursor: 'pointer', color: '#c084a0', fontSize: '1.3rem' }}>💬</span>
          <span style={{ cursor: 'pointer', color: '#c084a0', fontSize: '1.3rem' }}>👤</span>
          <button style={{ background: '#A8D4E8', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '50px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
            + Sell
          </button>
        </div>
      </nav>

      {/* Breadcrumb */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.2rem 2rem 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#b08090' }}>
          <Link to="/" style={{ color: '#A8D4E8', textDecoration: 'none', fontWeight: 600 }}>Home</Link>
          <span>›</span>
          <span>{product.category || 'Electronics'}</span>
          <span>›</span>
          <span style={{ color: '#5a2d3f', fontWeight: 600 }}>{product.title}</span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem 2rem 4rem', display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem' }}>

        {/* Left — Images */}
        <div>
          {/* Main image */}
          <div style={{
            borderRadius: '20px',
            overflow: 'hidden',
            background: 'white',
            border: '2px solid #F5C6D8',
            marginBottom: '14px',
            height: '420px',
          }}>
            <img
              src={product.images?.[selectedImage] || product.image || 'https://via.placeholder.com/600x400?text=No+image'}
              alt={product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Thumbnails */}
          {product.images && (
            <div style={{ display: 'flex', gap: '10px' }}>
              {product.images.map((img, i) => (
                <div
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: '3px solid',
                    borderColor: selectedImage === i ? '#F5C6D8' : '#f0e0e8',
                    transition: 'border-color 0.2s, transform 0.2s',
                    transform: selectedImage === i ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}

          {/* Description */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '2px solid #F5C6D8',
            padding: '1.5rem',
            marginTop: '1.5rem',
          }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', margin: '0 0 12px', fontSize: '1.1rem' }}>
              Description
            </h3>
            <p style={{ color: '#666', lineHeight: 1.7, margin: 0, fontSize: '0.95rem' }}>
              {product.description || 'No description provided.'}
            </p>
          </div>
        </div>

        {/* Right — Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Price card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '2px solid #F5C6D8',
            padding: '1.5rem',
          }}>
            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
              <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', fontFamily: "'Syne', sans-serif" }}>
                {product.condition}
              </span>
              <span style={{ background: '#E8F4FB', color: '#2a6080', fontSize: '0.75rem', fontWeight: 700, padding: '4px 12px', borderRadius: '50px', fontFamily: "'Syne', sans-serif" }}>
                {product.category || 'Electronics'}
              </span>
            </div>

            <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.4rem', color: '#3a2030', margin: '0 0 10px', lineHeight: 1.2 }}>
              {product.title}
            </h1>

            <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2.2rem', color: '#3a2030', margin: '0 0 16px' }}>
              {product.price} €
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b08090', fontSize: '0.85rem', marginBottom: '20px' }}>
              <span>📍</span> {product.location || 'Unknown location'}
              <span style={{ marginLeft: '12px' }}>👁️</span> {product.views || 0} views
            </div>

            {/* CTA buttons */}
            <button style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(135deg, #F5C6D8, #e8a8c4)',
              color: '#5a2d3f',
              border: 'none',
              borderRadius: '50px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '1rem',
              cursor: 'pointer',
              marginBottom: '10px',
              transition: 'transform 0.15s, box-shadow 0.15s',
              boxShadow: '0 4px 16px rgba(245,198,216,0.4)',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,198,216,0.5)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(245,198,216,0.4)' }}
            >
              💬 Contact seller
            </button>

            <button
              onClick={() => setLiked(!liked)}
              style={{
                width: '100%',
                padding: '14px',
                background: liked ? '#FFF0F5' : 'white',
                color: liked ? '#e05080' : '#b08090',
                border: `2px solid ${liked ? '#F5C6D8' : '#ede0e5'}`,
                borderRadius: '50px',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: '1rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {liked ? '❤️ Saved' : '♡ Save to favorites'}
            </button>
          </div>

          {/* Seller card */}
          <div style={{
            background: 'white',
            borderRadius: '20px',
            border: '2px solid #A8D4E8',
            padding: '1.5rem',
          }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', margin: '0 0 16px', fontSize: '1rem' }}>
              Seller
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{
                width: '52px', height: '52px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5C6D8, #A8D4E8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                color: 'white',
                fontSize: '1.2rem',
              }}>
                {product.seller?.name?.[0] || 'U'}
              </div>
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#3a2030', fontSize: '1rem' }}>
                  {product.seller?.name || 'Anonymous'}
                </div>
                <div style={{ color: '#b08090', fontSize: '0.8rem' }}>
                  ⭐ {product.seller?.rating || '—'} · {product.seller?.sales || 0} sales
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <div style={{ flex: 1, background: '#FDF6F8', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030' }}>{product.seller?.sales || 0}</div>
                <div style={{ fontSize: '0.75rem', color: '#b08090' }}>Sales</div>
              </div>
              <div style={{ flex: 1, background: '#FDF6F8', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030' }}>⭐ {product.seller?.rating || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: '#b08090' }}>Rating</div>
              </div>
              <div style={{ flex: 1, background: '#FDF6F8', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030' }}>{product.seller?.joined || '—'}</div>
                <div style={{ fontSize: '0.75rem', color: '#b08090' }}>Joined</div>
              </div>
            </div>

            <button style={{
              width: '100%',
              padding: '12px',
              background: 'white',
              color: '#2a6080',
              border: '2px solid #A8D4E8',
              borderRadius: '50px',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              marginTop: '14px',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = '#E8F4FB'}
              onMouseLeave={e => e.currentTarget.style.background = 'white'}
            >
              View profile
            </button>
          </div>

          {/* Safety tip */}
          <div style={{
            background: 'linear-gradient(135deg, #FFF5F8, #F0F8FF)',
            borderRadius: '16px',
            border: '1.5px solid #F5C6D8',
            padding: '1rem 1.2rem',
            fontSize: '0.8rem',
            color: '#b08090',
            lineHeight: 1.6,
          }}>
            🔒 <strong style={{ color: '#5a2d3f' }}>Stay safe.</strong> Never pay outside the platform. Meet in public places and verify the product before paying.
          </div>
        </div>
      </div>
    </div>
  )
}