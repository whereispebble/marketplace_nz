import { useState, useEffect } from 'react'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'

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
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchProducts() }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    if (!error && data && data.length > 0) setProducts(data)
    setLoading(false)
  }

  const filtered = products.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase())
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            background: '#F5C6D8',
            color: '#5a2d3f',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.2rem',
            padding: '4px 12px',
            borderRadius: '8px',
          }}>MKT</span>
          <span style={{
            color: '#A8D4E8',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: '1.1rem',
          }}>place</span>
        </div>

        <div style={{ flex: 1, maxWidth: '460px', margin: '0 2rem', position: 'relative' }}>
          <input
            type="text"
            placeholder="Search for anything..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 20px',
              borderRadius: '50px',
              border: '2px solid #F5C6D8',
              background: '#FDF6F8',
              fontSize: '0.9rem',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: 'border-box',
              color: '#333',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#A8D4E8'}
            onBlur={e => e.target.style.borderColor = '#F5C6D8'}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ cursor: 'pointer', color: '#c084a0', fontSize: '1.3rem' }}>♡</span>
          <span style={{ cursor: 'pointer', color: '#c084a0', fontSize: '1.3rem' }}>💬</span>
          <span style={{ cursor: 'pointer', color: '#c084a0', fontSize: '1.3rem' }}>👤</span>
          <button style={{
            background: '#A8D4E8',
            color: 'white',
            border: 'none',
            padding: '9px 20px',
            borderRadius: '50px',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '0.85rem',
            cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
          >
            + Sell
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div style={{
        background: 'linear-gradient(135deg, #F9E4EE 0%, #E8F4FB 100%)',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-60px', width: '260px', height: '260px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.3 }} />
        <div style={{ position: 'absolute', bottom: '-80px', left: '-40px', width: '220px', height: '220px', background: '#A8D4E8', borderRadius: '50%', opacity: 0.25 }} />
        <div style={{ position: 'absolute', top: '20px', left: '10%', width: '80px', height: '80px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.2 }} />
      <h1 style={{
          fontFamily: "'Syne', sans-serif",
          fontSize: 'clamp(2rem, 5vw, 3.8rem)',
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
        <p style={{ color: '#b08090', fontSize: '1.05rem', margin: '0 0 2.5rem', position: 'relative' }}>
          Thousands of products waiting for you
        </p>

        <div style={{ maxWidth: '520px', margin: '0 auto', position: 'relative' }}>
          <input
            type="text"
            placeholder="What are you looking for?"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '16px 24px',
              borderRadius: '50px',
              border: '3px solid #F5C6D8',
              background: 'white',
              fontSize: '1rem',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: 'border-box',
              boxShadow: '0 4px 20px rgba(245,198,216,0.3)',
            }}
            onFocus={e => e.target.style.borderColor = '#A8D4E8'}
            onBlur={e => e.target.style.borderColor = '#F5C6D8'}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '3rem', marginTop: '2.5rem', position: 'relative' }}>
          {[['12k+', 'Products'], ['3k+', 'Sellers'], ['98%', 'Happy buyers']].map(([num, label]) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#3a2030' }}>{num}</div>
              <div style={{ fontSize: '0.8rem', color: '#b08090' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem' }}>

        {/* Categories */}
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '2rem', scrollbarWidth: 'none' }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 18px',
                borderRadius: '50px',
                border: '2px solid',
                borderColor: selectedCategory === cat.id ? '#F5C6D8' : '#ede0e5',
                background: selectedCategory === cat.id ? '#F5C6D8' : 'white',
                color: selectedCategory === cat.id ? '#5a2d3f' : '#888',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
              }}
            >
              {cat.emoji} {cat.name}
            </button>
          ))}
        </div>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.3rem', fontWeight: 800, color: '#3a2030', margin: 0 }}>
            {filtered.length} products
          </h2>
          <select style={{
            padding: '8px 16px',
            borderRadius: '10px',
            border: '2px solid #F5C6D8',
            background: 'white',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer',
            outline: 'none',
            color: '#5a2d3f',
          }}>
            <option>Most recent</option>
            <option>Price: low to high</option>
            <option>Price: high to low</option>
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
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            Loading products...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <p style={{ fontSize: '3rem' }}>🔍</p>
            <p style={{ color: '#c084a0', fontWeight: 600 }}>No products found for "{search}"</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: '20px',
          }}>
            {filtered.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}