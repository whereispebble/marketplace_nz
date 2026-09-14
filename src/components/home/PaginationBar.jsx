/**
 * Paginacion de la parrilla de resultados.
 * No se muestra si todos los resultados caben en una sola pagina.
 */

import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { PAGE_SIZE } from '../../constants/filters'

export default function PaginationBar({ currentPage, totalPages, totalItems, onPrevious, onNext }) {
  if (totalItems <= PAGE_SIZE) return null

  return (
    <nav className="pagination-bar" aria-label="Product pages">
      <button className="pagination-nav" type="button" disabled={currentPage === 1} onClick={onPrevious}>
        <FiArrowLeft />
        Previous
      </button>
      <span>
        <strong>Page {currentPage} of {totalPages}</strong>
      </span>
      <button className="pagination-nav" type="button" disabled={currentPage === totalPages} onClick={onNext}>
        Next
        <FiArrowRight />
      </button>
    </nav>
  )
}
