import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCamera, FiCheck, FiMapPin, FiMove, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import { VEHICLE_TYPES } from '../data/mockVehicles'
// Misma foto que el hero de la home, asi que ya viene de cache al navegar
import sellBackground from '../assets/new-zealand-sea.webp.jpg'

const CONDITIONS = ['Excellent', 'Very good', 'Good', 'Needs work', 'Project vehicle']
const FUELS = ['Diesel', 'Petrol', 'Hybrid', 'Electric', 'LPG']
const DRIVETRAINS = ['2WD', '4WD', 'AWD']
const LAYOUTS = ['Rear bed', 'Rear garage', 'End lounge', 'Pop-top', 'Bunks', 'Open plan', 'Fixed double']
const TOILET_TYPES = [
  { id: '', name: 'Select toilet' },
  { id: 'none', name: 'No toilet' },
  { id: 'portable', name: 'Portable toilet' },
  { id: 'fixed', name: 'Fixed toilet' },
]
// La tarjeta verde es la unica valida para freedom camping desde el 6/6/2026.
const SC_CERTIFICATIONS = [
  { id: '', name: 'Not certified' },
  { id: 'green', name: 'Green card (freedom camping)' },
  { id: 'yellow', name: 'Yellow card (NZMCA)' },
]
const LISTING_STATUSES = [
  { id: 'active', name: 'Active' },
  { id: 'draft', name: 'Draft' },
  { id: 'paused', name: 'Paused' },
  { id: 'sold', name: 'Sold' },
]
const STEPS = ['Vehicle', 'NZ details', 'Photos', 'Preview']
const NZ_CITIES = [
  { location: 'Auckland', region: 'Auckland', lat: -36.8485, lng: 174.7633 },
  { location: 'Wellington', region: 'Wellington', lat: -41.2865, lng: 174.7762 },
  { location: 'Christchurch', region: 'Canterbury', lat: -43.5321, lng: 172.6362 },
  { location: 'Queenstown', region: 'Otago', lat: -45.0312, lng: 168.6626 },
  { location: 'Nelson', region: 'Nelson Tasman', lat: -41.2706, lng: 173.2840 },
  { location: 'Rotorua', region: 'Bay of Plenty', lat: -38.1368, lng: 176.2497 },
  { location: 'Tauranga', region: 'Bay of Plenty', lat: -37.6878, lng: 176.1651 },
  { location: 'Hamilton', region: 'Waikato', lat: -37.7870, lng: 175.2793 },
  { location: 'Dunedin', region: 'Otago', lat: -45.8788, lng: 170.5028 },
  { location: 'Napier', region: "Hawke's Bay", lat: -39.4928, lng: 176.9120 },
  { location: 'New Plymouth', region: 'Taranaki', lat: -39.0556, lng: 174.0752 },
  { location: 'Whangarei', region: 'Northland', lat: -35.7251, lng: 174.3237 },
  { location: 'Wanaka', region: 'Otago', lat: -44.7032, lng: 169.1321 },
  { location: 'Invercargill', region: 'Southland', lat: -46.4132, lng: 168.3538 },
  { location: 'Palmerston North', region: 'Manawatu-Whanganui', lat: -40.3523, lng: 175.6082 },
  { location: 'Blenheim', region: 'Marlborough', lat: -41.5134, lng: 173.9612 },
  { location: 'Timaru', region: 'Canterbury', lat: -44.3967, lng: 171.2536 },
  { location: 'Gisborne', region: 'Gisborne', lat: -38.6623, lng: 178.0176 },
  { location: 'Taupo', region: 'Waikato', lat: -38.6857, lng: 176.0702 },
  { location: 'Picton', region: 'Marlborough', lat: -41.2906, lng: 174.0059 },
  { location: 'Hokitika', region: 'West Coast', lat: -42.7167, lng: 170.9667 },
  { location: 'Kerikeri', region: 'Northland', lat: -35.2268, lng: 173.9474 },
  { location: 'Greymouth', region: 'West Coast', lat: -42.4504, lng: 171.2108 },
  { location: 'Te Anau', region: 'Southland', lat: -45.4144, lng: 167.7181 },
]

