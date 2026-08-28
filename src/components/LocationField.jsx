import { useEffect, useRef, useState } from 'react'
import { FiNavigation } from 'react-icons/fi'
import { searchPlaces } from '../services/geocoding'

// Campo de ubicacion con sugerencias reales de NZ: no salen de los anuncios,
// se piden al geocodificador mientras se escribe. Lo comparten el filtro de
// busqueda y el formulario de publicacion, para que un anuncio se guarde con
// el mismo nombre de sitio por el que luego se busca.
//
// La fila "My location" solo aparece si se pasa onUseMyLocation.
export default function LocationField({
  idPrefix,
  label = 'Location',
  placeholder = 'Search a New Zealand town or city',
  value,
  selected,
  hint,
  required = false,
  invalid = false,
  onChange,
  onSelect,
  onUseMyLocation,
  locating = false,
}) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('idle')
  const [highlighted, setHighlighted] = useState(-1)
  const containerRef = useRef(null)
  const skipNextQuery = useRef(false)
  const listId = `${idPrefix}-location-suggestions`
  const withDeviceRow = typeof onUseMyLocation === 'function'

  useEffect(() => {
    if (skipNextQuery.current) {
      skipNextQuery.current = false
      return undefined
    }

    const query = value.trim()
    if (query.length < 2) {
      setSuggestions([])
      setStatus('idle')
      return undefined
    }

    const controller = new AbortController()
    // Debounce: una peticion por pausa de escritura, no por tecla.
    const timer = setTimeout(async () => {
      setStatus('loading')
      try {
        const places = await searchPlaces(query, controller.signal)
        setSuggestions(places)
        setHighlighted(-1)
        setStatus(places.length === 0 ? 'empty' : 'idle')
        setOpen(true)
      } catch (error) {
        if (error.name === 'AbortError') return
        setSuggestions([])
        setStatus('error')
        setOpen(true)
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [value])

  useEffect(() => {
    function handleClickOutside(event) {
      if (!containerRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const close = () => {
    setSuggestions([])
    setOpen(false)
    setHighlighted(-1)
    setStatus('idle')
  }

  const choose = place => {
    skipNextQuery.current = true
    onSelect(place)
    close()
  }

  const chooseMyLocation = () => {
    skipNextQuery.current = true
    onUseMyLocation()
    close()
  }

  // Con la fila del dispositivo, esta ocupa el indice 0 y las sugerencias van
  // detras; sin ella, las sugerencias empiezan en 0.
  const offset = withDeviceRow ? 1 : 0
  const rowCount = suggestions.length + offset

  const handleKeyDown = event => {
    if (!open || rowCount === 0) return
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted(current => (current + 1) % rowCount)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted(current => (current <= 0 ? rowCount - 1 : current - 1))
    } else if (event.key === 'Enter' && highlighted >= 0) {
      event.preventDefault()
      if (withDeviceRow && highlighted === 0) chooseMyLocation()
      else choose(suggestions[highlighted - offset])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className="field-group location-autocomplete" ref={containerRef}>
      <span>
        {label}
        {required && <em className="field-required" title="Required" aria-hidden="true">*</em>}
      </span>
      <input
        className={invalid ? 'field field-error' : 'field'}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        onChange={event => onChange(event.target.value)}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {open && (
        <ul className="location-suggestions" id={listId} role="listbox">
          {withDeviceRow && (
            <li>
              <button
                type="button"
                role="option"
                aria-selected={highlighted === 0}
                className={`location-suggestion location-suggestion-device ${highlighted === 0 ? 'is-highlighted' : ''}`}
                disabled={locating}
                onMouseEnter={() => setHighlighted(0)}
                onClick={chooseMyLocation}
              >
                <FiNavigation />
                <strong>{locating ? 'Locating...' : 'My location'}</strong>
                <span>Use the position of this device</span>
              </button>
            </li>
          )}
          {status === 'loading' && <li className="location-suggestion-note">Searching...</li>}
          {status === 'empty' && <li className="location-suggestion-note">No matching places in New Zealand</li>}
          {status === 'error' && <li className="location-suggestion-note">Location search unavailable right now</li>}
          {suggestions.map((place, index) => (
            <li key={place.id}>
              <button
                type="button"
                role="option"
                aria-selected={index + offset === highlighted}
                className={`location-suggestion ${index + offset === highlighted ? 'is-highlighted' : ''}`}
                onMouseEnter={() => setHighlighted(index + offset)}
                onClick={() => choose(place)}
              >
                <strong>{place.name}</strong>
                {place.context && <span>{place.context}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {hint && value.trim().length >= 2 && !selected && !open && (
        <small className="location-hint">{hint}</small>
      )}
    </div>
  )
}
