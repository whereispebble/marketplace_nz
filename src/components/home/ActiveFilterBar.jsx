/**
 * Barra de filtros activos.
 *
 * Muestra un distintivo por cada filtro aplicado, con su aspa para quitarlo de
 * uno en uno, y un boton para limpiarlos todos. Sin filtros aplicados queda
 * como "All vehicles" y en movil se oculta, porque no aporta nada.
 */

import { FiX } from 'react-icons/fi'

/**
 * @param {object} props
 * @param {{id: string, label: string}[]} props.chips filtros aplicados
 * @param {(filterId: string) => void} props.onRemove quita un filtro concreto
 * @param {() => void} props.onClearAll limpia todos los filtros
 */
export default function ActiveFilterBar({ chips, onRemove, onClearAll }) {
  return (
    <div className={`active-filter-bar ${chips.length === 0 ? 'is-empty' : ''}`}>
      <div className="active-filter-scroll" aria-label="Active filters">
        {chips.length > 0 ? (
          <>
            <span className="active-filter-label">Active filters:</span>
            {chips.map(chip => (
              <span className="active-filter-chip" key={chip.id}>
                {chip.label}
                <button type="button" onClick={() => onRemove(chip.id)} aria-label={`Remove ${chip.label} filter`}>
                  <FiX />
                </button>
              </span>
            ))}
          </>
        ) : (
          <span className="active-filter-chip active-filter-chip-static">All vehicles</span>
        )}
      </div>
      <div className="active-filter-actions">
        <button className="active-filter-clear" type="button" onClick={onClearAll}>Clear all</button>
      </div>
    </div>
  )
}
