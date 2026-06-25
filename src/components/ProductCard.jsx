import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiHeart, FiMapPin } from 'react-icons/fi'

export default function ProductCard({ product }) {
  const [liked, setLiked] = useState(false)
  const isNew = ['new', 'nuevo'].includes(String(product.condition).toLowerCase())

  return (
    <article className="product-card">
      <span className={`badge product-badge ${isNew ? 'badge-mint' : ''}`}>
        {product.condition || 'Used'}
      </span>

      <button
        className={`favorite-btn ${liked ? 'is-liked' : ''}`}
        type="button"
        aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
        onClick={event => {
          event.preventDefault()
          setLiked(!liked)
        }}
      >
        <FiHeart fill={liked ? 'currentColor' : 'none'} />
      </button>

      <Link to={`/product/${product.id}`} className="product-link">
        <div className="product-image">
          <img
            src={product.image || 'https://placehold.co/640x480/f1ede5/171717?text=Kiwimart'}
            alt={product.title}
          />
        </div>

        <div className="product-info">
          <p className="product-title">{product.title}</p>
          <p className="product-price">{Number(product.price || 0).toLocaleString('es-ES')} EUR</p>
          <span className="muted-row">
            <FiMapPin size={14} />
            {product.location || 'Location pending'}
          </span>
        </div>
      </Link>
    </article>
  )
}
