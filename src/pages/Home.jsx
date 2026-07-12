import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiArrowRight, FiBell, FiBookmark, FiGrid, FiMap, FiSearch, FiSliders, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import heroSeaImage from '../assets/new-zealand-sea.webp.jpg'
import { MOCK_VEHICLES, NZ_VEHICLE_CATALOG, VEHICLE_TYPES } from '../data/mockVehicles'

let leafletPromise
const PAGE_SIZE = 50
const SAVED_SEARCHES_KEY = 'swapy:saved-searches'
const HOME_STATE_KEY = 'swapy:home-state'
const DEFAULT_FILTERS = {
  search: '',
  vehicleType: 'all',
  make: '',
  model: '',
  minPrice: '',
  maxPrice: '',
  maxMileage: '',
  minSleeps: '',
  minBelts: '',
  selfContainedOnly: false,
  location: '',
  radiusKm: '',
  sortBy: 'recent',
  amenities: {
    shower: false,
    toilet: false,
    fridge: false,
    heater: false,
    solar: false,
    kitchen: false,
    awning: false,
    water: false,
  },
}

const AMENITY_FILTERS = [
  { id: 'shower', label: 'Shower', terms: ['shower'] },
  { id: 'toilet', label: 'Toilet', terms: ['toilet', 'wc'] },
  { id: 'fridge', label: 'Fridge', terms: ['fridge', 'refrigerator'] },
  { id: 'heater', label: 'Heater', terms: ['heater', 'diesel heater', 'heating'] },
  { id: 'solar', label: 'Solar', terms: ['solar'] },
  { id: 'kitchen', label: 'Kitchen', terms: ['kitchen', 'sink', 'cooker', 'stove'] },
  { id: 'awning', label: 'Awning', terms: ['awning'] },
  { id: 'water', label: 'Water tank', terms: ['water', 'tank'] },
]

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L)
  if (leafletPromise) return leafletPromise

  leafletPromise = new Promise((resolve, reject) => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }

    const existingScript = document.getElementById('leaflet-js')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.L), { once: true })
      existingScript.addEventListener('error', reject, { once: true })
      return
    }

    const script = document.createElement('script')
    script.id = 'leaflet-js'
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.async = true
    script.onload = () => resolve(window.L)
    script.onerror = reject
    document.body.appendChild(script)
  })

  return leafletPromise
}

const SEARCH_SYNONYMS = {
  camper: ['campervan', 'motorhome', 'rv', 'vanlife', 'selfcontained', 'self-contained'],
  van: ['campervan', 'hiace', 'transit', 'sprinter', 'caravan'],
  motorhome: ['rv', 'camper', 'ducato'],
  auckland: ['akl'],
  christchurch: ['chch', 'canterbury'],
  queenstown: ['otago', 'wanaka'],
  wof: ['warrant', 'roadworthy'],
}

function normalise(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function levenshtein(a, b) {
  if (!a || !b) return Math.max(a.length, b.length)
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index])
  for (let column = 1; column <= b.length; column += 1) rows[0][column] = column
  for (let row = 1; row <= a.length; row += 1) {
    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1
      rows[row][column] = Math.min(
        rows[row - 1][column] + 1,
        rows[row][column - 1] + 1,
        rows[row - 1][column - 1] + cost,
      )
    }
  }
  return rows[a.length][b.length]
}

function fuzzyIncludes(haystack, query) {
  const cleanQuery = normalise(query)
  if (!cleanQuery) return true

  const haystackText = normalise(haystack)
  if (haystackText.includes(cleanQuery)) return true

  const queryWords = cleanQuery.split(' ')
  const haystackWords = haystackText.split(' ')
  const expandedWords = queryWords.flatMap(word => [word, ...(SEARCH_SYNONYMS[word] || [])])

  return expandedWords.every(queryWord => (
    haystackWords.some(word => {
      if (word.includes(queryWord) || queryWord.includes(word)) return true
      const tolerance = queryWord.length > 6 ? 2 : 1
      return levenshtein(word, queryWord) <= tolerance
    })
  ))
}

function parsePriceCeiling(value) {
  const cleanValue = normalise(value)
  if (!cleanValue || cleanValue === 'all' || cleanValue === 'any') return null

  const hasK = cleanValue.includes('k')
  const numericValue = Number(cleanValue.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericValue) || numericValue <= 0) return null

  return hasK ? numericValue * 1000 : numericValue
}

