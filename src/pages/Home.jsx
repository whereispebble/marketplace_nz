import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiGrid, FiMap, FiSearch } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import heroVideo from '../assets/hero-video-nz-optimized.mp4'
import { MOCK_VEHICLES, NZ_VEHICLE_CATALOG, VEHICLE_TYPES } from '../data/mockVehicles'

let leafletPromise
const PAGE_SIZE = 50

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

export default function Home() {
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [vehicleType, setVehicleType] = useState('all')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState('grid')
  const [currentPage, setCurrentPage] = useState(1)

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

  const filtered = useMemo(() => {
    const priceCeiling = parsePriceCeiling(maxPrice)

    return vehicles
      .filter(vehicle => vehicleType === 'all' || vehicle.vehicleType === vehicleType || vehicle.category === vehicleType)
      .filter(vehicle => fuzzyIncludes(vehicleMake(vehicle), make))
      .filter(vehicle => fuzzyIncludes(`${vehicle.model} ${vehicle.title}`, model))
      .filter(vehicle => priceCeiling === null || Number(vehicle.price || 0) <= priceCeiling)
      .filter(vehicle => fuzzyIncludes(vehicleSearchText(vehicle), search))
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price
        if (sortBy === 'price_desc') return b.price - a.price
        if (sortBy === 'mileage_asc') return a.mileage - b.mileage
        return 0
      })
  }, [vehicles, search, vehicleType, make, model, maxPrice, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageStart = (activePage - 1) * PAGE_SIZE
  const pageVehicles = filtered.slice(pageStart, pageStart + PAGE_SIZE)
  const firstVisible = filtered.length ? pageStart + 1 : 0
  const lastVisible = Math.min(pageStart + PAGE_SIZE, filtered.length)

  const handleFilterChange = setter => value => {
    setter(value)
    setCurrentPage(1)
  }

  const handleSearchChange = handleFilterChange(setSearch)
  const handleVehicleTypeChange = handleFilterChange(setVehicleType)
  const handleModelChange = handleFilterChange(setModel)
  const handleMaxPriceChange = handleFilterChange(setMaxPrice)
  const handleSortChange = handleFilterChange(setSortBy)

  const handleMakeChange = value => {
    setMake(value)
    setModel('')
    setCurrentPage(1)
  }

  const clearFilters = () => {
    setSearch('')
    setVehicleType('all')
    setMake('')
    setModel('')
    setMaxPrice('')
    setCurrentPage(1)
  }

  return (
    <div className="app-shell">
      <Navbar search={search} onSearchChange={handleSearchChange} />

      <header className="hero">
        <video className="hero-video" autoPlay muted loop playsInline preload="auto" aria-hidden="true">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-inner">
          <h1>Selling cars, campervans and motorhomes made easy.</h1>
          <p>Buy and sell road-trip vehicles across New Zealand with the details that matter: make, model, WOF, mileage, seat belts, sleeps, self-contained status and location.</p>

          <div className="hero-search">
            <input
              type="search"
              placeholder="Try: Hiace self contained Auckland, Sprinter, Chch motorhome..."
              value={search}
              onChange={event => handleSearchChange(event.target.value)}
            />
            <button className="btn btn-primary" type="button">
              <FiSearch />
              Search
            </button>
          </div>

          <div className="metrics">
            <div className="metric"><strong>NZ-wide</strong><span>map-based discovery</span></div>
            <div className="metric"><strong>WOF</strong><span>shown on every listing</span></div>
            <div className="metric"><strong>Next</strong><span>selected cars expansion</span></div>
          </div>
        </div>
      </header>

      <main className="container page-section">
        <section className="filters-panel panel panel-pad">
          <div className="filter-grid">
            <label className="field-group">
              <span>Vehicle type</span>
              <select className="field" value={vehicleType} onChange={event => handleVehicleTypeChange(event.target.value)}>
                {VEHICLE_TYPES.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </label>

            <label className="field-group">
              <span>Make</span>
              <input
                className="field"
                list="make-options"
                placeholder="Any make"
                value={make}
                onChange={event => handleMakeChange(event.target.value)}
              />
              <datalist id="make-options">
                {makes.map(vehicleMakeName => <option key={vehicleMakeName} value={vehicleMakeName} />)}
              </datalist>
            </label>

            <label className="field-group">
              <span>Model</span>
              <input
                className="field"
                list="model-options"
                placeholder="Any model"
                value={model}
                onChange={event => handleModelChange(event.target.value)}
              />
              <datalist id="model-options">
                {models.map(vehicleModel => <option key={vehicleModel} value={vehicleModel} />)}
              </datalist>
            </label>

            <label className="field-group">
              <span>Max price</span>
              <input
                className="field"
                inputMode="numeric"
                list="max-price-options"
                placeholder="Any price"
                value={maxPrice}
                onChange={event => handleMaxPriceChange(event.target.value)}
              />
              <datalist id="max-price-options">
                <option value="25000" label="Up to NZ$25k" />
                <option value="50000" label="Up to NZ$50k" />
                <option value="75000" label="Up to NZ$75k" />
                <option value="100000" label="Up to NZ$100k" />
              </datalist>
            </label>

            <label className="field-group">
              <span>Sort</span>
              <select className="field" value={sortBy} onChange={event => handleSortChange(event.target.value)}>
                <option value="recent">Most recent</option>
                <option value="price_asc">Price: low to high</option>
                <option value="price_desc">Price: high to low</option>
                <option value="mileage_asc">Lowest mileage</option>
              </select>
            </label>
          </div>
        </section>

        <div className="section-header">
          <div>
            <h2 className="section-title">{filtered.length} vehicles available</h2>
            <p className="section-subtitle">
              Showing {firstVisible}-{lastVisible} of {filtered.length}. Search handles typos and related terms like RV, self-contained, Chch or camper.
            </p>
          </div>
          <div className="segmented-control" aria-label="View mode">
            <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" onClick={() => setViewMode('grid')}><FiGrid />Grid</button>
            <button className={viewMode === 'map' ? 'is-active' : ''} type="button" onClick={() => setViewMode('map')}><FiMap />Map</button>
          </div>
        </div>

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
            <VehicleMap vehicles={pageVehicles} />
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
      </main>
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

  return (
    <section className="map-layout">
      <div className="street-map panel">
        <div className="street-map-canvas" ref={mapRef} aria-label="Interactive New Zealand vehicle map" />
        {mapError && <div className="map-error">{mapError}</div>}
      </div>

      <div className="map-list">
        {vehicles.map(vehicle => (
          <Link className="panel panel-pad map-listing" key={vehicle.id} to={`/product/${vehicle.id}`}>
            <img src={vehicle.image} alt={vehicle.title} />
            <div>
              <strong>{vehicle.title}</strong>
              <p className="section-subtitle">{vehicle.location} - {vehicle.model} - {vehicle.selfContained ? 'Self-contained' : 'Not self-contained'}</p>
            </div>
            <span className="badge badge-accent map-price-badge">NZ${Number(vehicle.price || 0).toLocaleString('en-NZ')}</span>
          </Link>
        ))}
      </div>
    </section>
  )
}
