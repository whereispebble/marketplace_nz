/**
 * Selector de orden de los resultados.
 *
 * Desplegable propio en vez de un <select> nativo: el panel se ancla al borde
 * derecho del boton, asi que crece hacia dentro de la pantalla y nunca se sale.
 */

import { useEffect, useRef, useState } from 'react'
import { FiChevronDown } from 'react-icons/fi'

export default function SortMenu({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)
  const active = options.find(option => option.id === value) || options[0]

  useEffect(() => {
    if (!open) return undefined

    const handleClickOutside = event => {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  return (
    <div className="results-sort" ref={containerRef}>
      <button
        className="results-sort-trigger"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Sort results, currently ${active.label}`}
        onClick={() => setOpen(current => !current)}
      >
        <FiChevronDown className="results-sort-caret" />
        <span className="results-sort-label">Sort</span>
        <span className="results-sort-value">{active.label}</span>
      </button>

      {open && (
        <ul className="results-sort-menu" role="listbox">
          {options.map(option => (
            <li key={option.id}>
              <button
                className={`results-sort-option ${option.id === value ? 'is-active' : ''}`}
                type="button"
                role="option"
                aria-selected={option.id === value}
                onClick={() => { onChange(option.id); setOpen(false) }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
