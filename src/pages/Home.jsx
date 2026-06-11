import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import heroBg from '../assets/hero.jpg'

const CATEGORIES = [
  { id: 'all', name: 'All', emoji: '🛍️' },
  { id: 'electronics', name: 'Electronics', emoji: '📱' },
  { id: 'clothing', name: 'Clothing', emoji: '👗' },
  { id: 'home', name: 'Home', emoji: '🏠' },
  { id: 'sports', name: 'Sports', emoji: '⚽' },
  { id: 'books', name: 'Books', emoji: '📚' },
  { id: 'cars', name: 'Cars', emoji: '🚗' },
  { id: 'toys', name: 'Toys', emoji: '🧸' },
]

const MOCK_PRODUCTS = [
  { id: 1, title: 'iPhone 13 Pro', price: 650, condition: 'Good', location: 'Madrid', image: 'https://via.placeholder.com/300x180?text=iPhone+13' },
  { id: 2, title: 'Nike Air Max 90', price: 80, condition: 'New', location: 'Barcelona', image: 'https://via.placeholder.com/300x180?text=Nike' },
  { id: 3, title: '3-seat sofa', price: 200, condition: 'Good', location: 'Valencia', image: 'https://via.placeholder.com/300x180?text=Sofa' },
  { id: 4, title: 'Mountain bike', price: 350, condition: 'New', location: 'Seville', image: 'https://via.placeholder.com/300x180?text=Bike' },
  { id: 5, title: 'MacBook Air M1', price: 900, condition: 'Good', location: 'Madrid', image: 'https://via.placeholder.com/300x180?text=MacBook' },
  { id: 6, title: 'Sony A6000 Camera', price: 420, condition: 'Good', location: 'Bilbao', image: 'https://via.placeholder.com/300x180?text=Camera' },
  { id: 7, title: 'Standing desk', price: 90, condition: 'New', location: 'Zaragoza', image: 'https://via.placeholder.com/300x180?text=Desk' },
  { id: 8, title: 'PS5 + 2 controllers', price: 480, condition: 'Good', location: 'Madrid', image: 'https://via.placeholder.com/300x180?text=PS5' },
]

export default function Home() {
  const navigate = useNavigate()
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (!error && data && data.length > 0) setProducts(data)
    setLoading(false)
  }

  const filtered = products
    .filter(p => selectedCategory === 'all' || p.category?.toLowerCase() === selectedCategory)
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price
      if (sortBy === 'price_desc') return b.price - a.price
      return 0
    })

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6F8', fontFamily: "'DM Sans', sans-serif" }}>

      <style>{`
      

        .hero-title { font-size: clamp(1.8rem, 5vw, 3.8rem); }

        .stats-row {
          display: flex;
          justify-content: center;
          gap: 3rem;
          margin-top: 2.5rem;
        }

        .categories-row {
          display: flex;
          gap: 10px;
          overflow-x: auto;
          padding-bottom: 8px;
          margin-bottom: 2rem;
          scrollbar-width: none;
        }
        .categories-row::-webkit-scrollbar { display: none; }

        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
          gap: 20px;
        }

        .results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        @keyframes spin { to { transform: rotate(360deg) } }

        @media (max-width: 768px) {
          .stats-row { gap: 1.5rem; }
          .products-grid { grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
          .results-header { flex-direction: column; align-items: flex-start; }
        }

        @media (max-width: 480px) {
          .products-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
          .stats-row { gap: 1rem; }
        }
      `}</style>

      <Navbar />

      
      {/* Hero */}