function parsePositiveNumber(value) {
  const cleanValue = normalise(value)
  if (!cleanValue || cleanValue === 'all' || cleanValue === 'any') return null

  const hasK = cleanValue.includes('k')
  const numericValue = Number(cleanValue.replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numericValue) || numericValue < 0) return null

  return hasK ? numericValue * 1000 : numericValue
}

function distanceKm(first, second) {
  if (!first || !second) return null
  const lat1 = Number(first.lat)
  const lon1 = Number(first.lng)
  const lat2 = Number(second.lat)
  const lon2 = Number(second.lng)
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null

  const toRadians = degrees => degrees * Math.PI / 180
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2

  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function vehicleHasAmenity(vehicle, amenity) {
  const text = normalise([
    vehicle.title,
    vehicle.description,
    vehicle.features,
    vehicle.amenities,
  ].flat().join(' '))

  return amenity.terms.some(term => text.includes(normalise(term)))
}

function vehicleSearchText(vehicle) {
  return [
    vehicle.title,
    vehicle.make,
    vehicle.model,
    vehicle.vehicleType,
    vehicle.location,
    vehicle.region,
    vehicle.condition,
    vehicle.wof,
    vehicle.selfContained ? 'self contained certified freedom camping' : 'not self contained',
    `${vehicle.sleeps} berth sleeps`,
    `${vehicle.belts} seat belts`,
  ].join(' ')
}

function vehicleMake(vehicle) {
  return vehicle.make || vehicle.model?.split(' ')[0] || ''
}

function mergeVehiclesWithMocks(products = []) {
  const realProducts = products.filter(Boolean)
  const realIds = new Set(realProducts.map(product => String(product.id)))
  return [...realProducts, ...MOCK_VEHICLES.filter(vehicle => !realIds.has(String(vehicle.id)))]
}

function readSavedSearches() {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_SEARCHES_KEY) || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function readHomeState() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HOME_STATE_KEY) || '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

function filterVehicles(vehicles, filters) {
  const minPrice = parsePositiveNumber(filters.minPrice)
  const maxPrice = parsePositiveNumber(filters.maxPrice)
  const maxMileage = parsePositiveNumber(filters.maxMileage)
  const minSleeps = parsePositiveNumber(filters.minSleeps)
  const minBelts = parsePositiveNumber(filters.minBelts)
  const radiusKm = parsePositiveNumber(filters.radiusKm)
  const origin = filters.location
    ? vehicles.find(vehicle => normalise(vehicle.location) === normalise(filters.location))
    : null
  const selectedAmenities = AMENITY_FILTERS.filter(amenity => filters.amenities?.[amenity.id])

  return vehicles
    .filter(vehicle => filters.vehicleType === 'all' || vehicle.vehicleType === filters.vehicleType || vehicle.category === filters.vehicleType)
    .filter(vehicle => fuzzyIncludes(vehicleMake(vehicle), filters.make))
    .filter(vehicle => fuzzyIncludes(`${vehicle.model} ${vehicle.title}`, filters.model))
    .filter(vehicle => minPrice === null || Number(vehicle.price || 0) >= minPrice)
    .filter(vehicle => maxPrice === null || Number(vehicle.price || 0) <= maxPrice)
    .filter(vehicle => maxMileage === null || Number(vehicle.mileage || 0) <= maxMileage)
    .filter(vehicle => minSleeps === null || Number(vehicle.sleeps || 0) >= minSleeps)
    .filter(vehicle => minBelts === null || Number(vehicle.belts || 0) >= minBelts)
    .filter(vehicle => !filters.selfContainedOnly || Boolean(vehicle.selfContained))
    .filter(vehicle => {
      if (!filters.location) return true
      if (origin && radiusKm !== null) {
        const distance = distanceKm(origin, vehicle)
        return distance !== null && distance <= radiusKm
      }
      return fuzzyIncludes(`${vehicle.location} ${vehicle.region}`, filters.location)
    })
    .filter(vehicle => selectedAmenities.every(amenity => vehicleHasAmenity(vehicle, amenity)))
    .filter(vehicle => fuzzyIncludes(vehicleSearchText(vehicle), filters.search))
    .sort((a, b) => {
      if (filters.sortBy === 'price_asc') return a.price - b.price
      if (filters.sortBy === 'price_desc') return b.price - a.price
      if (filters.sortBy === 'mileage_asc') return a.mileage - b.mileage
      return 0
    })
}

