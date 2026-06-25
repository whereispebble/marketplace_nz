import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'

const MOCK_FAVORITES = [
  { id: 1, title: 'iPhone 13 Pro 256GB', price: 650, condition: 'Good', location: 'Madrid', image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=900&q=80' },
  { id: 2, title: 'Nike Air Max 90', price: 80, condition: 'New', location: 'Barcelona', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80' },
  { id: 3, title: 'MacBook Air M1', price: 900, condition: 'Good', location: 'Madrid', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=900&q=80' },
]

export default function Favorites() {
  const [favorites, setFavorites] = useState(MOCK_FAVORITES)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let ignore = false

    async function loadFavorites() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('favorites').select('product_id, products(*)').eq('user_id', user.id)
      if (!ignore && data?.length) setFavorites(data.map(favorite => favorite.products))
      if (!ignore) setLoading(false)
    }

    loadFavorites()
    return () => { ignore = true }
  }, [])

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section">
        <div className="section-header">
          <div>
            <h1 className="page-title">Favorites</h1>
            <p className="section-subtitle">{favorites.length} saved products ready when you come back.</p>
          </div>
          <span className="badge badge-accent"><FiHeart />{favorites.length}</span>
        </div>

        {loading ? (
          <div className="loading-state"><div><div className="spinner" />Loading favorites...</div></div>
        ) : favorites.length === 0 ? (
          <div className="empty-state panel">
            <div>
              <FiHeart size={44} />
              <h2>No favorites yet</h2>
              <p>Save products you love and compare them later.</p>
              <Link to="/" className="btn btn-primary">Browse products</Link>
            </div>
          </div>
        ) : (
          <div className="products-grid">
            {favorites.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        )}
      </main>
    </div>
  )
}
