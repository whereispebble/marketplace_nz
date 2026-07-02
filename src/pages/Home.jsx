import { useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowRight, FiGrid, FiMap, FiSearch } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import ProductCard from '../components/ProductCard'
import Navbar from '../components/Navbar'
import heroVideo from '../assets/hero-video-nz-optimized.mp4'
import { MOCK_VEHICLES, VEHICLE_TYPES } from '../data/mockVehicles'

const NZ_BOUNDS = {
  minLat: -47.8,
  maxLat: -34.2,
  minLng: 165.2,
  maxLng: 179.8,
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

function mapPosition(vehicle) {
  const left = ((vehicle.lng - NZ_BOUNDS.minLng) / (NZ_BOUNDS.maxLng - NZ_BOUNDS.minLng)) * 100
  const top = (1 - ((vehicle.lat - NZ_BOUNDS.minLat) / (NZ_BOUNDS.maxLat - NZ_BOUNDS.minLat))) * 100
  return {
    left: `${Math.min(92, Math.max(8, left))}%`,
    top: `${Math.min(88, Math.max(8, top))}%`,
  }
}

export default function Home() {
  const [vehicles, setVehicles] = useState(MOCK_VEHICLES)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [vehicleType, setVehicleType] = useState('all')
  const [model, setModel] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [sortBy, setSortBy] = useState('recent')
  const [viewMode, setViewMode] = useState('grid')

  useEffect(() => {
    let ignore = false

    async function loadVehicles() {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false })
      if (!ignore && !error && data?.length) setVehicles(data)
      if (!ignore) setLoading(false)
    }

    loadVehicles()
    return () => { ignore = true }
  }, [])

  const models = useMemo(() => {
    return [...new Set(vehicles.map(vehicle => vehicle.model).filter(Boolean))].sort()
  }, [vehicles])

  const filtered = useMemo(() => {
    const priceCeiling = parsePriceCeiling(maxPrice)

    return vehicles
      .filter(vehicle => vehicleType === 'all' || vehicle.vehicleType === vehicleType || vehicle.category === vehicleType)
      .filter(vehicle => fuzzyIncludes(`${vehicle.model} ${vehicle.title}`, model))
      .filter(vehicle => priceCeiling === null || Number(vehicle.price || 0) <= priceCeiling)
      .filter(vehicle => fuzzyIncludes(vehicleSearchText(vehicle), search))
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price
        if (sortBy === 'price_desc') return b.price - a.price
        if (sortBy === 'mileage_asc') return a.mileage - b.mileage
        return 0
      })
  }, [vehicles, search, vehicleType, model, maxPrice, sortBy])

  const clearFilters = () => {
    setSearch('')
    setVehicleType('all')
    setModel('')
    setMaxPrice('')
  }

  return (
    <div className="app-shell">
      <Navbar search={search} onSearchChange={setSearch} />

      <header className="hero">
        <video className="hero-video" autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
          <source src={heroVideo} type="video/mp4" />
        </video>
        <div className="hero-inner">
          <span className="eyebrow">New Zealand campervans, motorhomes and road-trip vehicles</span>
          <h1>Find the right van for Aotearoa.</h1>
          <p>Browse campervans and motorhomes with the details that matter in NZ: WOF, mileage, seat belts, sleeps, self-contained status and location.</p>

          <div className="hero-search">
            <input
              type="search"
              placeholder="Try: Hiace self contained Auckland, Sprinter, Chch motorhome..."
              value={search}
              onChange={event => setSearch(event.target.value)}
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
              <select className="field" value={vehicleType} onChange={event => setVehicleType(event.target.value)}>
                {VEHICLE_TYPES.map(type => <option key={type.id} value={type.id}>{type.name}</option>)}
              </select>
            </label>

            <label className="field-group">
              <span>Model</span>
              <input
                className="field"
                list="model-options"
                placeholder="Any model"
                value={model}
                onChange={event => setModel(event.target.value)}
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
                onChange={event => setMaxPrice(event.target.value)}
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
              <select className="field" value={sortBy} onChange={event => setSortBy(event.target.value)}>
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
            <p className="section-subtitle">Search handles typos and related terms like RV, self-contained, Chch or camper.</p>
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
          <VehicleMap vehicles={filtered} />
        ) : (
          <div className="products-grid">
            {filtered.map(vehicle => <ProductCard key={vehicle.id} product={vehicle} />)}
          </div>
        )}
      </main>
    </div>
  )
}

