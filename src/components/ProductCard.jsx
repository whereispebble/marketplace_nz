import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { FiMapPin, FiShield, FiUsers } from 'react-icons/fi'

export default function ProductCard({ product }) {
  const [liked, setLiked] = useState(false)
  const isCertified = Boolean(product.selfContained)

  return (
    <article className="product-card">
      <span className={`badge product-badge ${isCertified ? 'badge-mint' : ''}`}>
        {isCertified ? 'Self-contained' : product.condition || 'Used'}
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
