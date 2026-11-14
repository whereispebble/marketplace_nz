/**
 * Cabecera de la portada: titulo, sugerencias rapidas y caja de busqueda.
 *
 * Solo pinta y avisa: el estado de la busqueda vive en la portada. La altura
 * en movil esta calculada en CSS para que debajo quepa justo una fila de
 * tarjetas, asi que conviene no anadir elementos aqui sin revisar home.css.
 */

import { useEffect, useRef } from 'react'
import { FiBookmark, FiSettings } from 'react-icons/fi'
import { QUICK_SEARCHES } from '../../constants/filters'

/**
 * @param {object} props
 * @param {string} props.backgroundImage foto de fondo del hero
 * @param {string} props.search texto escrito en la caja
 * @param {boolean} props.isSearchSaved si la busqueda actual ya esta archivada
 * @param {(value: string) => void} props.onSearchChange
 * @param {(event: KeyboardEvent) => void} props.onSearchKeyDown lanza la busqueda con Enter
 * @param {(filters: object) => void} props.onQuickSearch aplica una sugerencia
 * @param {() => void} props.onToggleSaveSearch archiva o desarchiva la busqueda
 * @param {() => void} props.onOpenFilters abre el panel de filtros avanzados
 */
export default function HeroSearch({
  backgroundImage,
  search,
  isSearchSaved,
  onSearchChange,
  onSearchKeyDown,
  onQuickSearch,
  onToggleSaveSearch,
  onOpenFilters,
}) {
  const heroRef = useRef(null)

  useEffect(() => {
    const hero = heroRef.current
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    const desktop = window.matchMedia('(min-width: 641px) and (hover: hover) and (pointer: fine)')
    let frame = null
    let lastOffset

    const updateBackground = () => {
      frame = null
      // The image has 40px of vertical overscan. Keep the movement within it,
      // relative to this hero rather than the entire document's scroll position.
      const offset = desktop.matches && !reducedMotion.matches
        ? Math.min(32, Math.max(0, -hero.getBoundingClientRect().top) * 0.18)
        : 0
      const value = `${offset.toFixed(2)}px`
      if (value !== lastOffset) {
        hero.style.setProperty('--hero-scroll-y', value)
        lastOffset = value
      }
    }
    const queueUpdate = () => {
      if (frame === null) frame = window.requestAnimationFrame(updateBackground)
    }

    const syncMotion = () => {
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
      if (frame !== null) window.cancelAnimationFrame(frame)
      if (desktop.matches && !reducedMotion.matches) {
        window.addEventListener('scroll', queueUpdate, { passive: true })
        window.addEventListener('resize', queueUpdate)
      }
      updateBackground()
    }

    syncMotion()
    desktop.addEventListener('change', syncMotion)
    reducedMotion.addEventListener('change', syncMotion)

    return () => {
      window.removeEventListener('scroll', queueUpdate)
      window.removeEventListener('resize', queueUpdate)
      desktop.removeEventListener('change', syncMotion)
      reducedMotion.removeEventListener('change', syncMotion)
      if (frame !== null) window.cancelAnimationFrame(frame)
      hero.style.removeProperty('--hero-scroll-y')
    }
  }, [])

  return (
    <header ref={heroRef} className="hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
      <div className="hero-inner">
        <h1>What are you looking for?</h1>

        <div className="hero-quick-filters" aria-label="Search suggestions">
          {QUICK_SEARCHES.map(suggestion => (
            <button key={suggestion.label} type="button" onClick={() => onQuickSearch(suggestion.filters)}>
              {suggestion.label}
            </button>
          ))}
        </div>

        <div className="hero-search">
          <input
            type="search"
            placeholder="Model, city, WOF..."
            value={search}
            onChange={event => onSearchChange(event.target.value)}
            onKeyDown={onSearchKeyDown}
          />
          <button
            className={`hero-search-save ${isSearchSaved ? 'is-saved' : ''}`}
            type="button"
            onClick={onToggleSaveSearch}
            aria-pressed={isSearchSaved}
            aria-label={isSearchSaved ? 'Remove saved search' : 'Save this search'}
          >
            <FiBookmark />
          </button>
          <span className="hero-search-divider" aria-hidden="true" />
          <button className="hero-search-filters" type="button" onClick={onOpenFilters}>
            <FiSettings />
            Filters
          </button>
        </div>
      </div>
    </header>
  )
}
