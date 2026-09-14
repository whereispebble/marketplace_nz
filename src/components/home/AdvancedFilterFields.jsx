/**
 * Campos del panel de filtros avanzados.
 *
 * Solo pinta: no guarda estado propio. Todos los valores y sus funciones de
 * cambio llegan por props desde la portada, que es quien tiene el estado.
 * Asi los mismos campos sirven para el panel lateral y para la ventana modal.
 */

import LocationField from '../LocationField'
import RangeSlider from './RangeSlider'
import {
  AMENITY_FILTERS,
  CONDITION_FILTERS,
  DRIVETRAIN_FILTERS,
  FUEL_FILTERS,
  LAYOUT_FILTERS,
  SORT_OPTIONS,
  TOILET_FILTERS,
  VALIDITY_FILTERS,
  VEHICLE_TYPE_FILTERS,
} from '../../constants/filters'

export default function AdvancedFilterFields({
  idPrefix,
  vehicleType,
  make,
  model,
  minYear,
  maxYear,
  transmission,
  fuel,
  drivetrain,
  minEngineCc,
  maxEngineCc,
  minSeats,
  minDoors,
  condition,
  wofValidity,
  regoValidity,
  layout,
  minLengthM,
  maxLengthM,
  maxWeightKg,
  carLicenceOnly,
  minFreshWaterL,
  minGreyWaterL,
  minBatteryAh,
  minSolarW,
  toiletType,
  sortBy,
  locatingDevice,
  minPrice,
  maxPrice,
  maxMileage,
  minSleeps,
  minBelts,
  selfContainedOnly,
  location,
  locationPoint,
  amenities,
  makes = [],
  models = [],
  years = [],
  onVehicleTypeChange,
  onMakeChange,
  onModelChange,
  onMinYearChange,
  onMaxYearChange,
  onTransmissionChange,
  onFuelChange,
  onDrivetrainChange,
  onMinEngineCcChange,
  onMaxEngineCcChange,
  onMinSeatsChange,
  onMinDoorsChange,
  onConditionChange,
  onWofValidityChange,
  onRegoValidityChange,
  onLayoutChange,
  onMinLengthChange,
  onMaxLengthChange,
  onMaxWeightChange,
  onCarLicenceChange,
  onMinFreshWaterChange,
  onMinGreyWaterChange,
  onMinBatteryChange,
  onMinSolarChange,
  onToiletTypeChange,
  onSortByChange,
  onUseDeviceLocation,
  onMinPriceChange,
  onMaxPriceChange,
  onMaxMileageChange,
  onMinSleepsChange,
  onMinBeltsChange,
  onSelfContainedChange,
  onLocationChange,
  onLocationSelect,
  onAmenityChange,
}) {
  const yearListId = `${idPrefix}-advanced-year-options`
  // Un modelo restaurado de un filtro guardado puede no estar en la lista de la
  // marca actual: se anade para que el select no aparezca vacio.
  const modelOptions = model && !models.includes(model) ? [model, ...models] : models

  return (
    <>
      <div className="advanced-filter-group">
        <strong>Vehicle type</strong>
        <label className="field-group">
          <span>Type</span>
          <select className="field" value={vehicleType} onChange={event => onVehicleTypeChange(event.target.value)}>
            {VEHICLE_TYPE_FILTERS.map(type => <option key={type.id} value={type.id}>{type.label}</option>)}
          </select>
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Make and model</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>Make</span>
            <select className="field" value={make} onChange={event => onMakeChange(event.target.value)}>
              <option value="">Any make</option>
              {makes.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field-group">
            <span>Model</span>
            {modelOptions.length > 0 ? (
              <select className="field" value={model} onChange={event => onModelChange(event.target.value)}>
                <option value="">Any model</option>
                {modelOptions.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
            ) : (
              <input className="field" placeholder="Any model" value={model} onChange={event => onModelChange(event.target.value)} />
            )}
          </label>
        </div>
      </div>

      <div className="advanced-filter-group">
        <strong>Price range</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>Min NZ$</span>
            <input className="field" inputMode="numeric" placeholder="15k" value={minPrice} onChange={event => onMinPriceChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Max NZ$</span>
            <input className="field" inputMode="numeric" placeholder="80k" value={maxPrice} onChange={event => onMaxPriceChange(event.target.value)} />
          </label>
        </div>
        <RangeSlider
          min={0}
          max={150000}
          step={5000}
          minValue={minPrice}
          maxValue={maxPrice}
          minLabel="0"
          maxLabel="150k"
          onMinChange={onMinPriceChange}
          onMaxChange={onMaxPriceChange}
        />
      </div>

      <div className="advanced-filter-group">
        <strong>Location</strong>
        <LocationField
          idPrefix={idPrefix}
          value={location}
          selected={locationPoint}
          hint="Pick a suggestion to sort by distance."
          locating={locatingDevice}
          onChange={onLocationChange}
          onSelect={onLocationSelect}
          onUseMyLocation={onUseDeviceLocation}
        />
        <p className="filter-note">
          Pick a suggestion and the results are ordered from closest to furthest.
        </p>
      </div>

      <div className="advanced-filter-group">
        <strong>Vehicle details</strong>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Year from</span>
            <input className="field" inputMode="numeric" list={yearListId} placeholder="Any year" value={minYear} onChange={event => onMinYearChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Year to</span>
            <input className="field" inputMode="numeric" list={yearListId} placeholder="Any year" value={maxYear} onChange={event => onMaxYearChange(event.target.value)} />
          </label>
        </div>
        <datalist id={yearListId}>
          {years.map(item => <option key={item} value={item} />)}
        </datalist>
        <label className="field-group">
          <span>Transmission</span>
          <select className="field" value={transmission} onChange={event => onTransmissionChange(event.target.value)}>
            <option value="all">Any transmission</option>
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </label>
        <label className="field-group">
          <span>Max mileage</span>
          <input className="field" inputMode="numeric" placeholder="150000" value={maxMileage} onChange={event => onMaxMileageChange(event.target.value)} />
        </label>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Sleeps min</span>
            <input className="field" inputMode="numeric" placeholder="2" value={minSleeps} onChange={event => onMinSleepsChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Belts min</span>
            <input className="field" inputMode="numeric" placeholder="3" value={minBelts} onChange={event => onMinBeltsChange(event.target.value)} />
          </label>
        </div>
        <label className="field-group">
          <span>Condition</span>
          <select className="field" value={condition} onChange={event => onConditionChange(event.target.value)}>
            <option value="all">Any condition</option>
            {CONDITION_FILTERS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Mechanical</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>Fuel</span>
            <select className="field" value={fuel} onChange={event => onFuelChange(event.target.value)}>
              <option value="all">Any fuel</option>
              {FUEL_FILTERS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="field-group">
            <span>Drivetrain</span>
            <select className="field" value={drivetrain} onChange={event => onDrivetrainChange(event.target.value)}>
              {DRIVETRAIN_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Engine from (cc)</span>
            <input className="field" inputMode="numeric" placeholder="2000" value={minEngineCc} onChange={event => onMinEngineCcChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Engine to (cc)</span>
            <input className="field" inputMode="numeric" placeholder="3000" value={maxEngineCc} onChange={event => onMaxEngineCcChange(event.target.value)} />
          </label>
        </div>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Seats min</span>
            <input className="field" inputMode="numeric" placeholder="4" value={minSeats} onChange={event => onMinSeatsChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Doors min</span>
            <input className="field" inputMode="numeric" placeholder="3" value={minDoors} onChange={event => onMinDoorsChange(event.target.value)} />
          </label>
        </div>
      </div>

      <div className="advanced-filter-group">
        <strong>Paperwork</strong>
        <div className="dual-field">
          <label className="field-group">
            <span>WOF</span>
            <select className="field" value={wofValidity} onChange={event => onWofValidityChange(event.target.value)}>
              {VALIDITY_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
          <label className="field-group">
            <span>Rego</span>
            <select className="field" value={regoValidity} onChange={event => onRegoValidityChange(event.target.value)}>
              {VALIDITY_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div className="advanced-filter-group">
        <strong>Layout and size</strong>
        <label className="field-group">
          <span>Layout</span>
          <select className="field" value={layout} onChange={event => onLayoutChange(event.target.value)}>
            <option value="all">Any layout</option>
            {LAYOUT_FILTERS.map(item => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Length from (m)</span>
            <input className="field" inputMode="decimal" placeholder="5" value={minLengthM} onChange={event => onMinLengthChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Length to (m)</span>
            <input className="field" inputMode="decimal" placeholder="7" value={maxLengthM} onChange={event => onMaxLengthChange(event.target.value)} />
          </label>
        </div>
        <label className="field-group">
          <span>Max weight (kg)</span>
          <input className="field" inputMode="numeric" placeholder="3500" value={maxWeightKg} onChange={event => onMaxWeightChange(event.target.value)} />
        </label>
        <label className="toggle-row">
          <input type="checkbox" checked={carLicenceOnly} onChange={event => onCarLicenceChange(event.target.checked)} />
          Drivable on a car licence (up to 3,500 kg)
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Off-grid capacity</strong>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Fresh water min (L)</span>
            <input className="field" inputMode="numeric" placeholder="60" value={minFreshWaterL} onChange={event => onMinFreshWaterChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Grey water min (L)</span>
            <input className="field" inputMode="numeric" placeholder="60" value={minGreyWaterL} onChange={event => onMinGreyWaterChange(event.target.value)} />
          </label>
        </div>
        <div className="dual-field dual-field-inline">
          <label className="field-group">
            <span>Battery min (Ah)</span>
            <input className="field" inputMode="numeric" placeholder="100" value={minBatteryAh} onChange={event => onMinBatteryChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Solar min (W)</span>
            <input className="field" inputMode="numeric" placeholder="200" value={minSolarW} onChange={event => onMinSolarChange(event.target.value)} />
          </label>
        </div>
        <label className="field-group">
          <span>Toilet</span>
          <select className="field" value={toiletType} onChange={event => onToiletTypeChange(event.target.value)}>
            {TOILET_FILTERS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Self-containment</strong>
        <label className="toggle-row">
          <input type="checkbox" checked={selfContainedOnly} onChange={event => onSelfContainedChange(event.target.checked)} />
          Self-contained only
        </label>
      </div>

      <div className="advanced-filter-group">
        <strong>Sort</strong>
        <label className="field-group">
          <span>Order results by</span>
          <select className="field" value={sortBy} onChange={event => onSortByChange(event.target.value)}>
            {SORT_OPTIONS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
        </label>
        <p className="filter-note">
          "Best match" shows the closest vehicles first when you pick a location, and the newest listings when you do not.
        </p>
      </div>

      <div className="advanced-filter-group">
        <strong>Equipment</strong>
        <div className="amenity-grid">
          {AMENITY_FILTERS.map(amenity => (
            <label className="amenity-check" key={amenity.id}>
              <input type="checkbox" checked={Boolean(amenities[amenity.id])} onChange={() => onAmenityChange(amenity.id)} />
              <span>{amenity.label}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
