import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'

const MOCK_FAVORITES = [
  { id: 1, title: 'iPhone 13 Pro', price: 650, condition: 'Good', location: 'Madrid', image: 'https://via.placeholder.com/300x180?text=iPhone' },
  { id: 2, title: 'Nike Air Max 90', price: 80, condition: 'New', location: 'Barcelona', image: 'https://via.placeholder.com/300x180?text=Nike' },
  { id: 3, title: 'MacBook Air M1', price: 900, condition: 'Good', location: 'Madrid', image: 'https://via.placeholder.com/300x180?text=MacBook' },
]

export default function Favorites() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES)
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchFavorites() }, [])

  const fetchFavorites = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    const { data } = await supabase
      .from('favorites')
      .select('product_id, products(*)')
      .eq('user_id', user.id)
    if (data && data.length > 0) setFavorites(data.map(f => f.products))
    setLoading(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6F8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '2px solid #F5C6D8', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(245,198,216,0.2)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', padding: '4px 12px', borderRadius: '8px' }}>MKT</span>
          <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>place</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link to="/profile" style={{ color: '#c084a0', fontSize: '1.3rem', textDecoration: 'none' }}>👤</Link>
          <Link to="/new-product" style={{ background: '#A8D4E8', color: 'white', border: 'none', padding: '9px 20px', borderRadius: '50px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>+ Sell</Link>
        </div>
      </nav>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', color: '#3a2030', margin: 0 }}>
            My Favorites ♡
          </h1>
          <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.85rem', padding: '4px 14px', borderRadius: '50px' }}>
            {favorites.length}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#c084a0' }}>
            <div style={{ width: '40px', height: '40px', border: '4px solid #F5C6D8', borderTopColor: '#A8D4E8', borderRadius: '50%', margin: '0 auto 1rem', animation: 'spin 0.8s linear infinite' }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Loading favorites...
          </div>
        ) : favorites.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem', background: 'white', borderRadius: '24px', border: '2px solid #F5C6D8' }}>
            <p style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>♡</p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', margin: '0 0 8px' }}>No favorites yet</h2>
            <p style={{ color: '#b08090', marginBottom: '1.5rem' }}>Save products you love to find them easily later</p>
            <Link to="/" style={{ background: 'linear-gradient(135deg, #F5C6D8, #e8a8c4)', color: '#5a2d3f', padding: '12px 28px', borderRadius: '50px', textDecoration: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
              Browse products
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
            {favorites.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}