function describeSearch(filters) {
  const parts = [
    filters.search,
    filters.vehicleType !== 'all' ? filters.vehicleType : '',
    filters.make,
    filters.model,
    filters.minPrice ? `from NZ$${Number(parsePositiveNumber(filters.minPrice) || 0).toLocaleString('en-NZ')}` : '',
    filters.maxPrice ? `up to NZ$${Number(parsePriceCeiling(filters.maxPrice) || 0).toLocaleString('en-NZ')}` : '',
    filters.location,
  ].filter(Boolean)
  return parts.join(' - ') || 'All vehicles'
}

export default function Home() {
  const restoredHomeState = useMemo(() => readHomeState(), [])
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES)
  const [loading, setLoading] = useState(false)
  const resultsRef = useRef(null)
  const restoredDraft = { ...DEFAULT_FILTERS, ...(restoredHomeState.draftFilters || {}) }
  const restoredApplied = { ...DEFAULT_FILTERS, ...(restoredHomeState.appliedFilters || {}) }
  const [search, setSearch] = useState(restoredDraft.search)
  const [vehicleType, setVehicleType] = useState(restoredDraft.vehicleType)
  const [make, setMake] = useState(restoredDraft.make)
  const [model, setModel] = useState(restoredDraft.model)
  const [minPrice, setMinPrice] = useState(restoredDraft.minPrice)
  const [maxPrice, setMaxPrice] = useState(restoredDraft.maxPrice)
  const [maxMileage, setMaxMileage] = useState(restoredDraft.maxMileage)
  const [minSleeps, setMinSleeps] = useState(restoredDraft.minSleeps)
  const [minBelts, setMinBelts] = useState(restoredDraft.minBelts)
  const [selfContainedOnly, setSelfContainedOnly] = useState(restoredDraft.selfContainedOnly)
  const [location, setLocation] = useState(restoredDraft.location)
  const [radiusKm, setRadiusKm] = useState(restoredDraft.radiusKm)
  const [amenities, setAmenities] = useState({ ...DEFAULT_FILTERS.amenities, ...(restoredDraft.amenities || {}) })
  const [sortBy, setSortBy] = useState(restoredDraft.sortBy)
  const [appliedFilters, setAppliedFilters] = useState({
    ...restoredApplied,
    amenities: { ...DEFAULT_FILTERS.amenities, ...(restoredApplied.amenities || {}) },
  })
  const [hasSearched, setHasSearched] = useState(Boolean(restoredHomeState.hasSearched))
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false)
  const [viewMode, setViewMode] = useState(restoredHomeState.viewMode || 'grid')
  const [currentPage, setCurrentPage] = useState(restoredHomeState.currentPage || 1)
  const [savedSearches, setSavedSearches] = useState(readSavedSearches)

  useEffect(() => {
    let ignore = false

    async function loadVehicles() {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (!ignore && !error && data?.length) setVehicles(mergeVehiclesWithMocks(data))
      if (!ignore) setLoading(false)
    }

    loadVehicles()
    return () => { ignore = true }
  }, [])

  const makes = useMemo(() => {
    const catalogMakes = NZ_VEHICLE_CATALOG.map(item => item.make)
    const listedMakes = vehicles.map(vehicleMake).filter(Boolean)
    return [...new Set([...catalogMakes, ...listedMakes])].sort()
  }, [vehicles])

  const models = useMemo(() => {
    const selectedCatalog = NZ_VEHICLE_CATALOG.find(item => normalise(item.make) === normalise(make))
    const catalogModels = (selectedCatalog ? selectedCatalog.models : NZ_VEHICLE_CATALOG.flatMap(item => item.models))
      .map(modelName => selectedCatalog ? `${selectedCatalog.make} ${modelName}` : modelName)
    const listedModels = vehicles
      .filter(vehicle => !make || fuzzyIncludes(vehicleMake(vehicle), make))
      .map(vehicle => vehicle.model)
      .filter(Boolean)
    return [...new Set([...catalogModels, ...listedModels])].sort()
  }, [make, vehicles])

  const locations = useMemo(() => (
    [...new Set(vehicles.map(vehicle => vehicle.location).filter(Boolean))].sort()
  ), [vehicles])

  const draftFilters = useMemo(() => ({
    search,
    vehicleType,
    make,
    model,
    minPrice,
    maxPrice,
    maxMileage,
    minSleeps,
    minBelts,
    selfContainedOnly,
    location,
    radiusKm,
    sortBy,
    amenities,
  }), [search, vehicleType, make, model, minPrice, maxPrice, maxMileage, minSleeps, minBelts, selfContainedOnly, location, radiusKm, sortBy, amenities])

  const filtered = useMemo(() => (
    filterVehicles(vehicles, appliedFilters)
  ), [vehicles, appliedFilters])

  const savedSearchResults = useMemo(() => (
    savedSearches.map(savedSearch => {
      const count = filterVehicles(vehicles, savedSearch.filters).length
      return {
        ...savedSearch,
        count,
        newCount: Math.max(0, count - Number(savedSearch.lastCount || 0)),
      }
    })
  ), [savedSearches, vehicles])

  const savedSearchAlerts = savedSearchResults.reduce((total, item) => total + item.newCount, 0)

  useEffect(() => {
    localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(savedSearches))
  }, [savedSearches])

  useEffect(() => {
    sessionStorage.setItem(HOME_STATE_KEY, JSON.stringify({
      draftFilters,
      appliedFilters,
      hasSearched,
      viewMode,
      currentPage,
    }))
  }, [draftFilters, appliedFilters, hasSearched, viewMode, currentPage])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 901px)')
    const syncAdvancedFilters = () => setAdvancedFiltersOpen(mediaQuery.matches)
    syncAdvancedFilters()
    mediaQuery.addEventListener('change', syncAdvancedFilters)
    return () => mediaQuery.removeEventListener('change', syncAdvancedFilters)
  }, [])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageStart = (activePage - 1) * PAGE_SIZE
  const pageVehicles = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const firstVisible = filtered.length ? pageStart + 1 : 0
  const lastVisible = Math.min(pageStart + PAGE_SIZE, filtered.length)

  const scrollToResults = () => {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const applySearch = () => {
    setAppliedFilters(draftFilters)
    setCurrentPage(1)
    setHasSearched(true)
    scrollToResults()
  }

  const showAdvancedFilters = () => {
    setAppliedFilters(draftFilters)
    setCurrentPage(1)
    setHasSearched(true)
    setAdvancedFiltersOpen(true)
    scrollToResults()
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') applySearch()
  }

  const handleFilterChange = setter => value => setter(value)

  const handleSearchChange = handleFilterChange(setSearch)
  const handleVehicleTypeChange = handleFilterChange(setVehicleType)
  const handleMinPriceChange = handleFilterChange(setMinPrice)
  const handleModelChange = handleFilterChange(setModel)
  const handleMaxPriceChange = handleFilterChange(setMaxPrice)
  const handleMaxMileageChange = handleFilterChange(setMaxMileage)
  const handleMinSleepsChange = handleFilterChange(setMinSleeps)
  const handleMinBeltsChange = handleFilterChange(setMinBelts)
  const handleLocationChange = handleFilterChange(setLocation)
  const handleRadiusChange = handleFilterChange(setRadiusKm)
  const handleSortChange = handleFilterChange(setSortBy)

  const handleAmenityChange = amenityId => {
    setAmenities(current => ({ ...current, [amenityId]: !current[amenityId] }))
  }

  const handleMakeChange = value => {
    setMake(value)
    setModel('')
  }

  const clearFilters = () => {
    setSearch('')
    setVehicleType('all')
    setMake('')
    setModel('')
    setMinPrice('')
    setMaxPrice('')
    setMaxMileage('')
    setMinSleeps('')
    setMinBelts('')
    setSelfContainedOnly(false)
    setLocation('')
    setRadiusKm('')
    setAmenities(DEFAULT_FILTERS.amenities)
    setSortBy('recent')
    setAppliedFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  const applySavedSearch = savedSearch => {
    const nextFilters = {
      ...DEFAULT_FILTERS,
      ...savedSearch.filters,
      amenities: {
        ...DEFAULT_FILTERS.amenities,
        ...(savedSearch.filters.amenities || {}),
      },
    }
    setSearch(nextFilters.search)
    setVehicleType(nextFilters.vehicleType)
    setMake(nextFilters.make)
    setModel(nextFilters.model)
    setMinPrice(nextFilters.minPrice)
    setMaxPrice(nextFilters.maxPrice)
    setMaxMileage(nextFilters.maxMileage)
    setMinSleeps(nextFilters.minSleeps)
    setMinBelts(nextFilters.minBelts)
    setSelfContainedOnly(nextFilters.selfContainedOnly)
    setLocation(nextFilters.location)
    setRadiusKm(nextFilters.radiusKm)
    setAmenities(nextFilters.amenities)
    setSortBy(nextFilters.sortBy)
    setAppliedFilters(nextFilters)
    setCurrentPage(1)
    setHasSearched(true)
    scrollToResults()
    setSavedSearches(current => current.map(item => (
      item.id === savedSearch.id ? { ...item, lastCount: savedSearch.count, lastCheckedAt: new Date().toISOString() } : item
    )))
  }

  const saveCurrentSearch = () => {
    const name = describeSearch(appliedFilters)
    const existingIndex = savedSearches.findIndex(savedSearch => JSON.stringify(savedSearch.filters) === JSON.stringify(appliedFilters))
    const nextSearch = {
      id: existingIndex >= 0 ? savedSearches[existingIndex].id : `${Date.now()}`,
      name,
      filters: appliedFilters,
      lastCount: filtered.length,
      lastCheckedAt: new Date().toISOString(),
    }

    setSavedSearches(current => {
      if (existingIndex >= 0) return current.map((item, index) => index === existingIndex ? nextSearch : item)
      return [nextSearch, ...current].slice(0, 8)
    })
  }

  const deleteSavedSearch = searchId => {
    setSavedSearches(current => current.filter(savedSearch => savedSearch.id !== searchId))
  }

  return (
    <div className={`app-shell ${hasSearched ? 'has-searched' : 'is-pre-search'}`}>
      <Navbar search={search} onSearchChange={handleSearchChange} onSearchSubmit={applySearch} onFilterClick={showAdvancedFilters} />

      <header className="hero" style={{ backgroundImage: `url(${heroSeaImage})` }}>
        <div className="hero-inner">
          <h1>Selling cars, campervans and motorhomes made easy.</h1>
          <p>Buy and sell road-trip vehicles across New Zealand with the details that matter: make, model, WOF, mileage, seat belts, sleeps, self-contained status and location.</p>

          <div className="hero-search">
            <input
              type="search"
              placeholder="Try: Hiace self contained Auckland, Sprinter, Chch motorhome..."
              value={search}
              onChange={event => handleSearchChange(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
            <button className="btn btn-primary" type="button" onClick={applySearch}>
              <FiSearch />
              Search
            </button>
          </div>

          <div className="hero-filters">
            <BasicFiltersPanel
              idPrefix="hero"
              makes={makes}
              models={models}
              search={search}
              vehicleType={vehicleType}
              make={make}
              model={model}
              maxPrice={maxPrice}
              sortBy={sortBy}
              onSearchChange={handleSearchChange}
              onVehicleTypeChange={handleVehicleTypeChange}
              onMakeChange={handleMakeChange}
              onModelChange={handleModelChange}
              onMaxPriceChange={handleMaxPriceChange}
              onSortChange={handleSortChange}
              onClear={clearFilters}
              onSave={saveCurrentSearch}
              onSearch={applySearch}
              onAdvancedFilters={showAdvancedFilters}
            />
          </div>
        </div>
      </header>

      <main className="container page-section">
        {savedSearchResults.length > 0 && (
          <section className="saved-searches-panel panel panel-pad">
            <div className="saved-searches-head">
              <div>
                <h2 className="section-title" style={{ fontSize: '1.2rem' }}>Saved searches</h2>
                <p className="section-subtitle">Alerts compare each saved search with the last result count you saw.</p>
              </div>
              <span className={`badge ${savedSearchAlerts ? 'badge-accent' : ''}`}>
                <FiBell />
                {savedSearchAlerts ? `${savedSearchAlerts} new` : 'No new matches'}
              </span>
            </div>

            <div className="saved-searches-list">
              {savedSearchResults.map(savedSearch => (
                <div className="saved-search-item" key={savedSearch.id}>
                  <button className="saved-search-main" type="button" onClick={() => applySavedSearch(savedSearch)}>
                    <strong>{savedSearch.name}</strong>
                    <span>
                      {savedSearch.count} matches
                      {savedSearch.newCount > 0 ? ` · ${savedSearch.newCount} new since last check` : ''}
                    </span>
                  </button>
                  <button className="icon-btn" type="button" onClick={() => deleteSavedSearch(savedSearch.id)} aria-label={`Delete saved search ${savedSearch.name}`}>
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="section-header" ref={resultsRef}>
          <div>
            <h2 className="section-title">{filtered.length} vehicles available</h2>
            <p className="section-subtitle">
              Showing {firstVisible}-{lastVisible} of {filtered.length}. Search handles typos and related terms like RV, self-contained, Chch or camper.
            </p>
          </div>
          <div className="segmented-control" aria-label="View mode">
            <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => setViewMode('grid')}><FiGrid />Grid</button>
            <button className={viewMode === 'map' ? 'is-active' : ''} type="button" onClick={() => setViewMode('map')}><FiMap />Map</button>
            {hasSearched && (
              <button className="mobile-results-filter-button" type="button" onClick={() => setAdvancedFiltersOpen(true)}>
                <FiSliders />
                Filters
              </button>
            )}
          </div>
        </div>

        <div className={hasSearched ? 'search-results-layout' : ''}>
          <div className="search-results-main">
            {loading ? (
              <div className="loading-state">
                <div>
                  <div className="spinner" />
                  Loading vehicles...
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state panel">
                <div>
                  <FiSearch size={42} />
                  <h2>No vehicles found</h2>
                  <p>Try a broader model, region or price range.</p>
                  <button className="btn btn-primary" type="button" onClick={clearFilters}>
                    Clear filters
                    <FiArrowRight />
                  </button>
                </div>
              </div>
            ) : viewMode === 'map' ? (
              <>
                <VehicleMap vehicles={filtered} />
                <div className="map-results-list">
                  {pageVehicles.map(vehicle => <ProductCard key={vehicle.id} product={vehicle} />)}
                </div>
                <PaginationBar
                  currentPage={activePage}
                  totalPages={totalPages}
                  firstVisible={firstVisible}
                  lastVisible={lastVisible}
                  totalItems={filtered.length}
                  onPrevious={() => setCurrentPage(page => Math.max(1, page - 1))}
                  onNext={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                />
              </>
            ) : (
              <>
                <div className="products-grid">
                  {pageVehicles.map(vehicle => <ProductCard key={vehicle.id} product={vehicle} />)}
                </div>
                <PaginationBar
                  currentPage={activePage}
                  totalPages={totalPages}
                  firstVisible={firstVisible}
                  lastVisible={lastVisible}
                  totalItems={filtered.length}
                  onPrevious={() => setCurrentPage(page => Math.max(1, page - 1))}
                  onNext={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
                />
              </>
            )}
          </div>

          {hasSearched && (
            <AdvancedFiltersPanel
              minPrice={minPrice}
              maxPrice={maxPrice}
              maxMileage={maxMileage}
              minSleeps={minSleeps}
              minBelts={minBelts}
              selfContainedOnly={selfContainedOnly}
              location={location}
              radiusKm={radiusKm}
              amenities={amenities}
              locations={locations}
              onMinPriceChange={handleMinPriceChange}
              onMaxPriceChange={handleMaxPriceChange}
              onMaxMileageChange={handleMaxMileageChange}
              onMinSleepsChange={handleMinSleepsChange}
              onMinBeltsChange={handleMinBeltsChange}
              onSelfContainedChange={setSelfContainedOnly}
              onLocationChange={handleLocationChange}
              onRadiusChange={handleRadiusChange}
              onAmenityChange={handleAmenityChange}
              onClear={clearFilters}
              onSearch={applySearch}
              open={advancedFiltersOpen}
              onOpenChange={setAdvancedFiltersOpen}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function BasicFiltersPanel({
  idPrefix,
  makes,
  models,
  vehicleType,
  make,
  model,
  maxPrice,
  sortBy,
  onVehicleTypeChange,
  onMakeChange,
  onModelChange,
  onMaxPriceChange,
  onSortChange,
  onClear,
  onSave,
  onSearch,
  onAdvancedFilters,
}) {
  const makeListId = `${idPrefix}-make-options`
  const modelListId = `${idPrefix}-model-options`
  const priceListId = `${idPrefix}-max-price-options`

  return (
    <section className="filters-panel panel panel-pad">
      <div className="filter-grid">
        <label className="field-group">
          <span>Vehicle type</span>
          <select className="field" value={vehicleType} onChange={event => onVehicleTypeChange(event.target.value)}>
            {VEHICLE_TYPES.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
          </select>
        </label>

        <label className="field-group">
          <span>Make</span>
          <input
            className="field"
            list={makeListId}
            placeholder="Any make"
            value={make}
            onChange={event => onMakeChange(event.target.value)}
          />
          <datalist id={makeListId}>
            {makes.map(vehicleMakeName => <option key={vehicleMakeName} value={vehicleMakeName} />)}
          </datalist>
        </label>

        <label className="field-group">
          <span>Model</span>
          <input
            className="field"
            list={modelListId}
            placeholder="Any model"
            value={model}
            onChange={event => onModelChange(event.target.value)}
          />
          <datalist id={modelListId}>
            {models.map(vehicleModel => <option key={vehicleModel} value={vehicleModel} />)}
          </datalist>
        </label>

        <label className="field-group">
          <span>Max price</span>
          <input
            className="field"
            inputMode="numeric"
            list={priceListId}
            placeholder="Any price"
            value={maxPrice}
            onChange={event => onMaxPriceChange(event.target.value)}
          />
          <datalist id={priceListId}>
            <option value="25000" label="Up to NZ$25k" />
            <option value="50000" label="Up to NZ$50k" />
            <option value="75000" label="Up to NZ$75k" />
            <option value="100000" label="Up to NZ$100k" />
          </datalist>
        </label>

        <label className="field-group">
          <span>Sort</span>
          <select className="field" value={sortBy} onChange={event => onSortChange(event.target.value)}>
            <option value="recent">Most recent</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="mileage_asc">Lowest mileage</option>
          </select>
        </label>
      </div>

      <div className="filter-toolbar">
        <div className="filter-toolbar-actions">
          <button className="btn btn-light" type="button" onClick={onAdvancedFilters}>
            <FiSliders />
            Advanced filters
          </button>
          <button className="btn btn-secondary" type="button" onClick={onClear}>Clear filters</button>
          <button className="btn btn-primary" type="button" onClick={onSearch}>
            <FiSearch />
            Search
          </button>
          <button className="btn btn-dark" type="button" onClick={onSave}>
            <FiBookmark />
            Save search
          </button>
        </div>
      </div>
    </section>
  )
}

function AdvancedFiltersPanel({
  minPrice,
  maxPrice,
  maxMileage,
  minSleeps,
  minBelts,
  selfContainedOnly,
  location,
  radiusKm,
  amenities,
  locations,
  onMinPriceChange,
  onMaxPriceChange,
  onMaxMileageChange,
  onMinSleepsChange,
  onMinBeltsChange,
  onSelfContainedChange,
  onLocationChange,
  onRadiusChange,
  onAmenityChange,
  onClear,
  onSearch,
  open,
  onOpenChange,
}) {
  const handleSummaryClick = event => {
    if (window.matchMedia('(min-width: 901px)').matches) event.preventDefault()
  }

  return (
    <details className="advanced-filters panel panel-pad" aria-label="Filtros" open={open} onToggle={event => onOpenChange(event.currentTarget.open)}>
      <summary className="advanced-filters-head" onClick={handleSummaryClick}>
        <div>
          <h2 className="section-title" style={{ fontSize: '1.1rem' }}>Filtros</h2>
          <p className="section-subtitle">Ajusta los resultados cuando quieras.</p>
        </div>
        <FiSliders />
      </summary>

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
        <label className="field-group">
          <span>City</span>
          <input className="field" list="advanced-location-options" placeholder="Any city" value={location} onChange={event => onLocationChange(event.target.value)} />
          <datalist id="advanced-location-options">
            {locations.map(place => <option key={place} value={place} />)}
          </datalist>
        </label>
        <label className="field-group">
          <span>Radius</span>
          <input className="field" inputMode="numeric" placeholder="Any radius" value={radiusKm} onChange={event => onRadiusChange(event.target.value)} />
        </label>
        <RangeSlider
          min={0}
          max={500}
          step={25}
          minValue="0"
          maxValue={radiusKm}
          minLabel="Exact"
          maxLabel="500 km"
          single
          onMaxChange={onRadiusChange}
        />
      </div>

      <div className="advanced-filter-group">
        <strong>Vehicle details</strong>
        <label className="field-group">
          <span>Max mileage</span>
          <input className="field" inputMode="numeric" placeholder="150000" value={maxMileage} onChange={event => onMaxMileageChange(event.target.value)} />
        </label>
        <div className="dual-field">
          <label className="field-group">
            <span>Sleeps min</span>
            <input className="field" inputMode="numeric" placeholder="2" value={minSleeps} onChange={event => onMinSleepsChange(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Belts min</span>
            <input className="field" inputMode="numeric" placeholder="3" value={minBelts} onChange={event => onMinBeltsChange(event.target.value)} />
          </label>
        </div>
        <label className="toggle-row">
          <input type="checkbox" checked={selfContainedOnly} onChange={event => onSelfContainedChange(event.target.checked)} />
          Self-contained only
        </label>
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

      <div className="advanced-filter-actions">
        <button className="btn btn-secondary" type="button" onClick={onClear}>Clear</button>
        <button className="btn btn-primary" type="button" onClick={onSearch}>
          <FiSearch />
          Search
        </button>
      </div>
    </details>
  )
}

function RangeSlider({
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

function PaginationBar({ currentPage, totalPages, firstVisible, lastVisible, totalItems, onPrevious, onNext }) {
  if (totalItems <= PAGE_SIZE) return null

  return (
    <nav className="pagination-bar" aria-label="Product pages">
      <button className="btn btn-secondary" type="button" disabled={currentPage === 1} onClick={onPrevious}>
        <FiArrowLeft />
        Previous
      </button>
      <span>
        {firstVisible}-{lastVisible} of {totalItems}
        <strong> Page {currentPage} of {totalPages}</strong>
      </span>
      <button className="btn btn-primary" type="button" disabled={currentPage === totalPages} onClick={onNext}>
        Next
        <FiArrowRight />
      </button>
    </nav>
  )
}

function VehicleMap({ vehicles }) {
  const mapRef = useRef(null)
  const leafletMapRef = useRef(null)
  const markerLayerRef = useRef(null)
  const [mapError, setMapError] = useState('')
  const [mapReady, setMapReady] = useState(false)

  useEffect(() => {
    let ignore = false

    async function setupMap() {
      try {
        const L = await loadLeaflet()
        if (ignore || !mapRef.current || leafletMapRef.current) return

        const map = L.map(mapRef.current, {
          center: [-41.2, 172.8],
          zoom: 5,
          minZoom: 5,
          maxZoom: 19,
          scrollWheelZoom: true,
          zoomControl: true,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        markerLayerRef.current = L.layerGroup().addTo(map)
        leafletMapRef.current = map
        setMapReady(true)
        setTimeout(() => map.invalidateSize(), 120)
      } catch {
        if (!ignore) setMapError('Map service could not load. Check your connection and try again.')
      }
    }

    setupMap()

    return () => {
      ignore = true
      leafletMapRef.current?.remove()
      leafletMapRef.current = null
      markerLayerRef.current = null
      setMapReady(false)
    }
  }, [])

  useEffect(() => {
    const L = window.L
    const map = leafletMapRef.current
    const layer = markerLayerRef.current
    if (!mapReady || !L || !map || !layer) return

    layer.clearLayers()
    const bounds = []

    vehicles.forEach(vehicle => {
      if (!vehicle.lat || !vehicle.lng) return
      const marker = L.marker([vehicle.lat, vehicle.lng], {
        icon: L.divIcon({
          className: 'swapy-map-marker',
          html: `<span>NZ${Math.round(Number(vehicle.price || 0) / 1000)}k</span>`,
          iconSize: [62, 38],
          iconAnchor: [31, 38],
        }),
      }).addTo(layer)

      marker.bindPopup(`
        <strong>${vehicle.title}</strong>
        <p>${vehicle.location || 'New Zealand'} - ${vehicle.model || ''}</p>
        <a href="/product/${vehicle.id}">View listing</a>
      `)
      bounds.push([vehicle.lat, vehicle.lng])
    })

    if (bounds.length) {
      map.fitBounds(bounds, { padding: [34, 34], maxZoom: 8 })
    }
  }, [vehicles, mapReady])

  useEffect(() => {
    const map = leafletMapRef.current
    if (!mapReady || !map) return
    const timer = setTimeout(() => map.invalidateSize(), 80)
    return () => clearTimeout(timer)
  }, [mapReady, vehicles.length])

  return (
    <section className="map-layout">
      <div className="street-map panel">
        <div className="street-map-canvas" ref={mapRef} aria-label="Interactive New Zealand vehicle map" />
        {mapError && <div className="map-error">{mapError}</div>}
      </div>
    </section>
  )
}