<div style={{
  backgroundImage: `linear-gradient(135deg, rgba(249,228,238,0.85) 0%, rgba(232,244,251,0.85) 100%), url(${heroBg})`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: 'clamp(2rem, 5vw, 4rem) 1.5rem',
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
}}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.3 }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '220px', height: '220px', background: '#A8D4E8', borderRadius: '50%', opacity: 0.25 }} />
        <div style={{ position: 'absolute', top: '20px', left: '10%', width: '80px', height: '80px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.2 }} />

        <h1 className="hero-title" style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          color: '#3a2030',
          margin: '0 0 12px',
          letterSpacing: '-1px',
          lineHeight: 1.1,
          position: 'relative',
        }}>
          Buy & sell<br />
          <span style={{ color: '#A8D4E8' }}>anything you want</span>
        </h1>

        <p style={{ color: '#b08090', fontSize: 'clamp(0.9rem, 2vw, 1.05rem)', margin: '0 0 2rem', position: 'relative' }}>
          Thousands of products waiting for you
        </p>

        {/* Search bar */}
        <div style={{ maxWidth: '520px', margin: '0 auto', position: 'relative', padding: '0 1rem' }}>
          <input
            type="text"
            placeholder="What are you looking for?"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '14px 24px',
              borderRadius: '50px',
              border: '3px solid #F5C6D8',
              background: 'white',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              boxShadow: '0 4px 20px rgba(245,198,216,0.3)',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#A8D4E8'}
            onBlur={e => e.target.style.borderColor = '#F5C6D8'}
          />
        </div>

        {/* Stats */}
        <div className="stats-row">
          {[['12k+', 'Products'], ['3k+', 'Sellers'], ['98%', 'Happy buyers']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 'clamp(1.1rem, 3vw, 1.5rem)', color: '#3a2030' }}>{num}</div>
              <div style={{ fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', color: '#b08090' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(1rem, 3vw, 2rem)' }}>

        {/* Categories */}
        <div className="categories-row">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: 'clamp(6px, 1.5vw, 8px) clamp(12px, 2vw, 18px)',
                borderRadius: '50px',
                border: '2px solid',
                borderColor: selectedCategory === cat.id ? '#F5C6D8' : '#ede0e5',
                background: selectedCategory === cat.id ? '#F5C6D8' : 'white',
                color: selectedCategory === cat.id ? '#5a2d3f' : '#888',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 'clamp(0.78rem, 1.5vw, 0.85rem)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                flexShrink: 0,
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Results header */}
        <div className="results-header">
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1rem, 2.5vw, 1.3rem)', fontWeight: 800, color: '#3a2030', margin: 0, whiteSpace: 'nowrap' }}>
            {filtered.length} products
          </h2>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '10px',
              border: '2px solid #F5C6D8',
              background: 'white',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600,
              fontSize: 'clamp(0.78rem, 1.5vw, 0.85rem)',
              cursor: 'pointer',
              outline: 'none',
              color: '#5a2d3f',
              width: '100%',
              maxWidth: '220px',
            }}
          >
            <option value="recent">Most recent</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {/* Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#c084a0' }}>
            <div style={{
              width: '40px', height: '40px',
              border: '4px solid #F5C6D8',
              borderTopColor: '#A8D4E8',
              borderRadius: '50%',
              margin: '0 auto 1rem',
              animation: 'spin 0.8s linear infinite',
            }} />
            Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '3rem' }}>🔍</p>
            <p style={{ color: '#c084a0', fontWeight: 600, marginBottom: '1rem' }}>
              No products found for "{search}"
            </p>
            <button
              onClick={() => { setSearch(''); setSelectedCategory('all') }}
              style={{
                background: '#F5C6D8', color: '#5a2d3f', border: 'none',
                padding: '10px 24px', borderRadius: '50px',
                fontFamily: "'Syne', sans-serif", fontWeight: 700, cursor: 'pointer',
              }}
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Mobile bottom nav */}
      <div style={{
        display: 'none',
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        background: 'white',
        borderTop: '2px solid #F5C6D8',
        padding: '10px 0',
        zIndex: 100,
        boxShadow: '0 -4px 20px rgba(245,198,216,0.2)',
      }} id="mobile-nav">
        <style>{`
          @media (max-width: 768px) {
            #mobile-nav { display: flex !important; justify-content: space-around; align-items: center; }
          }
        `}</style>
        {[
          { to: '/', emoji: '🏠', label: 'Home' },
          { to: '/favorites', emoji: '♡', label: 'Saved' },
          { to: '/new-product', emoji: '➕', label: 'Sell' },
          { to: '/chats', emoji: '💬', label: 'Chats' },
          { to: '/profile', emoji: '👤', label: 'Profile' },
        ].map(item => (
          <a key={item.to} href={item.to} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: '2px', textDecoration: 'none', color: '#c084a0',
            fontSize: '1.2rem', minWidth: '50px',
          }}>
            <span>{item.emoji}</span>
            <span style={{ fontSize: '0.65rem', fontFamily: "'DM Sans', sans-serif", fontWeight: 600 }}>{item.label}</span>
          </a>
        ))}
      </div>

      {/* Bottom padding for mobile nav */}
      <style>{`
        @media (max-width: 768px) {
          #root > div > div:last-child { padding-bottom: 80px; }
        }
      `}</style>
    </div>
  )
}