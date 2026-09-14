/**
 * Ventana de filtros avanzados.
 *
 * Envuelve los campos del filtro y anade la cabecera, las busquedas guardadas y
 * los botones de limpiar y aplicar. Se cierra al pulsar fuera de la tarjeta.
 */

import { FiBookmark, FiX } from 'react-icons/fi'
import AdvancedFilterFields from './AdvancedFilterFields'

export default function AdvancedFiltersModal({
  onClear,
  onApply,
  open,
  onOpenChange,
  savedSearches = [],
  isDraftSaved = false,
  onSaveDraft,
  onApplySaved,
  onRemoveSaved,
  ...fieldProps
}) {
  if (!open) return null

  return (
    <div className="filters-modal-overlay" onClick={() => onOpenChange(false)}>
      <div className="filters-modal-sheet panel" role="dialog" aria-modal="true" aria-label="Filters" onClick={event => event.stopPropagation()}>
        <div className="filters-modal-head">
          <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Filters</h2>
          <button className="icon-btn" type="button" aria-label="Close filters" onClick={() => onOpenChange(false)}>
            <FiX />
          </button>
        </div>

        <div className="filters-modal-body">
          <AdvancedFilterFields {...fieldProps} idPrefix="modal" />

          <div className="advanced-filter-group saved-filters-group">
            <div className="saved-filters-head">
              <strong>Saved filters</strong>
              <button
                className={`saved-filters-save ${isDraftSaved ? 'is-saved' : ''}`}
                type="button"
                onClick={onSaveDraft}
                aria-pressed={isDraftSaved}
              >
                <FiBookmark />
                {isDraftSaved ? 'Saved' : 'Save these filters'}
              </button>
            </div>

            {savedSearches.length === 0 ? (
              <p className="saved-filters-empty">You have no saved filters yet.</p>
            ) : (
              <ul className="saved-filters-list">
                {savedSearches.map(saved => (
                  <li key={saved.id}>
                    <button className="saved-filters-item" type="button" onClick={() => onApplySaved(saved)}>
                      <span className="saved-filters-name">{saved.name}</span>
                      <span className="saved-filters-count">{saved.lastCount} vehicles</span>
                    </button>
                    <button
                      className="saved-filters-remove"
                      type="button"
                      onClick={() => onRemoveSaved(saved.id)}
                      aria-label={`Remove saved filter ${saved.name}`}
                    >
                      <FiX />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="advanced-filter-actions">
          <button className="btn btn-secondary" type="button" onClick={onClear}>Clear</button>
          <button className="btn btn-primary" type="button" onClick={onApply}>Apply</button>
        </div>
      </div>
    </div>
  )
}
