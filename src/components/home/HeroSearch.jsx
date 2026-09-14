/**
 * Cabecera de la portada: titulo, sugerencias rapidas y caja de busqueda.
 *
 * Solo pinta y avisa: el estado de la busqueda vive en la portada. La altura
 * en movil esta calculada en CSS para que debajo quepa justo una fila de
 * tarjetas, asi que conviene no anadir elementos aqui sin revisar home.css.
 */

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
  return (
    <header className="hero" style={{ backgroundImage: `url(${backgroundImage})` }}>
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
