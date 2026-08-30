import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { FiCheckCircle, FiEdit3, FiMapPin, FiMoreHorizontal, FiShield, FiTag, FiUsers } from 'react-icons/fi'
import { FAVORITES_UPDATED_EVENT, isFavorite, toggleFavorite } from '../services/favorites'

const NEW_LISTING_WINDOW_MS = 7 * 24 * 60 * 60 * 1000

// Un anuncio se considera "New" si se publico hace menos de una semana.
function isNewListing(product) {
  const raw = product?.created_at || product?.createdAt || product?.publishedAt
  if (!raw) return false
  const published = new Date(raw).getTime()
  if (Number.isNaN(published)) return false
  return Date.now() - published < NEW_LISTING_WINDOW_MS
}

// owned: es un anuncio propio, asi que en vez de guardarlo se gestiona.
export default function ProductCard({ product, initiallyLiked = false, owned = false, onStatusChange }) {
  const [liked, setLiked] = useState(initiallyLiked)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const isNew = isNewListing(product)

  useEffect(() => {
    if (!menuOpen) return undefined

    const handleClickOutside = event => {
      if (!menuRef.current?.contains(event.target)) setMenuOpen(false)
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') setMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  useEffect(() => {
    if (owned) return undefined
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
  }, [owned, product])

  return (
    <article className={`product-card ${menuOpen ? 'is-menu-open' : ''}`}>
      {isNew && <span className="badge product-badge badge-mint">New</span>}

      {owned ? (
        <div className="card-menu" ref={menuRef}>
          <button
            className="favorite-btn card-menu-btn"
            type="button"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Listing options"
            onClick={event => {
              event.preventDefault()
              event.stopPropagation()
              setMenuOpen(current => !current)
            }}
          >
            <FiMoreHorizontal />
          </button>

          {menuOpen && (
            <div className="avatar-menu card-menu-list" role="menu">
              <button
                type="button"
                role="menuitem"
                onClick={event => {
                  event.preventDefault()
                  setMenuOpen(false)
                  onStatusChange?.('sold')
                }}
              >
                <FiCheckCircle />
                Mark as sold
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={event => {
                  event.preventDefault()
                  setMenuOpen(false)
                  onStatusChange?.('reserved')
                }}
              >
                <FiTag />
                Mark as booked
              </button>
              <Link role="menuitem" to={`/product/${product.id}/edit`} onClick={() => setMenuOpen(false)}>
                <FiEdit3 />
                Edit listing
              </Link>
            </div>
          )}
        </div>
      ) : (
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
      )}

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
            {product.wofExpiry || product.wof ? <span><FiShield size={13} /> WOF</span> : null}
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
