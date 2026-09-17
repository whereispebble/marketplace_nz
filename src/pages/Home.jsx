/**
 * Portada y buscador.
 *
 * Este fichero coordina; no dibuja casi nada. Guarda el estado de la busqueda y
 * lo reparte entre las piezas que si dibujan:
 *
 *   components/home/HeroSearch           cabecera con la caja de busqueda
 *   components/home/ActiveFilterBar      distintivos de los filtros aplicados
 *   components/home/ResultsHeader        contador, orden y modo de vista
 *   components/home/ResultsView          carga, vacio, parrilla o mapa
 *   components/home/AdvancedFiltersModal panel de filtros avanzados
 *
 * Y se apoya en:
 *   hooks/useVehicles          carga los anuncios visibles
 *   services/vehicleFilters    filtra y ordena (funciones puras)
 *   constants/filters          catalogos de opciones y estado inicial
 *
 * De otros usuarios solo llegan anuncios publicados: los borradores los filtra
 * la propia base de datos con sus politicas de seguridad.
 */

import { useEffect, useMemo, useRef, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HeroSearch from '../components/home/HeroSearch'
import ActiveFilterBar from '../components/home/ActiveFilterBar'
import ResultsHeader from '../components/home/ResultsHeader'
import ResultsView from '../components/home/ResultsView'
import AdvancedFiltersModal from '../components/home/AdvancedFiltersModal'
import { useVehicles } from '../hooks/useVehicles'
import { DEFAULT_FILTERS, PAGE_SIZE } from '../constants/filters'
import {
  activeFilterChips,
  describeSearch,
  filterVehicles,
  filtersKey,
  normalise,
  stripMakePrefix,
  vehicleMake,
  vehicleYear,
} from '../services/vehicleFilters'
import { NZ_VEHICLE_CATALOG } from '../data/nzVehicleCatalog'
import { useSession } from '../services/session'
import { supabase } from '../services/supabase'
import { getSavedSearchesError, SAVED_SEARCHES_UNAVAILABLE } from '../services/savedSearches'
import heroSeaImage from '../assets/new-zealand-sea.webp.jpg'
import LoadingScreen from '../components/LoadingScreen'

/** Clave del navegador donde se guardan las busquedas que el usuario archiva. */
const SAVED_SEARCHES_KEY = 'swapy:saved-searches'

/** Clave donde se recuerda el estado de la portada al navegar y volver. */
const HOME_STATE_KEY = 'swapy:home-state'

function readSavedSearches(dev) {
  if (!dev) return []
  try {
    const saved = JSON.parse(sessionStorage.getItem(SAVED_SEARCHES_KEY + ':dev') || '[]')
    return Array.isArray(saved) ? saved : []
  } catch {
    return []
  }
}

function readHomeState(scope) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(HOME_STATE_KEY + scope) || '{}')
    return saved && typeof saved === 'object' ? saved : {}
  } catch {
    return {}
  }
}

export default function Home() {
  const { user, loading } = useSession()
  if (loading) return <LoadingScreen fullPage label="Loading marketplace" />
  return <HomeContent key={user?.id || 'guest'} user={user} />
}

