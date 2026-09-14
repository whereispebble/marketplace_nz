/**
 * Deslizador de rango con dos mandos (o uno solo con el prop single).
 * Lo usan el filtro de precio y cualquier otro rango numerico del panel.
 */

import { parsePositiveNumber } from '../../services/vehicleFilters'

export default function RangeSlider({
  min,
  max,
  step,
  minValue,
  maxValue,
  minLabel,
  maxLabel,
  single = false,
  onMinChange,
  onMaxChange,
}) {
  const cleanMin = parsePositiveNumber(minValue)
  const cleanMax = parsePositiveNumber(maxValue)
  const lower = Math.min(Math.max(cleanMin ?? min, min), max)
  const upper = Math.min(Math.max(cleanMax ?? max, min), max)
  const leftPercent = single ? 0 : ((lower - min) / (max - min)) * 100
  const rightPercent = ((upper - min) / (max - min)) * 100

  const handleMinChange = value => {
    const nextValue = Math.min(Number(value), upper)
    onMinChange?.(String(nextValue || ''))
  }

  const handleMaxChange = value => {
    const nextValue = Math.max(Number(value), single ? min : lower)
    onMaxChange?.(String(nextValue || ''))
  }

  return (
    <div className="range-control">
      <div
        className="range-track"
        style={{
          '--range-start': `${leftPercent}%`,
          '--range-end': `${rightPercent}%`,
        }}
      >
        {!single && (
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={lower}
            onChange={event => handleMinChange(event.target.value)}
            aria-label="Minimum"
          />
        )}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={upper}
          onChange={event => handleMaxChange(event.target.value)}
          aria-label="Maximum"
        />
      </div>
      <div className="range-labels">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  )
}
