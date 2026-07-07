import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { FiMapPin, FiShield, FiUsers } from 'react-icons/fi'
import { FAVORITES_UPDATED_EVENT, isFavorite, toggleFavorite } from '../services/favorites'

export default function ProductCard({ product, initiallyLiked = false }) {
  const [liked, setLiked] = useState(initiallyLiked)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const isCertified = Boolean(product.selfContained)

  useEffect(() => {
    let ignore = false

    async function loadFavoriteState() {
      const saved = await isFavorite(product)
      if (!ignore) setLiked(saved)
    }

    loadFavoriteState()
    window.addEventListener(FAVORITES_UPDATED_EVENT, loadFavoriteState)

    return () => {
      ignore = true
      window.removeEventListener(FAVORITES_UPDATED_EVENT, loadFavoriteState)
    }
  }, [product])

  return (
    <article className="product-card">
      <span className={`badge product-badge ${isCertified ? 'badge-mint' : ''}`}>
        {isCertified ? 'Self-contained' : product.condition || 'Used'}
      </span>

      <button
        className={`favorite-btn ${liked ? 'is-liked' : ''}`}
        type="button"
        disabled={savingFavorite}
        aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
        onClick={async event => {
          event.preventDefault()
          event.stopPropagation()
          setSavingFavorite(true)
          const nextLiked = await toggleFavorite(product)
          setLiked(nextLiked)
          setSavingFavorite(false)
        }}
      >
        {liked ? <FaHeart /> : <FaRegHeart />}
      </button>

      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image">
          <img
            src={product.image || 'https://placehold.co/640x480/f1ede5/171717?text=Swapy'}
            alt={product.title}
          />
        </div>

        <div className="product-info">
          <p className="product-title">{product.title}</p>
          <p className="product-price">NZ${Number(product.price || 0).toLocaleString('en-NZ')}</p>
          <div className="spec-row">
            {product.mileage ? <span>{Number(product.mileage).toLocaleString('en-NZ')} km</span> : null}
            {product.sleeps ? <span><FiUsers size={13} /> Sleeps {product.sleeps}</span> : null}
            {product.wof ? <span><FiShield size={13} /> WOF</span> : null}
          </div>
          <span className="muted-row">
            <FiMapPin size={14} />
            {product.location || 'Location pending'}
          </span>
        </div>
      </Link>
    </article>
  )
}