function HomeContent({ user }) {
  const scope = ':' + (user?.id || 'guest')
  const restoredHomeState = useMemo(() => readHomeState(scope), [scope])
  // Anuncios visibles y estado de carga: lo resuelve el hook.
  const { vehicles, loading, error: vehiclesError } = useVehicles()
  const resultsRef = useRef(null)
  const restoredDraft = { ...DEFAULT_FILTERS, ...(restoredHomeState.draftFilters || {}) }
  const restoredApplied = { ...DEFAULT_FILTERS, ...(restoredHomeState.appliedFilters || {}) }
  const [search, setSearch] = useState(restoredDraft.search)
  const [vehicleType, setVehicleType] = useState(restoredDraft.vehicleType)
  const [make, setMake] = useState(restoredDraft.make)
  const [model, setModel] = useState(restoredDraft.model)
  const [minYear, setMinYear] = useState(restoredDraft.minYear)
  const [maxYear, setMaxYear] = useState(restoredDraft.maxYear)
  const [transmission, setTransmission] = useState(restoredDraft.transmission)
  const [fuel, setFuel] = useState(restoredDraft.fuel)
  const [drivetrain, setDrivetrain] = useState(restoredDraft.drivetrain)
  const [minEngineCc, setMinEngineCc] = useState(restoredDraft.minEngineCc)
  const [maxEngineCc, setMaxEngineCc] = useState(restoredDraft.maxEngineCc)
  const [minSeats, setMinSeats] = useState(restoredDraft.minSeats)
  const [minDoors, setMinDoors] = useState(restoredDraft.minDoors)
  const [condition, setCondition] = useState(restoredDraft.condition)
  const [wofValidity, setWofValidity] = useState(restoredDraft.wofValidity)
  const [regoValidity, setRegoValidity] = useState(restoredDraft.regoValidity)
  const [layout, setLayout] = useState(restoredDraft.layout)
  const [minLengthM, setMinLengthM] = useState(restoredDraft.minLengthM)
  const [maxLengthM, setMaxLengthM] = useState(restoredDraft.maxLengthM)
  const [maxWeightKg, setMaxWeightKg] = useState(restoredDraft.maxWeightKg)
  const [carLicenceOnly, setCarLicenceOnly] = useState(restoredDraft.carLicenceOnly)
  const [minFreshWaterL, setMinFreshWaterL] = useState(restoredDraft.minFreshWaterL)
  const [minGreyWaterL, setMinGreyWaterL] = useState(restoredDraft.minGreyWaterL)
  const [minBatteryAh, setMinBatteryAh] = useState(restoredDraft.minBatteryAh)
  const [minSolarW, setMinSolarW] = useState(restoredDraft.minSolarW)
  const [toiletType, setToiletType] = useState(restoredDraft.toiletType)
  // Posicion del dispositivo: solo se usa para ordenar por cercania, no se
  // guarda con los filtros.
  const [devicePoint, setDevicePoint] = useState(null)
  const [locatingDevice, setLocatingDevice] = useState(false)
  const [minPrice, setMinPrice] = useState(restoredDraft.minPrice)
  const [maxPrice, setMaxPrice] = useState(restoredDraft.maxPrice)
  const [maxMileage, setMaxMileage] = useState(restoredDraft.maxMileage)
  const [minSleeps, setMinSleeps] = useState(restoredDraft.minSleeps)
  const [minBelts, setMinBelts] = useState(restoredDraft.minBelts)
  const [selfContainedOnly, setSelfContainedOnly] = useState(restoredDraft.selfContainedOnly)
  const [location, setLocation] = useState(restoredDraft.location)
  const [locationPoint, setLocationPoint] = useState(restoredDraft.locationPoint || null)
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
  const [savedSearches, setSavedSearches] = useState(() => readSavedSearches(user?.isDevUser))
  const [searchesReady, setSearchesReady] = useState(Boolean(user?.isDevUser || !user))
  const [searchError, setSearchError] = useState('')
  const lastPersistedSearches = useRef(savedSearches)
  const searchWrites = useRef(Promise.resolve())
  useEffect(() => {
    if (!user || user.isDevUser) return
    let ignore = false
    supabase.from('saved_searches').select('searches').eq('user_id', user.id).maybeSingle().then(({ data, error }) => {
      if (ignore) return
      // Saved searches are optional on page load. A missing service must not
      // make healthy listing results look broken; explain it only on save.
      if (error) { setSearchesReady(false); return }
      const searches = Array.isArray(data?.searches) ? data.searches : []
      lastPersistedSearches.current = searches
      setSavedSearches(searches)
      setSearchesReady(true)
    }).catch(() => { if (!ignore) setSearchesReady(false) })
    return () => { ignore = true }
  }, [user])

  // Catalogo de Trade Me como base, mas cualquier marca que aparezca en los
  // anuncios y no este en la lista.
  const makes = useMemo(() => {
    const fromCatalog = NZ_VEHICLE_CATALOG.map(entry => entry.make)
    const fromListings = vehicles.map(vehicleMake).filter(Boolean)
    return [...new Set([...fromCatalog, ...fromListings])].sort((a, b) => a.localeCompare(b))
  }, [vehicles])

  // Con una marca elegida se muestran solo sus modelos: los del catalogo mas los
  // que aparezcan en anuncios reales de esa marca. Sin marca, los de anuncios.
  const models = useMemo(() => {
    const listingModels = vehicles
      .filter(vehicle => !make || normalise(vehicleMake(vehicle)) === normalise(make))
      .map(vehicle => stripMakePrefix(vehicle.model, vehicleMake(vehicle)))
      .filter(Boolean)

    if (!make) return [...new Set(listingModels)].sort((a, b) => a.localeCompare(b))

    const catalogEntry = NZ_VEHICLE_CATALOG.find(entry => normalise(entry.make) === normalise(make))
    return [...new Set([...(catalogEntry?.models || []), ...listingModels])].sort((a, b) => a.localeCompare(b))
  }, [vehicles, make])

  const years = useMemo(() => (
    [...new Set(vehicles.map(vehicleYear).filter(Boolean))].sort((a, b) => b - a)
  ), [vehicles])

  const draftFilters = useMemo(() => ({
    search,
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
    minPrice,
    maxPrice,
    maxMileage,
    minSleeps,
    minBelts,
    selfContainedOnly,
    location,
    locationPoint,
    sortBy,
    amenities,
  }), [search, vehicleType, make, model, minYear, maxYear, transmission, fuel, drivetrain, minEngineCc, maxEngineCc, minSeats, minDoors, condition, wofValidity, regoValidity, layout, minLengthM, maxLengthM, maxWeightKg, carLicenceOnly, minFreshWaterL, minGreyWaterL, minBatteryAh, minSolarW, toiletType, minPrice, maxPrice, maxMileage, minSleeps, minBelts, selfContainedOnly, location, locationPoint, sortBy, amenities])

  const filtered = useMemo(() => (
    filterVehicles(vehicles, {
      ...appliedFilters,
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
      minPrice,
      maxPrice,
      maxMileage,
      minSleeps,
      minBelts,
      selfContainedOnly,
      location,
      locationPoint,
      amenities,
      sortBy,
      sortPoint: devicePoint,
    })
  ), [vehicles, devicePoint, sortBy, appliedFilters, make, model, minYear, maxYear, transmission, fuel, drivetrain, minEngineCc, maxEngineCc, minSeats, minDoors, condition, wofValidity, regoValidity, layout, minLengthM, maxLengthM, maxWeightKg, carLicenceOnly, minFreshWaterL, minGreyWaterL, minBatteryAh, minSolarW, toiletType, minPrice, maxPrice, maxMileage, minSleeps, minBelts, selfContainedOnly, location, locationPoint, amenities])

  const appliedChips = useMemo(() => activeFilterChips(appliedFilters), [appliedFilters])

  useEffect(() => {
    if (!searchesReady || lastPersistedSearches.current === savedSearches) return
    lastPersistedSearches.current = savedSearches
    if (user?.isDevUser) {
      try { sessionStorage.setItem(SAVED_SEARCHES_KEY + ':dev', JSON.stringify(savedSearches)) } catch { /* optional local cache */ }
      return
    }
    if (!user) return
    let ignore = false
    searchWrites.current = searchWrites.current.catch(() => {}).then(async () => {
      const { error } = await supabase.from('saved_searches').upsert({ user_id: user.id, searches: savedSearches })
      if (!ignore) setSearchError(error ? getSavedSearchesError(error, 'save') : '')
    }).catch(error => { if (!ignore) setSearchError(getSavedSearchesError(error, 'save')) })
    return () => { ignore = true }
  }, [savedSearches, searchesReady, user])

  useEffect(() => {
    try { sessionStorage.setItem(HOME_STATE_KEY + scope, JSON.stringify({
      draftFilters,
      appliedFilters,
      hasSearched,
      viewMode,
      currentPage,
    })) } catch { /* Navigation state is optional when storage is blocked. */ }
  }, [draftFilters, appliedFilters, hasSearched, viewMode, currentPage, scope])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const activePage = Math.min(currentPage, totalPages)
  const pageStart = (activePage - 1) * PAGE_SIZE
  const pageVehicles = filtered.slice(pageStart, pageStart + PAGE_SIZE)

  useEffect(() => {
    if (!advancedFiltersOpen) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') setAdvancedFiltersOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [advancedFiltersOpen])

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

  const QUICK_FILTER_SETTERS = {
    search: setSearch,
    vehicleType: setVehicleType,
    make: setMake,
    model: setModel,
    minYear: setMinYear,
    maxYear: setMaxYear,
    transmission: setTransmission,
    fuel: setFuel,
    drivetrain: setDrivetrain,
    condition: setCondition,
    layout: setLayout,
    minPrice: setMinPrice,
    maxPrice: setMaxPrice,
    maxMileage: setMaxMileage,
    minSleeps: setMinSleeps,
    minBelts: setMinBelts,
    selfContainedOnly: setSelfContainedOnly,
    location: setLocation,
    sortBy: setSortBy,
  }

  const applyQuickFilter = updates => {
    Object.entries(updates).forEach(([key, value]) => QUICK_FILTER_SETTERS[key]?.(value))
    // Una sugerencia escribe el nombre pero no fija coordenadas: el radio
    // sigue necesitando una eleccion en el autocompletado.
    if ('location' in updates) setLocationPoint(null)
    setAppliedFilters({ ...draftFilters, ...updates, ...('location' in updates ? { locationPoint: null } : {}) })
    setCurrentPage(1)
    setHasSearched(true)
    scrollToResults()
  }

  const FILTER_RESETTERS = {
    search: setSearch,
    fuel: () => setFuel('all'),
    drivetrain: () => setDrivetrain('all'),
    minSeats: setMinSeats,
    minDoors: setMinDoors,
    condition: () => setCondition('all'),
    wofValidity: () => setWofValidity('all'),
    regoValidity: () => setRegoValidity('all'),
    layout: () => setLayout('all'),
    maxWeightKg: setMaxWeightKg,
    carLicenceOnly: () => setCarLicenceOnly(false),
    minFreshWaterL: setMinFreshWaterL,
    minGreyWaterL: setMinGreyWaterL,
    minBatteryAh: setMinBatteryAh,
    minSolarW: setMinSolarW,
    toiletType: () => setToiletType('all'),
    vehicleType: () => setVehicleType(DEFAULT_FILTERS.vehicleType),
    make: setMake,
    model: setModel,
    minPrice: setMinPrice,
    maxPrice: setMaxPrice,
    maxMileage: setMaxMileage,
    minSleeps: setMinSleeps,
    minBelts: setMinBelts,
    selfContainedOnly: () => setSelfContainedOnly(false),
  }

  const removeFilter = filterId => {
    if (filterId === 'location') {
      setLocation('')
      setLocationPoint(null)
    } else if (filterId === 'year') {
      setMinYear('')
      setMaxYear('')
    } else if (filterId === 'engineCc') {
      setMinEngineCc('')
      setMaxEngineCc('')
    } else if (filterId === 'lengthM') {
      setMinLengthM('')
      setMaxLengthM('')
    } else if (filterId === 'transmission') {
      setTransmission('all')
    } else if (filterId in FILTER_RESETTERS) {
      FILTER_RESETTERS[filterId](DEFAULT_FILTERS[filterId])
    } else {
      setAmenities(current => ({ ...current, [filterId]: false }))
    }

    setAppliedFilters(current => {
      if (filterId === 'location') return { ...current, location: '', locationPoint: null }
      if (filterId === 'year') return { ...current, minYear: '', maxYear: '' }
      if (filterId === 'engineCc') return { ...current, minEngineCc: '', maxEngineCc: '' }
      if (filterId === 'lengthM') return { ...current, minLengthM: '', maxLengthM: '' }
      if (filterId === 'transmission') return { ...current, transmission: 'all' }
      if (filterId in DEFAULT_FILTERS) return { ...current, [filterId]: DEFAULT_FILTERS[filterId] }
      return { ...current, amenities: { ...current.amenities, [filterId]: false } }
    })
    setCurrentPage(1)
  }

  const showAdvancedFilters = () => {
    setAdvancedFiltersOpen(true)
  }

  const applyAdvancedFilters = () => {
    setAppliedFilters(draftFilters)
    setCurrentPage(1)
    setHasSearched(true)
    setAdvancedFiltersOpen(false)
    scrollToResults()
  }

  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') applySearch()
  }

  const handleFilterChange = setter => value => setter(value)

  const handleSearchChange = handleFilterChange(setSearch)
  const handleVehicleTypeChange = handleFilterChange(setVehicleType)
  // Al cambiar de marca el modelo anterior deja de tener sentido.
  const handleMakeChange = value => {
    setMake(value)
    setModel('')
  }

  const handleModelChange = handleFilterChange(setModel)
  const handleMinYearChange = handleFilterChange(setMinYear)
  const handleMaxYearChange = handleFilterChange(setMaxYear)
  const handleTransmissionChange = handleFilterChange(setTransmission)
  const handleFuelChange = handleFilterChange(setFuel)
  const handleDrivetrainChange = handleFilterChange(setDrivetrain)
  const handleMinEngineCcChange = handleFilterChange(setMinEngineCc)
  const handleMaxEngineCcChange = handleFilterChange(setMaxEngineCc)
  const handleMinSeatsChange = handleFilterChange(setMinSeats)
  const handleMinDoorsChange = handleFilterChange(setMinDoors)
  const handleConditionChange = handleFilterChange(setCondition)
  const handleWofValidityChange = handleFilterChange(setWofValidity)
  const handleRegoValidityChange = handleFilterChange(setRegoValidity)
  const handleLayoutChange = handleFilterChange(setLayout)
  const handleMinLengthChange = handleFilterChange(setMinLengthM)
  const handleMaxLengthChange = handleFilterChange(setMaxLengthM)
  const handleMaxWeightChange = handleFilterChange(setMaxWeightKg)
  const handleMinFreshWaterChange = handleFilterChange(setMinFreshWaterL)
  const handleMinGreyWaterChange = handleFilterChange(setMinGreyWaterL)
  const handleMinBatteryChange = handleFilterChange(setMinBatteryAh)
  const handleMinSolarChange = handleFilterChange(setMinSolarW)
  const handleToiletTypeChange = handleFilterChange(setToiletType)

  // Geolocalizacion del navegador para ordenar por cercania sin escribir ciudad.
  const useDeviceLocation = () => {
    if (!navigator.geolocation) return
    setLocatingDevice(true)
    navigator.geolocation.getCurrentPosition(
      position => {
        const point = { label: 'My location', lat: position.coords.latitude, lng: position.coords.longitude, device: true }
        setDevicePoint(point)
        setLocation('My location')
        setLocationPoint(point)
        setLocatingDevice(false)
      },
      () => setLocatingDevice(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    )
  }
  const handleMinPriceChange = handleFilterChange(setMinPrice)
  const handleMaxPriceChange = handleFilterChange(setMaxPrice)
  const handleMaxMileageChange = handleFilterChange(setMaxMileage)
  const handleMinSleepsChange = handleFilterChange(setMinSleeps)
  const handleMinBeltsChange = handleFilterChange(setMinBelts)
  // Escribir a mano invalida las coordenadas: solo una sugerencia real las fija.
  const handleLocationChange = value => {
    setLocation(value)
    setLocationPoint(null)
  }

  const handleLocationSelect = place => {
    setLocation(place.label)
    setLocationPoint({ label: place.label, region: place.region, lat: place.lat, lng: place.lng })
  }

  const handleAmenityChange = amenityId => {
    setAmenities(current => ({ ...current, [amenityId]: !current[amenityId] }))
  }

  const clearFilters = () => {
    setSearch('')
    setVehicleType('all')
    setMake('')
    setModel('')
    setMinYear('')
    setMaxYear('')
    setTransmission('all')
    setFuel('all')
    setDrivetrain('all')
    setMinEngineCc('')
    setMaxEngineCc('')
    setMinSeats('')
    setMinDoors('')
    setCondition('all')
    setWofValidity('all')
    setRegoValidity('all')
    setLayout('all')
    setMinLengthM('')
    setMaxLengthM('')
    setMaxWeightKg('')
    setCarLicenceOnly(false)
    setMinFreshWaterL('')
    setMinGreyWaterL('')
    setMinBatteryAh('')
    setMinSolarW('')
    setToiletType('all')
    setMinPrice('')
    setMaxPrice('')
    setMaxMileage('')
    setMinSleeps('')
    setMinBelts('')
    setSelfContainedOnly(false)
    setLocation('')
    setLocationPoint(null)
    setAmenities(DEFAULT_FILTERS.amenities)
    setSortBy('recent')
    setAppliedFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
  }

  const appliedKey = filtersKey(appliedFilters)
  const draftKey = filtersKey(draftFilters)
  const isCurrentSearchSaved = savedSearches.some(item => filtersKey(item.filters) === appliedKey)
  const isDraftSaved = savedSearches.some(item => filtersKey(item.filters) === draftKey)

  const saveSearch = filters => {
    if (!user) { setSearchError('Sign in to save this search.'); return }
    if (!searchesReady) { setSearchError(SAVED_SEARCHES_UNAVAILABLE); return }
    const key = filtersKey(filters)
    const entryName = describeSearch(filters)

    setSavedSearches(current => {
      const existingIndex = current.findIndex(item => filtersKey(item.filters) === key)
      const entry = {
        id: existingIndex >= 0 ? current[existingIndex].id : `${Date.now()}`,
        name: entryName,
        filters,
        lastCount: filtered.length,
        lastCheckedAt: new Date().toISOString(),
      }
      if (existingIndex >= 0) return current.map((item, index) => index === existingIndex ? entry : item)
      return [entry, ...current].slice(0, 8)
    })
  }

  const removeSavedSearch = id => {
    setSavedSearches(current => current.filter(item => item.id !== id))
  }

  // El icono de marcador actua como interruptor: guarda la busqueda actual o la
  // quita si ya estaba guardada.
  const toggleSaveCurrentSearch = () => {
    if (isCurrentSearchSaved) {
      setSavedSearches(current => current.filter(item => filtersKey(item.filters) !== appliedKey))
      return
    }
    saveSearch(appliedFilters)
  }

  const applyFiltersObject = filters => {
    const next = {
      ...DEFAULT_FILTERS,
      ...filters,
      amenities: { ...DEFAULT_FILTERS.amenities, ...(filters?.amenities || {}) },
    }

    setSearch(next.search)
    setVehicleType(next.vehicleType)
    setMake(next.make)
    setModel(next.model)
    setMinYear(next.minYear)
    setMaxYear(next.maxYear)
    setTransmission(next.transmission)
    setFuel(next.fuel)
    setDrivetrain(next.drivetrain)
    setMinEngineCc(next.minEngineCc)
    setMaxEngineCc(next.maxEngineCc)
    setMinSeats(next.minSeats)
    setMinDoors(next.minDoors)
    setCondition(next.condition)
    setWofValidity(next.wofValidity)
    setRegoValidity(next.regoValidity)
    setLayout(next.layout)
    setMinLengthM(next.minLengthM)
    setMaxLengthM(next.maxLengthM)
    setMaxWeightKg(next.maxWeightKg)
    setCarLicenceOnly(next.carLicenceOnly)
    setMinFreshWaterL(next.minFreshWaterL)
    setMinGreyWaterL(next.minGreyWaterL)
    setMinBatteryAh(next.minBatteryAh)
    setMinSolarW(next.minSolarW)
    setToiletType(next.toiletType)
    setMinPrice(next.minPrice)
    setMaxPrice(next.maxPrice)
    setMaxMileage(next.maxMileage)
    setMinSleeps(next.minSleeps)
    setMinBelts(next.minBelts)
    setSelfContainedOnly(next.selfContainedOnly)
    setLocation(next.location)
    setLocationPoint(next.locationPoint || null)
    setSortBy(next.sortBy)
    setAmenities(next.amenities)
    setAppliedFilters(next)
    setCurrentPage(1)
    setHasSearched(true)
  }

  const applySavedSearch = saved => {
    applyFiltersObject(saved.filters)
    setAdvancedFiltersOpen(false)
    scrollToResults()
  }

  // Props del panel de filtros. Agrupadas para que la portada no acabe con una
  // pared de noventa lineas de cableado: el modal recibe lo mismo que antes.
  const filterValues = {
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
    makes,
    models,
    years,
    savedSearches,
    isDraftSaved,
  }

  const filterHandlers = {
    onVehicleTypeChange: handleVehicleTypeChange,
    onMakeChange: handleMakeChange,
    onModelChange: handleModelChange,
    onMinYearChange: handleMinYearChange,
    onMaxYearChange: handleMaxYearChange,
    onTransmissionChange: handleTransmissionChange,
    onFuelChange: handleFuelChange,
    onDrivetrainChange: handleDrivetrainChange,
    onMinEngineCcChange: handleMinEngineCcChange,
    onMaxEngineCcChange: handleMaxEngineCcChange,
    onMinSeatsChange: handleMinSeatsChange,
    onMinDoorsChange: handleMinDoorsChange,
    onConditionChange: handleConditionChange,
    onWofValidityChange: handleWofValidityChange,
    onRegoValidityChange: handleRegoValidityChange,
    onLayoutChange: handleLayoutChange,
    onMinLengthChange: handleMinLengthChange,
    onMaxLengthChange: handleMaxLengthChange,
    onMaxWeightChange: handleMaxWeightChange,
    onCarLicenceChange: setCarLicenceOnly,
    onMinFreshWaterChange: handleMinFreshWaterChange,
    onMinGreyWaterChange: handleMinGreyWaterChange,
    onMinBatteryChange: handleMinBatteryChange,
    onMinSolarChange: handleMinSolarChange,
    onToiletTypeChange: handleToiletTypeChange,
    onSortByChange: setSortBy,
    onUseDeviceLocation: useDeviceLocation,
    onMinPriceChange: handleMinPriceChange,
    onMaxPriceChange: handleMaxPriceChange,
    onMaxMileageChange: handleMaxMileageChange,
    onMinSleepsChange: handleMinSleepsChange,
    onMinBeltsChange: handleMinBeltsChange,
    onSelfContainedChange: setSelfContainedOnly,
    onLocationChange: handleLocationChange,
    onLocationSelect: handleLocationSelect,
    onAmenityChange: handleAmenityChange,
    onClear: clearFilters,
    onApply: applyAdvancedFilters,
    onOpenChange: setAdvancedFiltersOpen,
    onSaveDraft: () => saveSearch(draftFilters),
    onApplySaved: applySavedSearch,
    onRemoveSaved: removeSavedSearch,
  }

  return (
    <div className={`app-shell ${hasSearched ? 'has-searched' : 'is-pre-search'}`}>
      <Navbar />

      <HeroSearch
        backgroundImage={heroSeaImage}
        search={search}
        isSearchSaved={isCurrentSearchSaved}
        onSearchChange={handleSearchChange}
        onSearchKeyDown={handleSearchKeyDown}
        onQuickSearch={applyQuickFilter}
        onToggleSaveSearch={toggleSaveCurrentSearch}
        onOpenFilters={showAdvancedFilters}
      />

      <main className="container page-section">
        {searchError && <p role="alert">{searchError}</p>}
        <ActiveFilterBar
          chips={appliedChips}
          onRemove={removeFilter}
          onClearAll={clearFilters}
        />

        <ResultsHeader
          total={filtered.length}
          sortBy={sortBy}
          viewMode={viewMode}
          resultsRef={resultsRef}
          onSortChange={setSortBy}
          onViewModeChange={mode => {
            setViewMode(mode)
            if (mode === 'map') scrollToResults()
          }}
          onOpenFilters={() => setAdvancedFiltersOpen(true)}
        />

        <ResultsView
          loading={loading}
          error={vehiclesError}
          vehicles={filtered}
          pageVehicles={pageVehicles}
          viewMode={viewMode}
          focusPoint={locationPoint}
          currentPage={activePage}
          totalPages={totalPages}
          onPreviousPage={() => setCurrentPage(page => Math.max(1, page - 1))}
          onNextPage={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
          onClearFilters={clearFilters}
        />

        <AdvancedFiltersModal
          {...filterValues}
          {...filterHandlers}
          open={advancedFiltersOpen}
        />
      </main>

      <Footer />
    </div>
  )
}
