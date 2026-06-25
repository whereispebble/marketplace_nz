import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCamera, FiCheck, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'

const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Cars', 'Toys', 'Other']
const CONDITIONS = ['New', 'Like new', 'Good', 'Fair', 'For parts']
const STEPS = ['Basics', 'Details', 'Photos']

export default function NewProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', condition: '', location: '' })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const handleChange = event => setForm({ ...form, [event.target.name]: event.target.value })

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
    if (step === 1 && (!form.title || !form.price)) { setError('Title and price are required'); return }
    if (step === 2 && (!form.category || !form.condition)) { setError('Category and condition are required'); return }
    setError('')
    setStep(step + 1)
  }

  const handleSubmit = async () => {
    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { navigate('/login'); return }

    const { data, error } = await supabase.from('products').insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      condition: form.condition,
      location: form.location,
      status: 'available',
    }).select().single()

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

      <main className="container page-section" style={{ maxWidth: 760 }}>
        <div className="section-header">
          <div>
            <h1 className="page-title">Post a product</h1>
            <p className="section-subtitle">A focused three-step flow to get your listing live quickly.</p>
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
              <label className="field-group"><span>Title</span><input className="field" name="title" placeholder="iPhone 13 Pro 256GB" value={form.title} onChange={handleChange} /></label>
              <label className="field-group"><span>Description</span><textarea className="field" name="description" placeholder="Condition, extras, defects, pickup details..." value={form.description} onChange={handleChange} /></label>
              <label className="field-group"><span>Price (EUR)</span><input className="field" name="price" type="number" min="0" placeholder="0.00" value={form.price} onChange={handleChange} /></label>
              <label className="field-group"><span>Location</span><input className="field" name="location" placeholder="Madrid" value={form.location} onChange={handleChange} /></label>
            </div>
          )}

          {step === 2 && (
            <div className="form-grid">
              <div className="field-group">
                <span>Category</span>
                <div className="option-grid">
                  {CATEGORIES.map(category => (
                    <button key={category} className={`chip ${form.category === category ? 'is-active' : ''}`} type="button" onClick={() => setForm({ ...form, category })}>{category}</button>
                  ))}
                </div>
              </div>
              <div className="field-group">
                <span>Condition</span>
                <div className="option-grid">
                  {CONDITIONS.map(condition => (
                    <button key={condition} className={`chip ${form.condition === condition ? 'is-active' : ''}`} type="button" onClick={() => setForm({ ...form, condition })}>{condition}</button>
                  ))}
                </div>
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
                  <span>Use clear daylight photos from different angles.</span>
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
