import { useEffect, useMemo, useState } from 'react'
import { FiArrowRight, FiBookOpen, FiBox, FiGrid, FiHome, FiMonitor, FiSearch, FiShoppingBag, FiTruck } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import heroVideo from '../assets/hero-video.mp4'

const CATEGORIES = [
  { id: 'all', name: 'All', icon: FiGrid },
  { id: 'electronics', name: 'Electronics', icon: FiMonitor },
  { id: 'clothing', name: 'Clothing', icon: FiShoppingBag },
  { id: 'home', name: 'Home', icon: FiHome },
  { id: 'sports', name: 'Sports', icon: FiBox },
  { id: 'books', name: 'Books', icon: FiBookOpen },
  { id: 'cars', name: 'Cars', icon: FiTruck },
]

const MOCK_PRODUCTS = [
  { id: 1, title: 'iPhone 13 Pro 256GB', price: 650, condition: 'Good', location: 'Madrid', category: 'electronics', image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=900&q=80' },
  { id: 2, title: 'Nike Air Max 90', price: 80, condition: 'New', location: 'Barcelona', category: 'clothing', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80' },
  { id: 3, title: 'Modern 3-seat sofa', price: 200, condition: 'Good', location: 'Valencia', category: 'home', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=80' },
  { id: 4, title: 'Trail mountain bike', price: 350, condition: 'New', location: 'Seville', category: 'sports', image: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&w=900&q=80' },
  { id: 5, title: 'MacBook Air M1', price: 900, condition: 'Good', location: 'Madrid', category: 'electronics', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80' },
  { id: 6, title: 'Sony A6000 camera', price: 420, condition: 'Good', location: 'Bilbao', category: 'electronics', image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80' },
  { id: 7, title: 'Oak standing desk', price: 90, condition: 'New', location: 'Zaragoza', category: 'home', image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=900&q=80' },
  { id: 8, title: 'PS5 with two controllers', price: 480, condition: 'Good', location: 'Madrid', category: 'electronics', image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=900&q=80' },
]

export default function Home() {
  const [products, setProducts] = useState(MOCK_PRODUCTS)
  const [loading, setLoading] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('recent')

  useEffect(() => {
    let ignore = false

    async function loadProducts() {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (!ignore && !error && data?.length) setProducts(data)
      if (!ignore) setLoading(false)
    }

    loadProducts()
    return () => { ignore = true }
  }, [])

  const filtered = useMemo(() => {
    return products
      .filter(product => selectedCategory === 'all' || product.category?.toLowerCase() === selectedCategory)
      .filter(product => product.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price
        if (sortBy === 'price_desc') return b.price - a.price
        return 0
      })
  }, [products, search, selectedCategory, sortBy])

  return (
    <div className="app-shell">
      <Navbar search={search} onSearchChange={setSearch} />

      <header className="hero">
        <video className="hero-video" autoPlay muted loop playsInline aria-hidden="true">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-inner">
          <span className="eyebrow">Curated local deals, refreshed daily</span>
          <h1>Buy smarter. Sell faster.</h1>
          <p>Discover quality second-hand finds nearby with clean product cards, faster filters and a marketplace flow made for browsing.</p>

          <div className="hero-search">
            <input
              type="search"
              placeholder="What are you looking for today?"
              value={search}
              onChange={event => setSearch(event.target.value)}
            />
            <button className="btn btn-primary" type="button">
              <FiSearch />
              Search
            </button>
          </div>

          <div className="metrics">
            <div className="metric"><strong>12k+</strong><span>active listings</span></div>
            <div className="metric"><strong>3k+</strong><span>trusted sellers</span></div>
            <div className="metric"><strong>98%</strong><span>happy buyers</span></div>
          </div>
        </div>
      </header>

      <main className="container page-section">
        <div className="chips" aria-label="Categories">
          {CATEGORIES.map(category => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                className={`chip ${selectedCategory === category.id ? 'is-active' : ''}`}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
              >
                <Icon size={16} />
                {category.name}
              </button>
            )
          })}
        </div>

        <div className="section-header">
          <div>
            <h2 className="section-title">{filtered.length} products found</h2>
            <p className="section-subtitle">Browse the latest listings and save your favorites for later.</p>
          </div>
          <select className="select" value={sortBy} onChange={event => setSortBy(event.target.value)}>
            <option value="recent">Most recent</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state">
            <div>
              <div className="spinner" />
              Loading products...
            </div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state panel">
            <div>
              <FiSearch size={42} />
              <h2>No matches yet</h2>
              <p>Try a different search or clear the active filters.</p>
              <button className="btn btn-primary" type="button" onClick={() => { setSearch(''); setSelectedCategory('all') }}>
                Clear filters
                <FiArrowRight />
              </button>
            </div>
          </div>
        ) : (
          <div className="products-grid">
            {filtered.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>
    </div>
  )
}
