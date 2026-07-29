import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { getFavoriteProducts } from '../services/favorites'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let ignore = false

    async function loadFavorites() {
      setLoading(true)
      const savedProducts = await getFavoriteProducts()
      if (!ignore) setFavorites(savedProducts)
      if (!ignore) setLoading(false)
    }

    loadFavorites()

    return () => {
      ignore = true
    }
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
            {favorites.map(product => <ProductCard key={`favorite-${product.id}`} product={product} initiallyLiked />)}
          </div>
        )}
      </main>

      <Footer />
    </div>
  )
}
