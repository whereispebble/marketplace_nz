/**
 * Zona de resultados.
 *
 * Alterna entre el mapa y las tarjetas de resultados con su paginacion.
 */

import { FiArrowRight, FiSearch } from 'react-icons/fi'
import ProductCard from '../ProductCard'
import PaginationBar from './PaginationBar'
import VehicleMap from './VehicleMap'
import LoadingScreen from '../LoadingScreen'

/**
 * @param {object} props
 * @param {boolean} props.loading si aun se estan cargando los anuncios
 * @param {object[]} props.vehicles resultados ya filtrados y ordenados
 * @param {object[]} props.pageVehicles los de la pagina actual
 * @param {'grid'|'map'} props.viewMode
 * @param {object|null} props.focusPoint ubicacion elegida, para centrar el mapa
 * @param {number} props.currentPage
 * @param {number} props.totalPages
 * @param {() => void} props.onPreviousPage
 * @param {() => void} props.onNextPage
 * @param {() => void} props.onClearFilters
 */
export default function ResultsView({
  loading,
  error,
  vehicles,
  pageVehicles,
  viewMode,
  focusPoint,
  currentPage,
  totalPages,
  onPreviousPage,
  onNextPage,
  onClearFilters,
}) {
  if (loading) {
    return (
      <div className="search-results-main">
        <LoadingScreen label="Loading vehicles" />
      </div>
    )
  }

  if (error) return <div className="empty-state panel" role="alert"><p>{error}</p><button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button></div>

  if (viewMode === 'map') {
    return (
      <div className="search-results-main">
        <VehicleMap vehicles={vehicles} focusPoint={focusPoint} />
      </div>
    )
  }

  if (vehicles.length === 0) {
    return (
      <div className="search-results-main">
        <div className="empty-state panel">
          <div>
            <FiSearch size={42} />
            <h2>No vehicles found</h2>
            <p>Try a broader model, region or price range.</p>
            <button className="btn btn-primary" type="button" onClick={onClearFilters}>
              Clear filters
              <FiArrowRight />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="search-results-main">
      <div className="products-grid">
        {pageVehicles.map(vehicle => <ProductCard key={vehicle.id} product={vehicle} />)}
      </div>
      <PaginationBar
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={vehicles.length}
        onPrevious={onPreviousPage}
        onNext={onNextPage}
      />
    </div>
  )
}
