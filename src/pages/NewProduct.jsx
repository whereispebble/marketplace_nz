import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCamera, FiCheck, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { VEHICLE_TYPES } from '../data/mockVehicles'

const CONDITIONS = ['Excellent', 'Very good', 'Good', 'Needs work', 'Project vehicle']
const STEPS = ['Vehicle', 'NZ details', 'Photos']

export default function NewProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    model: '',
    description: '',
    price: '',
    vehicleType: '',
    condition: '',
    mileage: '',
    wof: '',
    sleeps: '',
    belts: '',
    selfContained: false,
    location: '',
  })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const handleChange = event => {
    const { name, type, checked, value } = event.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleImages = event => {
    const files = Array.from(event.target.files).slice(0, 5)
    setImages(files)
    setPreviews(files.map(file => URL.createObjectURL(file)))
  }

  const removeImage = index => {
    setImages(images.filter((_, imageIndex) => imageIndex !== index))
    setPreviews(previews.filter((_, imageIndex) => imageIndex !== index))
  }

  const handleNext = () => {
    if (step === 1 && (!form.title || !form.model || !form.price)) {
      setError('Title, model and price are required')
      return
    }
    if (step === 2 && (!form.vehicleType || !form.condition || !form.location)) {
      setError('Vehicle type, condition and location are required')
      return
    }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const payload = {
      user_id: user.id,
      title: form.title,
      model: form.model,
      description: form.description,
      price: parseFloat(form.price),
      category: form.vehicleType,
      vehicleType: form.vehicleType,
      condition: form.condition,
      mileage: form.mileage ? Number(form.mileage) : null,
      wof: form.wof,
      sleeps: form.sleeps ? Number(form.sleeps) : null,
      belts: form.belts ? Number(form.belts) : null,
      selfContained: form.selfContained,
      location: form.location,
      status: 'available',
    }

    const { data, error } = await supabase.from('products').insert(payload).select().single()
    if (error) { setError(error.message); setLoading(false); return }

    if (images.length > 0 && data) {
      for (const img of images) {
        const ext = img.name.split('.').pop()
        const path = `${data.id}/${Date.now()}.${ext}`
        const { data: upload } = await supabase.storage.from('product-images').upload(path, img)
        if (upload) {
          const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path)
          await supabase.from('product_images').insert({ product_id: data.id, image_url: urlData.publicUrl })
        }
      }
    }

    setLoading(false)
    navigate(`/product/${data.id}`)
  }

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section" style={{ maxWidth: 860 }}>
        <div className="section-header">
          <div>
            <h1 className="page-title">List a vehicle</h1>
            <p className="section-subtitle">Create a NZ-ready listing with WOF, mileage, sleeping capacity and self-contained status separated clearly.</p>
          </div>
          <Link to="/" className="btn btn-secondary"><FiX />Cancel</Link>
        </div>

        <div className="stepper">
          {STEPS.map((label, index) => {
            const number = index + 1
            return (
              <div key={label} className={`step ${step === number ? 'is-active' : ''} ${step > number ? 'is-done' : ''}`}>
                <span className="step-number">{step > number ? <FiCheck /> : number}</span>
                {label}
              </div>
            )
          })}
        </div>

        {error && <div className="alert" style={{ marginBottom: 16 }}>{error}</div>}

        <section className="panel panel-pad">
          {step === 1 && (
            <div className="form-grid">
              <label className="field-group"><span>Listing title</span><input className="field" name="title" placeholder="Toyota Hiace Self-Contained Camper" value={form.title} onChange={handleChange} /></label>
              <label className="field-group"><span>Model</span><input className="field" name="model" placeholder="Toyota Hiace" value={form.model} onChange={handleChange} /></label>
              <label className="field-group"><span>Price (NZD)</span><input className="field" name="price" type="number" min="0" placeholder="38500" value={form.price} onChange={handleChange} /></label>
              <label className="field-group"><span>Description</span><textarea className="field" name="description" placeholder="Engine, layout, service history, solar, heater, water, storage, known issues..." value={form.description} onChange={handleChange} /></label>
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">
              <div className="filter-grid">
                <label className="field-group">
                  <span>Vehicle type</span>
                  <select className="field" name="vehicleType" value={form.vehicleType} onChange={handleChange}>
                    <option value="">Select type</option>
                    {VEHICLE_TYPES.filter(type => type.id !== 'all').map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </label>
                <label className="field-group">
                  <span>Condition</span>
                  <select className="field" name="condition" value={form.condition} onChange={handleChange}>
                    <option value="">Select condition</option>
                    {CONDITIONS.map(condition => <option key={condition} value={condition}>{condition}</option>)}
                  </select>
                </label>
                <label className="field-group"><span>Mileage (km)</span><input className="field" name="mileage" type="number" min="0" placeholder="168000" value={form.mileage} onChange={handleChange} /></label>
                <label className="field-group"><span>WOF</span><input className="field" name="wof" placeholder="Valid until Sep 2026" value={form.wof} onChange={handleChange} /></label>
                <label className="field-group"><span>Sleeps</span><input className="field" name="sleeps" type="number" min="0" placeholder="2" value={form.sleeps} onChange={handleChange} /></label>
                <label className="field-group"><span>Seat belts</span><input className="field" name="belts" type="number" min="0" placeholder="3" value={form.belts} onChange={handleChange} /></label>
                <label className="field-group"><span>Location</span><input className="field" name="location" placeholder="Auckland" value={form.location} onChange={handleChange} /></label>
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
              <label className="upload-zone">
                <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
                <span>
                  <FiCamera size={38} />
                  <strong style={{ display: 'block', marginTop: 12, color: 'var(--ink)' }}>Upload up to 5 photos</strong>
                  <span>Include exterior, interior layout, bed, kitchen, odometer and WOF if useful.</span>
                </span>
              </label>

              {previews.length > 0 && (
                <div className="preview-row">
                  {previews.map((src, index) => (
                    <div className="preview-tile" key={src}>
                      <img src={src} alt="" />
                      <button className="icon-btn" type="button" style={{ position: 'absolute', top: -8, right: -8, width: 30, height: 30 }} onClick={() => removeImage(index)}>
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 24 }}>
            {step > 1 ? (
              <button className="btn btn-secondary" type="button" onClick={() => { setStep(step - 1); setError('') }}>
                <FiArrowLeft />Back
              </button>
            ) : <span />}

            {step < 3 ? (
              <button className="btn btn-primary" type="button" onClick={handleNext}>Next<FiArrowRight /></button>
            ) : (
              <button className="btn btn-primary" type="button" disabled={loading} onClick={handleSubmit}>
                {loading ? 'Publishing...' : 'Publish listing'}
                {loading ? null : <FiCheck />}
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
