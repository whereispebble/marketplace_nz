/**
 * Tarjeta de un anuncio.
 *
 * Se usa en la parrilla de resultados, en guardados y en los perfiles, asi que
 * tiene dos modos:
 *   - visitante: boton de guardar en favoritos.
 *   - owned:     menu del dueno para marcar vendido o reservado y editar.
 *
 * Solo pinta distintivo de estado cuando el anuncio ya no esta disponible.
 */

import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaHeart, FaRegHeart } from 'react-icons/fa'
import { FiCheckCircle, FiEdit3, FiMapPin, FiMoreHorizontal, FiPauseCircle, FiPlayCircle, FiShield, FiTag, FiTrash2, FiUsers } from 'react-icons/fi'
import { FAVORITES_UPDATED_EVENT, isFavorite, toggleFavorite } from '../services/favorites'
import { listingBadge, listingStatusBadge } from '../constants/listingStatus'

// owned: es un anuncio propio, asi que en vez de guardarlo se gestiona.
export default function ProductCard({ product, initiallyLiked = false, owned = false, preview = false, onStatusChange, onDelete }) {
  const [liked, setLiked] = useState(initiallyLiked)
  const [savingFavorite, setSavingFavorite] = useState(false)
  const [favoriteError, setFavoriteError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  // Distintivo de la tarjeta: vendido, reservado, o "New" durante la primera
  // semana. Null el resto del tiempo.
  const badge = listingBadge(product)
  // La tarjeta se atenua solo si el anuncio ya no esta disponible; un anuncio
  // nuevo tiene que verse en todo su esplendor.
  const isUnavailable = Boolean(listingStatusBadge(product))

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
    if (owned || preview) return undefined
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
  }, [owned, preview, product])

  return (
    <article className={`product-card ${menuOpen ? 'is-menu-open' : ''} ${isUnavailable ? 'is-unavailable' : ''}`}>
      {favoriteError && <p role="alert">{favoriteError}</p>}
      {badge && <span className={`badge product-badge ${badge.className}`}>{badge.label}</span>}

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
              {product.status !== 'draft' && <button
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
              </button>}
              {product.status !== 'draft' && <button
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
              </button>}
              {product.status !== 'available' ? (
                <button
                  type="button"
                  role="menuitem"
                  onClick={event => {
                    event.preventDefault()
                    setMenuOpen(false)
                    onStatusChange?.('available')
                  }}
                >
                  <FiPlayCircle />
                  Activate listing
                </button>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  onClick={event => {
                    event.preventDefault()
                    setMenuOpen(false)
                    onStatusChange?.('paused')
                  }}
                >
                  <FiPauseCircle />
                  Pause listing
                </button>
              )}
              <Link role="menuitem" to={`/product/${product.id}/edit`} onClick={() => setMenuOpen(false)}>
                <FiEdit3 />
                Edit listing
              </Link>
              <button
                className="is-danger"
                type="button"
                role="menuitem"
                onClick={event => {
                  event.preventDefault()
                  setMenuOpen(false)
                  onDelete?.()
                }}
              >
                <FiTrash2 />
                Delete listing
              </button>
            </div>
          )}
        </div>
      ) : (
      <button
        className={`favorite-btn ${liked ? 'is-liked' : ''}`}
        type="button"
        disabled={savingFavorite || preview}
        aria-label={liked ? 'Remove from favorites' : 'Add to favorites'}
        onClick={async event => {
          event.preventDefault()
          event.stopPropagation()
          setSavingFavorite(true)
          try {
                    setFavoriteError('')
                    setLiked(await toggleFavorite(product))
                  } catch {
                    setFavoriteError('Could not update saved vehicles. Please try again.')
                  } finally { setSavingFavorite(false) }
        }}
      >
        {liked ? <FaHeart /> : <FaRegHeart />}
      </button>
      )}

      <Link to={preview ? '#' : `/product/${product.id}`} onClick={event => { if (preview) event.preventDefault() }} tabIndex={preview ? -1 : undefined} className="product-link">
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
            {product.wofExpiry ? <span><FiShield size={13} /> WOF</span> : null}
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
