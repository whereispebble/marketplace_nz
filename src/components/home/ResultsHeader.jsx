/**
 * Cabecera de los resultados: cuantos hay, orden y modo de vista.
 *
 * En escritorio va todo en una linea; en movil el titulo ocupa la primera y los
 * tres controles la segunda, con Grid/Map centrados en el eje de la pantalla.
 */

import { FiGrid, FiMap, FiSettings } from 'react-icons/fi'
import SortMenu from './SortMenu'
import { SORT_OPTIONS } from '../../constants/filters'

/**
 * @param {object} props
 * @param {number} props.total numero de anuncios que pasan los filtros
 * @param {string} props.sortBy criterio de orden activo
 * @param {'grid'|'map'} props.viewMode vista actual
 * @param {React.RefObject} props.resultsRef ancla para desplazarse a los resultados
 * @param {(value: string) => void} props.onSortChange
 * @param {(mode: 'grid'|'map') => void} props.onViewModeChange
 * @param {() => void} props.onOpenFilters
 */
export default function ResultsHeader({
  total,
  sortBy,
  viewMode,
  resultsRef,
  onSortChange,
  onViewModeChange,
  onOpenFilters,
}) {
  return (
    <div className="section-header results-header" ref={resultsRef}>
      <div>
        <h2 className="section-title">{total} vehicles</h2>
      </div>

      <SortMenu value={sortBy} options={SORT_OPTIONS} onChange={onSortChange} />

      <div className="segmented-control" aria-label="View mode">
        <div className="view-toggle" role="group" aria-label="Results view">
          <button
            className={viewMode === 'grid' ? 'is-active' : ''}
            type="button"
            aria-pressed={viewMode === 'grid'}
            onClick={() => onViewModeChange('grid')}
          >
            <FiGrid />
            Grid
          </button>
          <button
            className={viewMode === 'map' ? 'is-active' : ''}
            type="button"
            aria-pressed={viewMode === 'map'}
            onClick={() => onViewModeChange('map')}
          >
            <FiMap />
            Map
          </button>
        </div>
        <button className="results-filter-button" type="button" onClick={onOpenFilters}>
          <FiSettings />
          Filters
        </button>
      </div>
    </div>
  )
}