function VehicleMap({ vehicles }) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const dragRef = useRef(null)

  const clampZoom = value => Math.min(2.8, Math.max(0.85, value))

  const zoomBy = amount => {
    setZoom(current => clampZoom(Number((current + amount).toFixed(2))))
  }

  const resetMap = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  const handleWheel = event => {
    event.preventDefault()
    setZoom(current => clampZoom(Number((current + (event.deltaY > 0 ? -0.12 : 0.12)).toFixed(2))))
  }

  const handlePointerDown = event => {
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handlePointerMove = event => {
    if (!dragRef.current) return
    const nextX = dragRef.current.panX + event.clientX - dragRef.current.startX
    const nextY = dragRef.current.panY + event.clientY - dragRef.current.startY
    setPan({ x: nextX, y: nextY })
  }

  const handlePointerUp = event => {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null
    }
  }

  return (
    <section className="map-layout">
      <div className="nz-map panel">
        <div className="map-controls" aria-label="Map controls">
          <button type="button" onClick={() => zoomBy(0.2)}>+</button>
          <button type="button" onClick={() => zoomBy(-0.2)}>-</button>
          <button type="button" onClick={resetMap}>Reset</button>
        </div>
        <div className="map-hint">Drag to move · Scroll to zoom</div>
        <div
          className="map-viewport"
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="map-canvas"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
          >
            <svg className="nz-map-art" viewBox="0 0 1000 1400" aria-hidden="true">
              <defs>
                <linearGradient id="land" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#d9f1e6" />
                </linearGradient>
                <linearGradient id="ridge" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#8fd7b6" />
                  <stop offset="100%" stopColor="#14BC7D" />
                </linearGradient>
              </defs>
              <path className="map-sea-line" d="M150 260C260 160 430 120 590 170C770 226 880 380 860 565C845 708 715 790 700 940C684 1100 568 1244 398 1278C255 1307 130 1251 76 1140" />
              <path className="nz-land" d="M622 154C674 158 730 186 762 230C801 284 797 340 768 387C742 430 710 459 720 508C729 551 779 572 781 624C783 676 734 714 686 700C638 686 618 648 576 657C532 666 505 708 456 696C408 685 393 639 417 601C446 555 422 520 391 486C350 441 338 387 366 337C388 298 431 285 455 248C491 192 546 148 622 154Z" />
              <path className="nz-land" d="M426 658C486 646 544 684 558 742C571 794 536 832 501 866C459 907 449 954 432 1008C407 1085 346 1154 262 1182C198 1204 126 1195 92 1145C59 1096 82 1037 135 1008C184 981 218 948 231 891C247 816 290 748 348 704C373 685 395 664 426 658Z" />
              <path className="nz-land small-island" d="M292 1220C326 1212 361 1225 374 1252C387 1278 368 1302 334 1308C302 1314 266 1299 259 1271C253 1248 265 1227 292 1220Z" />
              <path className="map-ridge" d="M648 230C612 292 590 348 608 412C625 470 638 526 612 594" />
              <path className="map-ridge" d="M494 718C438 779 389 854 364 942C340 1024 295 1094 224 1148" />
              <path className="map-road" d="M626 190C684 280 677 385 640 470C608 544 590 608 642 682" />
              <path className="map-road" d="M454 690C404 750 368 820 344 900C318 987 284 1062 210 1130" />
              <text className="map-label" x="674" y="246">Auckland</text>
              <text className="map-label" x="610" y="445">Rotorua</text>
              <text className="map-label" x="664" y="604">Wellington</text>
              <text className="map-label" x="390" y="720">Nelson</text>
              <text className="map-label" x="318" y="978">Christchurch</text>
              <text className="map-label" x="218" y="1128">Queenstown</text>
            </svg>
            {vehicles.map(vehicle => (
              <a
                key={vehicle.id}
                className="map-pin"
                href={`/product/${vehicle.id}`}
                style={mapPosition(vehicle)}
                title={`${vehicle.title} in ${vehicle.location}`}
              >
                <span>NZ${Math.round(vehicle.price / 1000)}k</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="map-list">
        {vehicles.map(vehicle => (
          <article className="panel panel-pad map-listing" key={vehicle.id}>
            <img src={vehicle.image} alt={vehicle.title} />
            <div>
              <strong>{vehicle.title}</strong>
              <p className="section-subtitle">{vehicle.location} · {vehicle.model} · {vehicle.selfContained ? 'Self-contained' : 'Not self-contained'}</p>
            </div>
            <span className="badge badge-accent">NZ${Number(vehicle.price || 0).toLocaleString('en-NZ')}</span>
          </article>
        ))}
      </div>
    </section>
  )
}
