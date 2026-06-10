import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

const MOCK_PROFILE = {
  username: 'Alex M.',
  email: 'alex@email.com',
  location: 'Madrid',
  phone: '+34 612 345 678',
  bio: 'Passionate about tech and vintage finds. Always looking for great deals!',
  rating: 4.8,
  total_sales: 23,
  joined: '2022',
}

const MOCK_LISTINGS = [
  { id: 1, title: 'iPhone 13 Pro', price: 650, condition: 'Good', status: 'available', image: 'https://via.placeholder.com/120x90?text=iPhone' },
  { id: 2, title: 'Nike Air Max 90', price: 80, condition: 'New', status: 'available', image: 'https://via.placeholder.com/120x90?text=Nike' },
  { id: 3, title: 'MacBook Air M1', price: 900, condition: 'Good', status: 'sold', image: 'https://via.placeholder.com/120x90?text=MacBook' },
]

export default function Profile() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(MOCK_PROFILE)
  const [listings, setListings] = useState(MOCK_LISTINGS)
  const [activeTab, setActiveTab] = useState('listings')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(MOCK_PROFILE)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) { setProfile(data); setForm(data) }
    const { data: prods } = await supabase.from('products').select('*').eq('user_id', user.id)
    if (prods && prods.length > 0) setListings(prods)
  }

  const handleSave = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('profiles').update({ username: form.username, location: form.location, phone: form.phone, bio: form.bio }).eq('id', user.id)
    setProfile(form)
    setEditing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  const TABS = ['listings', 'favorites', 'reviews']

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6F8', fontFamily: "'DM Sans', sans-serif" }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '2px solid #F5C6D8', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(245,198,216,0.2)' }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', padding: '4px 12px', borderRadius: '8px' }}>MKT</span>
          <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>place</span>
        </Link>
        <button onClick={handleLogout} style={{ background: 'white', color: '#c084a0', border: '2px solid #F5C6D8', padding: '8px 20px', borderRadius: '50px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>
          Log out
        </button>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>

        {/* Profile card */}
        <div style={{ background: 'white', borderRadius: '24px', border: '2px solid #F5C6D8', padding: '2rem', marginBottom: '1.5rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '180px', height: '180px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.15 }} />
          <div style={{ position: 'absolute', bottom: '-50px', left: '-30px', width: '150px', height: '150px', background: '#A8D4E8', borderRadius: '50%', opacity: 0.12 }} />

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', position: 'relative' }}>
            {/* Avatar */}
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'linear-gradient(135deg, #F5C6D8, #A8D4E8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '2rem', color: 'white', flexShrink: 0 }}>
              {profile.username?.[0]?.toUpperCase() || 'U'}
            </div>

            <div style={{ flex: 1 }}>
              {editing ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '1rem' }}>
                  {[
                    { name: 'username', placeholder: 'Username' },
                    { name: 'location', placeholder: 'Location' },
                    { name: 'phone', placeholder: 'Phone' },
                  ].map(f => (
                    <input key={f.name} name={f.name} placeholder={f.placeholder} value={form[f.name] || ''} onChange={e => setForm({ ...form, [e.target.name]: e.target.value })}
                      style={{ padding: '10px 14px', borderRadius: '12px', border: '2px solid #F5C6D8', background: '#FDF6F8', fontSize: '0.9rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#333' }}
                      onFocus={e => e.target.style.borderColor = '#A8D4E8'}
                      onBlur={e => e.target.style.borderColor = '#F5C6D8'}
                    />
                  ))}
                  <textarea name="bio" placeholder="Bio" value={form.bio || ''} onChange={e => setForm({ ...form, bio: e.target.value })}
                    style={{ padding: '10px 14px', borderRadius: '12px', border: '2px solid #F5C6D8', background: '#FDF6F8', fontSize: '0.9rem', outline: 'none', fontFamily: "'DM Sans', sans-serif", color: '#333', gridColumn: '1 / -1', resize: 'none', height: '70px' }}
                    onFocus={e => e.target.style.borderColor = '#A8D4E8'}
                    onBlur={e => e.target.style.borderColor = '#F5C6D8'}
                  />
                </div>
              ) : (
                <>
                  <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.5rem', color: '#3a2030', margin: '0 0 4px' }}>{profile.username}</h1>
                  <p style={{ color: '#b08090', fontSize: '0.85rem', margin: '0 0 8px' }}>📍 {profile.location || 'No location'} · 📧 {profile.email}</p>
                  <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 12px', lineHeight: 1.5 }}>{profile.bio || 'No bio yet.'}</p>
                </>
              )}

              {/* Stats */}
              <div style={{ display: 'flex', gap: '20px' }}>
                {[['⭐', profile.rating || '—', 'Rating'], ['🛍️', profile.total_sales || 0, 'Sales'], ['📅', profile.joined || '—', 'Joined']].map(([emoji, val, label]) => (
                  <div key={label} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1rem', color: '#3a2030' }}>{emoji} {val}</div>
                    <div style={{ fontSize: '0.75rem', color: '#b08090' }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Edit / Save buttons */}
            <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
              {editing ? (
                <>
                  <button onClick={handleSave} style={{ background: 'linear-gradient(135deg, #F5C6D8, #e8a8c4)', color: '#5a2d3f', border: 'none', padding: '8px 20px', borderRadius: '50px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Save</button>
                  <button onClick={() => setEditing(false)} style={{ background: 'white', color: '#b08090', border: '2px solid #F5C6D8', padding: '8px 16px', borderRadius: '50px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
                </>
              ) : (
                <button onClick={() => setEditing(true)} style={{ background: 'white', color: '#5a2d3f', border: '2px solid #F5C6D8', padding: '8px 20px', borderRadius: '50px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Edit profile</button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '8px 20px',
              borderRadius: '50px',
              border: '2px solid',
              borderColor: activeTab === tab ? '#F5C6D8' : '#ede0e5',
              background: activeTab === tab ? '#F5C6D8' : 'white',
              color: activeTab === tab ? '#5a2d3f' : '#888',
              fontFamily: "'Syne', sans-serif",
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
              textTransform: 'capitalize',
              transition: 'all 0.2s',
            }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Listings tab */}
        {activeTab === 'listings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {listings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#b08090' }}>
                <p style={{ fontSize: '2.5rem' }}>📦</p>
                <p style={{ fontWeight: 600 }}>No listings yet</p>
                <Link to="/new-product" style={{ color: '#A8D4E8', fontWeight: 700, textDecoration: 'none' }}>+ Post your first product</Link>
              </div>
            ) : listings.map(item => (
              <div key={item.id} style={{ background: 'white', borderRadius: '16px', border: '2px solid #F5C6D8', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <img src={item.image} alt={item.title} style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '10px', background: '#f0e0e8' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#3a2030', fontSize: '0.95rem' }}>{item.title}</div>
                  <div style={{ color: '#b08090', fontSize: '0.82rem' }}>{item.condition} · {item.price} €</div>
                </div>
                <span style={{
                  padding: '4px 14px',
                  borderRadius: '50px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: "'Syne', sans-serif",
                  background: item.status === 'available' ? '#E8F4FB' : '#F5F5F5',
                  color: item.status === 'available' ? '#2a6080' : '#888',
                }}>
                  {item.status === 'available' ? 'Active' : 'Sold'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Favorites tab */}
        {activeTab === 'favorites' && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b08090' }}>
            <p style={{ fontSize: '2.5rem' }}>♡</p>
            <p style={{ fontWeight: 600 }}>No favorites yet</p>
            <Link to="/" style={{ color: '#A8D4E8', fontWeight: 700, textDecoration: 'none' }}>Browse products</Link>
          </div>
        )}

        {/* Reviews tab */}
        {activeTab === 'reviews' && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#b08090' }}>
            <p style={{ fontSize: '2.5rem' }}>⭐</p>
            <p style={{ fontWeight: 600 }}>No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  )
}