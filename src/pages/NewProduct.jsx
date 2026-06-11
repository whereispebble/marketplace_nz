import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

const CATEGORIES = ['Electronics', 'Clothing', 'Home', 'Sports', 'Books', 'Cars', 'Toys', 'Other']
const CONDITIONS = ['New', 'Like new', 'Good', 'Fair', 'For parts']

export default function NewProduct() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ title: '', description: '', price: '', category: '', condition: '', location: '' })
  const [images, setImages] = useState([])
  const [previews, setPreviews] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleImages = e => {
    const files = Array.from(e.target.files).slice(0, 5)
    setImages(files)
    setPreviews(files.map(f => URL.createObjectURL(f)))
  }

  const removeImage = index => {
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previews.filter((_, i) => i !== index)
    setImages(newImages)
    setPreviews(newPreviews)
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

    // Upload images to Supabase Storage
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

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '14px',
    border: '2px solid #F5C6D8',
    background: '#FDF6F8',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    boxSizing: 'border-box',
    color: '#333',
    transition: 'border-color 0.2s',
  }

  const STEPS = ['Basic info', 'Details', 'Photos']

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6F8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        background: 'white',
        borderBottom: '2px solid #F5C6D8',
        padding: '0 2rem',
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(245,198,216,0.2)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', padding: '4px 12px', borderRadius: '8px' }}>MKT</span>
          <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>place</span>
        </Link>
        <Link to="/" style={{ color: '#b08090', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', padding: '8px 16px', border: '2px solid #F5C6D8', borderRadius: '50px' }}>
          ✕ Cancel
        </Link>
      </nav>

      <div style={{ maxWidth: '680px', margin: '0 auto', padding: '2rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', color: '#3a2030', margin: '0 0 8px' }}>
            Post a product ✨
          </h1>
          <p style={{ color: '#b08090', margin: 0 }}>Fill in the details to list your item</p>
        </div>

        {/* Steps indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2rem' }}>
          {STEPS.map((label, i) => {
            const s = i + 1
            return (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{
                    width: '32px', height: '32px',
                    borderRadius: '50%',
                    background: step >= s ? 'linear-gradient(135deg, #F5C6D8, #e8a8c4)' : 'white',
                    border: `2px solid ${step >= s ? '#F5C6D8' : '#ede0e5'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '0.85rem',
                    color: step >= s ? '#5a2d3f' : '#ccc',
                    transition: 'all 0.3s',
                  }}>{step > s ? '✓' : s}</div>
                  <span style={{ fontSize: '0.82rem', color: step === s ? '#5a2d3f' : '#bbb', fontWeight: step === s ? 600 : 400 }}>{label}</span>
                </div>
                {s < 3 && <div style={{ width: '30px', height: '2px', background: step > s ? '#F5C6D8' : '#ede0e5', transition: 'background 0.3s' }} />}
              </div>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F5', border: '1.5px solid #F5C6D8', borderRadius: '12px', padding: '10px 14px', color: '#c0406a', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ background: 'white', borderRadius: '24px', border: '2px solid #F5C6D8', padding: '2rem', boxShadow: '0 8px 30px rgba(245,198,216,0.15)' }}>

          {/* Step 1 — Basic info */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Title <span style={{ color: '#F5C6D8' }}>*</span>
                </label>
                <input name="title" placeholder="e.g. iPhone 13 Pro 256GB" value={form.title} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#A8D4E8'}
                  onBlur={e => e.target.style.borderColor = '#F5C6D8'} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>Description</label>
                <textarea name="description" placeholder="Describe your product, include any defects or extras..." value={form.description} onChange={handleChange}
                  style={{ ...inputStyle, height: '130px', resize: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#A8D4E8'}
                  onBlur={e => e.target.style.borderColor = '#F5C6D8'} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>
                  Price (€) <span style={{ color: '#F5C6D8' }}>*</span>
                </label>
                <input name="price" type="number" min="0" placeholder="0.00" value={form.price} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#A8D4E8'}
                  onBlur={e => e.target.style.borderColor = '#F5C6D8'} />
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>Location</label>
                <input name="location" placeholder="e.g. Madrid" value={form.location} onChange={handleChange}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#A8D4E8'}
                  onBlur={e => e.target.style.borderColor = '#F5C6D8'} />
              </div>
            </div>
          )}

          {/* Step 2 — Details */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '12px' }}>
                  Category <span style={{ color: '#F5C6D8' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setForm({ ...form, category: cat })}
                      style={{
                        padding: '8px 18px', borderRadius: '50px', border: '2px solid',
                        borderColor: form.category === cat ? '#F5C6D8' : '#ede0e5',
                        background: form.category === cat ? '#F5C6D8' : 'white',
                        color: form.category === cat ? '#5a2d3f' : '#888',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '12px' }}>
                  Condition <span style={{ color: '#F5C6D8' }}>*</span>
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CONDITIONS.map(cond => (
                    <button key={cond} onClick={() => setForm({ ...form, condition: cond })}
                      style={{
                        padding: '8px 18px', borderRadius: '50px', border: '2px solid',
                        borderColor: form.condition === cond ? '#A8D4E8' : '#ede0e5',
                        background: form.condition === cond ? '#E8F4FB' : 'white',
                        color: form.condition === cond ? '#2a6080' : '#888',
                        fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      {cond}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3 — Photos */}
          {step === 3 && (
            <div>
              <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '12px' }}>
                Photos <span style={{ color: '#b08090', fontWeight: 400 }}>(up to 5)</span>
              </label>

              <label style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                border: '2px dashed #F5C6D8', borderRadius: '16px', padding: '2.5rem',
                cursor: 'pointer', background: '#FDF6F8', marginBottom: '1.2rem',
                transition: 'border-color 0.2s, background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#A8D4E8'; e.currentTarget.style.background = '#F0F8FF' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = '#F5C6D8'; e.currentTarget.style.background = '#FDF6F8' }}
              >
                <span style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📸</span>
                <span style={{ color: '#5a2d3f', fontWeight: 600, fontSize: '0.95rem' }}>Click to upload photos</span>
                <span style={{ color: '#c084a0', fontSize: '0.8rem', marginTop: '4px' }}>JPG, PNG · Max 5MB each</span>
                <input type="file" multiple accept="image/*" onChange={handleImages} style={{ display: 'none' }} />
              </label>

              {previews.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {previews.map((src, i) => (
                    <div key={i} style={{ position: 'relative', width: '90px', height: '90px' }}>
                      <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', border: '2px solid #F5C6D8' }} />
                      <button onClick={() => removeImage(i)} style={{
                        position: 'absolute', top: '-6px', right: '-6px',
                        width: '22px', height: '22px', borderRadius: '50%',
                        background: '#ff6b8a', border: 'none', color: 'white',
                        fontSize: '0.7rem', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontWeight: 700,
                      }}>✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '10px' }}>
            {step > 1 ? (
              <button onClick={() => { setStep(step - 1); setError('') }} style={{
                padding: '12px 24px', borderRadius: '50px',
                border: '2px solid #F5C6D8', background: 'white',
                color: '#b08090', fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
              }}>
                ← Back
              </button>
            ) : <div />}

            {step < 3 ? (
              <button onClick={handleNext} style={{
                padding: '12px 28px', borderRadius: '50px', border: 'none',
                background: 'linear-gradient(135deg, #F5C6D8, #e8a8c4)',
                color: '#5a2d3f', fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(245,198,216,0.4)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                Next →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading} style={{
                padding: '12px 28px', borderRadius: '50px', border: 'none',
                background: loading ? '#f0d4e0' : 'linear-gradient(135deg, #F5C6D8, #e8a8c4)',
                color: '#5a2d3f', fontFamily: "'Syne', sans-serif",
                fontWeight: 700, fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(245,198,216,0.4)',
                transition: 'transform 0.15s',
              }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                {loading ? 'Publishing...' : '🚀 Publish'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}