function normalise(value) {
  return String(value || '').trim().toLowerCase()
}

function findCity(value) {
  const cleanValue = normalise(value)
  if (!cleanValue) return null
  return NZ_CITIES.find(city => normalise(city.location) === cleanValue) || null
}

function fieldErrorClass(errors, field) {
  return errors[field] ? 'field field-error' : 'field'
}

function formatPrice(value) {
  return `NZ$${Number(value || 0).toLocaleString('en-NZ')}`
}

export default function NewProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    model: '',
    description: '',
    price: '',
    vehicleType: '',
    condition: '',
    transmission: '',
    year: '',
    mileage: '',
    wof: '',
    wofExpiry: '',
    regoExpiry: '',
    fuel: '',
    drivetrain: '',
    engineCc: '',
    powerKw: '',
    seats: '',
    doors: '',
    layout: '',
    lengthM: '',
    weightKg: '',
    freshWaterL: '',
    greyWaterL: '',
    batteryAh: '',
    solarW: '',
    toiletType: '',
    scCertification: '',
    scExpiry: '',
    sleeps: '',
    belts: '',
    selfContained: false,
    location: '',
    listingStatus: 'active',
  })
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [generalError, setGeneralError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [step, setStep] = useState(1)
  const [draggedImageId, setDraggedImageId] = useState('')
  const imagesRef = useRef(images)
  const selectedCity = useMemo(() => findCity(form.location), [form.location])

  useEffect(() => {
    imagesRef.current = images
  }, [images])

  useEffect(() => (
    () => imagesRef.current.forEach(image => URL.revokeObjectURL(image.preview))
  ), [])

  const previewProduct = useMemo(() => ({
    id: 'preview',
    title: form.title || 'Your listing title',
    model: form.model || 'Model pending',
    description: form.description || 'The seller has not added a description yet.',
    price: Number(form.price || 0),
    vehicleType: form.vehicleType,
    category: form.vehicleType,
    condition: form.condition || 'Used',
    transmission: form.transmission,
    year: form.year ? Number(form.year) : null,
    mileage: Number(form.mileage || 0),
    wof: form.wof,
    wofExpiry: form.wofExpiry || null,
    regoExpiry: form.regoExpiry || null,
    fuel: form.fuel,
    drivetrain: form.drivetrain,
    engineCc: form.engineCc ? Number(form.engineCc) : null,
    powerKw: form.powerKw ? Number(form.powerKw) : null,
    seats: form.seats ? Number(form.seats) : null,
    doors: form.doors ? Number(form.doors) : null,
    layout: form.layout,
    lengthM: form.lengthM ? Number(form.lengthM) : null,
    weightKg: form.weightKg ? Number(form.weightKg) : null,
    freshWaterL: form.freshWaterL ? Number(form.freshWaterL) : null,
    greyWaterL: form.greyWaterL ? Number(form.greyWaterL) : null,
    batteryAh: form.batteryAh ? Number(form.batteryAh) : null,
    solarW: form.solarW ? Number(form.solarW) : null,
    toiletType: form.toiletType,
    scCertification: form.scCertification,
    scExpiry: form.scExpiry || null,
    sleeps: Number(form.sleeps || 0),
    belts: Number(form.belts || 0),
    selfContained: form.selfContained,
    location: selectedCity?.location || form.location || 'Location pending',
    region: selectedCity?.region,
    lat: selectedCity?.lat,
    lng: selectedCity?.lng,
    status: form.listingStatus,
    image: images[0]?.preview,
    images: images.map(image => image.preview),
  }), [form, images, selectedCity])

  const setFieldValue = (name, value) => {
    setForm(current => ({ ...current, [name]: value }))
    setFieldErrors(current => {
      if (!current[name]) return current
      const next = { ...current }
      delete next[name]
      return next
    })
  }

  const handleChange = event => {
    const { name, type, checked, value } = event.target
    setFieldValue(name, type === 'checkbox' ? checked : value)
  }

  const handleImages = event => {
    const files = Array.from(event.target.files || [])
    const availableSlots = Math.max(0, 5 - images.length)
    const nextImages = files.slice(0, availableSlots).map(file => ({
      id: `${file.name}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
      file,
      preview: URL.createObjectURL(file),
    }))

    setImages(current => [...current, ...nextImages])
    if (files.length > availableSlots) setGeneralError('You can upload up to 5 photos.')
    event.target.value = ''
  }

  const removeImage = imageId => {
    setImages(current => {
      const removed = current.find(image => image.id === imageId)
      if (removed) URL.revokeObjectURL(removed.preview)
      return current.filter(image => image.id !== imageId)
    })
  }

  const moveImage = (imageId, direction) => {
    setImages(current => {
      const index = current.findIndex(image => image.id === imageId)
      const nextIndex = index + direction
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(nextIndex, 0, item)
      return next
    })
  }

  const handleImageDrop = targetImageId => {
    if (!draggedImageId || draggedImageId === targetImageId) return
    setImages(current => {
      const draggedIndex = current.findIndex(image => image.id === draggedImageId)
      const targetIndex = current.findIndex(image => image.id === targetImageId)
      if (draggedIndex < 0 || targetIndex < 0) return current
      const next = [...current]
      const [item] = next.splice(draggedIndex, 1)
      next.splice(targetIndex, 0, item)
      return next
    })
    setDraggedImageId('')
  }

  const validateStep = (targetStep = step, mode = 'active') => {
    const nextErrors = {}
    const isDraft = mode === 'draft'

    if (targetStep >= 1) {
      if (!form.title.trim()) nextErrors.title = 'Add a clear listing title.'
      if (!isDraft && !form.model.trim()) nextErrors.model = 'Add the vehicle make and model.'
      if (!isDraft && (!form.price || Number(form.price) <= 0)) nextErrors.price = 'Add a valid price above NZ$0.'
    }

    if (!isDraft && targetStep >= 2) {
      if (!form.vehicleType) nextErrors.vehicleType = 'Choose the type of vehicle.'
      if (!form.condition) nextErrors.condition = 'Choose the vehicle condition.'
      if (!form.location.trim()) nextErrors.location = 'Choose the city where the vehicle is located.'
      if (form.location.trim() && !selectedCity) nextErrors.location = 'Choose a supported NZ city so the listing can appear on the map.'
      if (form.mileage && Number(form.mileage) < 0) nextErrors.mileage = 'Mileage cannot be negative.'
      if (form.sleeps && Number(form.sleeps) < 0) nextErrors.sleeps = 'Sleeps cannot be negative.'
      if (form.belts && Number(form.belts) < 0) nextErrors.belts = 'Seat belts cannot be negative.'
    }

    if (!isDraft && targetStep >= 3 && images.length === 0) {
      nextErrors.images = 'Add at least one photo before publishing.'
    }

    setFieldErrors(nextErrors)
    setGeneralError(Object.values(nextErrors)[0] || '')
    return Object.keys(nextErrors).length === 0
  }

  const handleNext = () => {
    if (!validateStep(step)) return
    setGeneralError('')
    setStep(step + 1)
  }

  const createPayload = statusOverride => {
    const city = selectedCity || {}
    return {
      title: form.title.trim(),
      model: form.model.trim(),
      description: form.description.trim(),
      price: form.price ? Number(form.price) : null,
      category: form.vehicleType,
      vehicleType: form.vehicleType,
      condition: form.condition,
      transmission: form.transmission || null,
      year: form.year ? Number(form.year) : null,
      mileage: form.mileage ? Number(form.mileage) : null,
      wof: form.wof.trim(),
      wofExpiry: form.wofExpiry || null,
      regoExpiry: form.regoExpiry || null,
      fuel: form.fuel || null,
      drivetrain: form.drivetrain || null,
      engineCc: form.engineCc ? Number(form.engineCc) : null,
      powerKw: form.powerKw ? Number(form.powerKw) : null,
      seats: form.seats ? Number(form.seats) : null,
      doors: form.doors ? Number(form.doors) : null,
      layout: form.layout || null,
      lengthM: form.lengthM ? Number(form.lengthM) : null,
      weightKg: form.weightKg ? Number(form.weightKg) : null,
      freshWaterL: form.freshWaterL ? Number(form.freshWaterL) : null,
      greyWaterL: form.greyWaterL ? Number(form.greyWaterL) : null,
      batteryAh: form.batteryAh ? Number(form.batteryAh) : null,
      solarW: form.solarW ? Number(form.solarW) : null,
      toiletType: form.toiletType || null,
      scCertification: form.scCertification || null,
      scExpiry: form.scExpiry || null,
      sleeps: form.sleeps ? Number(form.sleeps) : null,
      belts: form.belts ? Number(form.belts) : null,
      selfContained: form.selfContained,
      location: city.location || form.location.trim(),
      region: city.region || '',
      lat: city.lat || null,
      lng: city.lng || null,
      status: statusOverride || form.listingStatus,
    }
  }

  const handleSubmit = async (statusOverride = form.listingStatus) => {
    if (!validateStep(3, statusOverride)) {
      if (!form.title.trim() || (statusOverride !== 'draft' && (!form.model.trim() || !form.price))) setStep(1)
      else if (statusOverride !== 'draft' && (!form.vehicleType || !form.condition || !form.location.trim() || !selectedCity)) setStep(2)
      else setStep(3)
      return
    }

    setLoading(true)
    setGeneralError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const payload = { ...createPayload(statusOverride), user_id: user.id }
    const { data, error } = await supabase.from('products').insert(payload).select().single()
    if (error) { setGeneralError(error.message); setLoading(false); return }

    const uploadedUrls = []
    if (images.length > 0 && data) {
      for (const [index, image] of images.entries()) {
        const ext = image.file.name.split('.').pop()
        const path = `${data.id}/${Date.now()}-${index}.${ext}`
        const { data: upload, error: uploadError } = await supabase.storage.from('product-images').upload(path, image.file)
        if (uploadError) {
          setGeneralError(uploadError.message)
          setLoading(false)
          return
        }
        if (upload) {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
          uploadedUrls.push(urlData.publicUrl)
          await supabase.from('product_images').insert({
            product_id: data.id,
            image_url: urlData.publicUrl,
            sort_order: index,
          })
        }
      }
    }

    if (uploadedUrls.length) {
      await supabase.from('products').update({ image: uploadedUrls[0], images: uploadedUrls }).eq('id', data.id)
    }

    setLoading(false)
    navigate(statusOverride === 'draft' ? '/profile' : `/product/${data.id}`)
  }

  return (
    <div className="app-shell photo-shell">
      <div className="photo-background" style={{ backgroundImage: `url(${sellBackground})` }} aria-hidden="true" />

      <Navbar compact />

      <main className="container page-section" style={{ maxWidth: 980 }}>
        <div className="section-header">
          <div>
            <h1 className="page-title">List a vehicle</h1>
            <p className="section-subtitle">Create a NZ-ready listing with a map-ready city, ordered photos and a final preview before publishing.</p>
          </div>
          <Link to="/" className="btn btn-secondary"><FiX />Cancel</Link>
        </div>

        <div className="stepper stepper-wide">
          {STEPS.map((label, index) => {
            const number = index + 1
            return (
              <button
                key={label}
                className={`step ${step === number ? 'is-active' : ''} ${step > number ? 'is-done' : ''}`}
                type="button"
                onClick={() => number < step && setStep(number)}
              >
                <span className="step-number">{step > number ? <FiCheck /> : number}</span>
                {label}
              </button>
            )
          })}
        </div>

        {generalError && <div className="alert" style={{ marginBottom: 16 }}>{generalError}</div>}

        <section className="panel panel-pad">
          {step === 1 && (
            <div className="form-grid">
              <FieldError errors={fieldErrors} name="title">
                <label className="field-group">
                  <span>Listing title</span>
                  <input className={fieldErrorClass(fieldErrors, 'title')} name="title" placeholder="Toyota Hiace Self-Contained Camper" value={form.title} onChange={handleChange} />
                </label>
              </FieldError>
              <FieldError errors={fieldErrors} name="model">
                <label className="field-group">
                  <span>Model</span>
                  <input className={fieldErrorClass(fieldErrors, 'model')} name="model" placeholder="Toyota Hiace" value={form.model} onChange={handleChange} />
                </label>
              </FieldError>
              <FieldError errors={fieldErrors} name="price">
                <label className="field-group">
                  <span>Price (NZD)</span>
                  <input className={fieldErrorClass(fieldErrors, 'price')} name="price" type="number" min="0" placeholder="38500" value={form.price} onChange={handleChange} />
                </label>
              </FieldError>
              <label className="field-group">
                <span>Description</span>
                <textarea className="field" name="description" placeholder="Engine, layout, service history, solar, heater, water, storage, known issues..." value={form.description} onChange={handleChange} />
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">
              <div className="filter-grid publish-grid">
                <FieldError errors={fieldErrors} name="vehicleType">
                  <label className="field-group">
                    <span>Vehicle type</span>
                    <select className={fieldErrorClass(fieldErrors, 'vehicleType')} name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                      <option value="">Select type</option>
                      {VEHICLE_TYPES.filter(type => type.id !== 'all').map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </label>
                </FieldError>
                <FieldError errors={fieldErrors} name="condition">
                  <label className="field-group">
                    <span>Condition</span>
                    <select className={fieldErrorClass(fieldErrors, 'condition')} name="condition" value={form.condition} onChange={handleChange}>
                      <option value="">Select condition</option>
                      {CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                    </select>
                  </label>
                </FieldError>
                <label className="field-group">
                  <span>Status</span>
                  <select className="field" name="listingStatus" value={form.listingStatus} onChange={handleChange}>
                    {LISTING_STATUSES.map(status => <option key={status.id} value={status.id}>{status.name}</option>)}
                  </select>
                </label>
                <FieldError errors={fieldErrors} name="location" className="field-group-wide">
                  <label className="field-group">
                    <span>City for map</span>
                    <input
                      className={fieldErrorClass(fieldErrors, 'location')}
                      list="nz-city-options"
                      name="location"
                      placeholder="Auckland"
                      value={form.location}
                      onChange={handleChange}
                    />
                    <datalist id="nz-city-options">
                      {NZ_CITIES.map(city => <option key={city.location} value={city.location} label={city.region} />)}
                    </datalist>
                  </label>
                </FieldError>
                <div className={`geo-card ${selectedCity ? 'is-ready' : ''}`}>
                  <FiMapPin />
                  <div>
                    <strong>{selectedCity ? `${selectedCity.location}, ${selectedCity.region}` : 'Map position pending'}</strong>
                    <span>{selectedCity ? `${selectedCity.lat}, ${selectedCity.lng}` : 'Choose a supported NZ city to place this listing on the map.'}</span>
                  </div>
                </div>
                <label className="field-group">
                  <span>Year</span>
                  <input className="field" name="year" type="number" min="1950" max="2100" placeholder="2014" value={form.year} onChange={handleChange} />
                </label>
                <label className="field-group">
                  <span>Transmission</span>
                  <select className="field" name="transmission" value={form.transmission} onChange={handleChange}>
                    <option value="">Select transmission</option>
                    <option value="Automatic">Automatic</option>
                    <option value="Manual">Manual</option>
                  </select>
                </label>
                <FieldError errors={fieldErrors} name="mileage">
                  <label className="field-group"><span>Mileage (km)</span><input className={fieldErrorClass(fieldErrors, 'mileage')} name="mileage" type="number" min="0" placeholder="168000" value={form.mileage} onChange={handleChange} /></label>
                </FieldError>
                <label className="field-group"><span>WOF</span><input className="field" name="wof" placeholder="Valid until Sep 2026" value={form.wof} onChange={handleChange} /></label>
                <FieldError errors={fieldErrors} name="sleeps">
                  <label className="field-group"><span>Sleeps</span><input className={fieldErrorClass(fieldErrors, 'sleeps')} name="sleeps" type="number" min="0" placeholder="2" value={form.sleeps} onChange={handleChange} /></label>
                </FieldError>
                <FieldError errors={fieldErrors} name="belts">
                  <label className="field-group"><span>Seat belts</span><input className={fieldErrorClass(fieldErrors, 'belts')} name="belts" type="number" min="0" placeholder="3" value={form.belts} onChange={handleChange} /></label>
                </FieldError>
                <label className="field-group">
                  <span>Fuel</span>
                  <select className="field" name="fuel" value={form.fuel} onChange={handleChange}>
                    <option value="">Select fuel</option>
                    {FUELS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="field-group">
                  <span>Drivetrain</span>
                  <select className="field" name="drivetrain" value={form.drivetrain} onChange={handleChange}>
                    <option value="">Select drivetrain</option>
                    {DRIVETRAINS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="field-group"><span>Engine (cc)</span><input className="field" name="engineCc" type="number" min="0" placeholder="2982" value={form.engineCc} onChange={handleChange} /></label>
                <label className="field-group"><span>Power (kW)</span><input className="field" name="powerKw" type="number" min="0" placeholder="140" value={form.powerKw} onChange={handleChange} /></label>
                <label className="field-group"><span>Seats</span><input className="field" name="seats" type="number" min="0" placeholder="5" value={form.seats} onChange={handleChange} /></label>
                <label className="field-group"><span>Doors</span><input className="field" name="doors" type="number" min="0" placeholder="4" value={form.doors} onChange={handleChange} /></label>
                <label className="field-group"><span>WOF expiry</span><input className="field" name="wofExpiry" type="date" value={form.wofExpiry} onChange={handleChange} /></label>
                <label className="field-group"><span>Rego expiry</span><input className="field" name="regoExpiry" type="date" value={form.regoExpiry} onChange={handleChange} /></label>
                <label className="field-group">
                  <span>Layout</span>
                  <select className="field" name="layout" value={form.layout} onChange={handleChange}>
                    <option value="">Select layout</option>
                    {LAYOUTS.map(item => <option key={item} value={item}>{item}</option>)}
                  </select>
                </label>
                <label className="field-group"><span>Length (m)</span><input className="field" name="lengthM" type="number" min="0" step="0.1" placeholder="5.4" value={form.lengthM} onChange={handleChange} /></label>
                <label className="field-group"><span>Weight (kg)</span><input className="field" name="weightKg" type="number" min="0" placeholder="3200" value={form.weightKg} onChange={handleChange} /></label>
                <label className="field-group"><span>Fresh water (L)</span><input className="field" name="freshWaterL" type="number" min="0" placeholder="80" value={form.freshWaterL} onChange={handleChange} /></label>
                <label className="field-group"><span>Grey water (L)</span><input className="field" name="greyWaterL" type="number" min="0" placeholder="80" value={form.greyWaterL} onChange={handleChange} /></label>
                <label className="field-group"><span>Battery (Ah)</span><input className="field" name="batteryAh" type="number" min="0" placeholder="100" value={form.batteryAh} onChange={handleChange} /></label>
                <label className="field-group"><span>Solar (W)</span><input className="field" name="solarW" type="number" min="0" placeholder="200" value={form.solarW} onChange={handleChange} /></label>
                <label className="field-group">
                  <span>Toilet</span>
                  <select className="field" name="toiletType" value={form.toiletType} onChange={handleChange}>
                    {TOILET_TYPES.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="field-group">
                  <span>Self-containment card</span>
                  <select className="field" name="scCertification" value={form.scCertification} onChange={handleChange}>
                    {SC_CERTIFICATIONS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                  </select>
                </label>
                <label className="field-group"><span>Card expiry</span><input className="field" name="scExpiry" type="date" value={form.scExpiry} onChange={handleChange} /></label>
                <label className="field-group">
                  <span>Certification</span>
                  <label className="toggle-row">
                    <input type="checkbox" name="selfContained" checked={form.selfContained} onChange={handleChange} />
                    Self-contained
                  </label>
                </label>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <FieldError errors={fieldErrors} name="images">
                <label className="upload-zone">
                  <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
                  <span>
                    <FiCamera size={38} />
                    <strong style={{ display: 'block', marginTop: 12, color: 'var(--ink)' }}>Upload up to 5 photos</strong>
                    <span>Drag photos to reorder. The first photo becomes the cover.</span>
                  </span>
                </label>
              </FieldError>

              {images.length > 0 && (
                <div className="preview-row sortable-preview-row">
                  {images.map((image, index) => (
                    <div
                      className="preview-tile sortable-preview-tile"
                      draggable
                      key={image.id}
                      onDragStart={() => setDraggedImageId(image.id)}
                      onDragOver={event => event.preventDefault()}
                      onDrop={() => handleImageDrop(image.id)}
                    >
                      <img src={image.preview} alt="" />
                      <span className="photo-order">{index === 0 ? 'Cover' : index + 1}</span>
                      <button className="icon-btn drag-handle" type="button" aria-label="Drag photo">
                        <FiMove />
                      </button>
                      <div className="photo-actions">
                        <button className="icon-btn" type="button" disabled={index === 0} onClick={() => moveImage(image.id, -1)} aria-label="Move photo left">
                          <FiArrowLeft />
                        </button>
                        <button className="icon-btn" type="button" disabled={index === images.length - 1} onClick={() => moveImage(image.id, 1)} aria-label="Move photo right">
                          <FiArrowRight />
                        </button>
                        <button className="icon-btn" type="button" onClick={() => removeImage(image.id)} aria-label="Remove photo">
                          <FiX />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="publish-preview-layout">
              <div>
                <h2 className="section-title" style={{ fontSize: '1.35rem', marginBottom: 14 }}>Preview</h2>
                <ProductCard product={previewProduct} />
              </div>

              <div className="panel preview-summary">
                <div className="preview-summary-row">
                  <span>Status</span>
                  <strong>{LISTING_STATUSES.find(status => status.id === form.listingStatus)?.name}</strong>
                </div>
                <div className="preview-summary-row">
                  <span>Price</span>
                  <strong>{formatPrice(form.price)}</strong>
                </div>
                <div className="preview-summary-row">
                  <span>Location</span>
                  <strong>{selectedCity ? `${selectedCity.location}, ${selectedCity.region}` : form.location || '-'}</strong>
                </div>
                <div className="preview-summary-row">
                  <span>Map coordinates</span>
                  <strong>{selectedCity ? `${selectedCity.lat}, ${selectedCity.lng}` : '-'}</strong>
                </div>
                <div className="preview-summary-row">
                  <span>Photos</span>
                  <strong>{images.length}/5</strong>
                </div>
                <p className="section-subtitle">{previewProduct.description}</p>
              </div>
            </div>
          )}

          <div className="publish-actions">
            {step > 1 ? (
              <button className="btn btn-secondary" type="button" onClick={() => { setStep(step - 1); setGeneralError('') }}>
                <FiArrowLeft />Back
              </button>
            ) : <span />}

            <div className="publish-actions-right">
              <button className="btn btn-secondary" type="button" disabled={loading || !form.title.trim()} onClick={() => handleSubmit('draft')}>
                Save draft
              </button>
              {step < 4 ? (
                <button className="btn btn-primary" type="button" onClick={handleNext}>Next<FiArrowRight /></button>
              ) : (
                <button className="btn btn-primary" type="button" disabled={loading} onClick={() => handleSubmit(form.listingStatus)}>
                  {loading ? 'Saving...' : form.listingStatus === 'active' ? 'Publish listing' : 'Save listing'}
                  {loading ? null : <FiCheck />}
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}

function FieldError({ errors, name, children, className = '' }) {
  return (
    <div className={`field-shell ${className}`}>
      {children}
      {errors[name] && <span className="field-message">{errors[name]}</span>}
    </div>
  )
}
