/**
 * Vehiculos guardados.
 *
 * Con sesion iniciada salen de la tabla favorites del usuario; sin sesion, de
 * la copia local del navegador, que se borra al entrar o salir de una cuenta.
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart } from 'react-icons/fi'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import LoadingScreen from '../components/LoadingScreen'
import { FAVORITES_UPDATED_EVENT, getFavoriteProducts } from '../services/favorites'

export default function Favorites() {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadFavorites() {
      setLoading(true)
      const savedProducts = await getFavoriteProducts()
      if (!ignore) setFavorites(savedProducts)
      if (!ignore) setLoading(false)
    }

    const refresh = () => loadFavorites().catch(() => { if (!ignore) { setError('Could not load saved vehicles. Please try again.'); setLoading(false) } })
    refresh()
    window.addEventListener(FAVORITES_UPDATED_EVENT, refresh)
    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, refresh)
      ignore = true
    }
  }, [])

  if (loading) {
    return <LoadingScreen fullPage label="Loading saved vehicles" />
  }

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section">
        {error && <p role="alert">{error}</p>}
        <div className="section-header">
          <div>
            <h1 className="page-title">Saved vehicles</h1>
            <p className="section-subtitle">{favorites.length} vehicles saved for comparing WOF, mileage, sleeps and price.</p>
          </div>
          <span className="badge badge-accent"><FiHeart />{favorites.length}</span>
        </div>

        {favorites.length === 0 ? (
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
