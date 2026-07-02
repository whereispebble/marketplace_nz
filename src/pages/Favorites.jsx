import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import ProductCard from '../components/ProductCard'
import { MOCK_VEHICLES } from '../data/mockVehicles'

const MOCK_FAVORITES = MOCK_VEHICLES.slice(0, 3)

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
            <h1 className="page-title">Saved vehicles</h1>
            <p className="section-subtitle">{favorites.length} vehicles saved for comparing WOF, mileage, sleeps and price.</p>
          </div>
          <span className="badge badge-accent"><FiHeart />{favorites.length}</span>
        </div>

        {loading ? (
          <div className="loading-state"><div><div className="spinner" />Loading saved vehicles...</div></div>
        ) : favorites.length === 0 ? (
          <div className="empty-state panel">
            <div>
              <FiHeart size={44} />
              <h2>No saved vehicles yet</h2>
              <p>Save campervans and motorhomes to compare them later.</p>
              <Link to="/" className="btn btn-primary">Browse vehicles</Link>
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
