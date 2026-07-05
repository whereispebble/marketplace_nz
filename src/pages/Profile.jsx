import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiEdit3, FiLogOut, FiMapPin, FiPackage, FiStar } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { MOCK_VEHICLES } from '../data/mockVehicles'

const MOCK_PROFILE = {
  username: 'Alex M.',
  email: 'alex@email.com',
  location: 'Auckland',
  phone: '+64 21 123 4567',
  bio: 'Weekend traveller and campervan seller focused on tidy, road-ready NZ vehicles with clear WOF and self-contained details.',
  rating: 4.8,
  total_sales: 23,
  joined: '2022',
}

const MOCK_LISTINGS = MOCK_VEHICLES.slice(0, 3).map((vehicle, index) => ({
  ...vehicle,
  status: index === 2 ? 'sold' : 'available',
}))

export default function Profile() {
  const navigate = useNavigate()
  const { sellerId } = useParams()
  const isPublicProfile = Boolean(sellerId)
  const sellerVehicle = useMemo(() => (
    MOCK_VEHICLES.find(vehicle => String(vehicle.seller?.id) === String(sellerId))
  ), [sellerId])
  const [profile, setProfile] = useState(MOCK_PROFILE)
  const [listings, setListings] = useState(() => (
    sellerId
      ? MOCK_VEHICLES.filter(vehicle => String(vehicle.seller?.id) === String(sellerId)).map(vehicle => ({ ...vehicle, status: 'available' }))
      : MOCK_LISTINGS
  ))
  const [activeTab, setActiveTab] = useState('listings')
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState(MOCK_PROFILE)

  useEffect(() => {
    let ignore = false

    async function loadProfile() {
      if (isPublicProfile) {
        if (sellerVehicle?.seller) {
          const sellerListings = MOCK_VEHICLES.filter(vehicle => String(vehicle.seller?.id) === String(sellerId))
          const seller = sellerVehicle.seller
          setProfile({
            username: seller.name,
            email: '',
            location: sellerVehicle.location,
            phone: '',
            bio: `${seller.name} listings on Swapy, focused on clear vehicle details, WOF status and New Zealand-ready handovers.`,
            rating: seller.rating,
            total_sales: seller.sales,
            joined: seller.joined,
          })
          setForm({
            username: seller.name,
            email: '',
            location: sellerVehicle.location,
            phone: '',
            bio: `${seller.name} listings on Swapy, focused on clear vehicle details, WOF status and New Zealand-ready handovers.`,
            rating: seller.rating,
            total_sales: seller.sales,
            joined: seller.joined,
          })
          setListings(sellerListings.map(vehicle => ({ ...vehicle, status: 'available' })))
        }
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (!ignore && data) { setProfile(data); setForm(data) }
      const { data: prods } = await supabase.from('products').select('*').eq('user_id', user.id)
      if (!ignore && prods?.length) setListings(prods)
    }

    loadProfile()
    return () => { ignore = true }
  }, [isPublicProfile, sellerId, sellerVehicle])

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

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section" style={{ maxWidth: 960 }}>
        <section className="panel panel-pad profile-layout">
          <div className="profile-head">
            <div className="avatar" style={{ width: 82, height: 82, borderRadius: 24, fontSize: '2rem' }}>{profile.username?.[0]?.toUpperCase() || 'U'}</div>
            <div style={{ flex: 1 }}>
              {editing ? (
                <div className="form-grid">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
                    {['username', 'location', 'phone'].map(name => (
                      <input key={name} className="field" name={name} placeholder={name} value={form[name] || ''} onChange={event => setForm({ ...form, [event.target.name]: event.target.value })} />
                    ))}
                  </div>
                  <textarea className="field" name="bio" placeholder="Bio" value={form.bio || ''} onChange={event => setForm({ ...form, bio: event.target.value })} />
                </div>
              ) : (
                <>
                  <h1 className="page-title" style={{ fontSize: 'clamp(2rem, 4vw, 3.4rem)' }}>{profile.username}</h1>
                  <p className="muted-row" style={{ marginTop: 10 }}><FiMapPin />{profile.location || 'No location'} · {profile.email}</p>
                  <p className="section-subtitle" style={{ maxWidth: 650 }}>{profile.bio || 'No bio yet.'}</p>
                </>
              )}
            </div>
            {!isPublicProfile && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {editing ? (
                <>
                  <button className="btn btn-primary" type="button" onClick={handleSave}>Save</button>
                  <button className="btn btn-secondary" type="button" onClick={() => setEditing(false)}>Cancel</button>
                </>
              ) : (
                <button className="btn btn-secondary" type="button" onClick={() => setEditing(true)}><FiEdit3 />Edit</button>
              )}
              <button className="btn btn-ghost" type="button" onClick={handleLogout}><FiLogOut />Log out</button>
            </div>}
          </div>

          <div className="stats-grid">
            <div className="stat-box"><strong><FiStar /> {profile.rating || '-'}</strong><span>Rating</span></div>
            <div className="stat-box"><strong>{profile.total_sales || 0}</strong><span>Listings</span></div>
            <div className="stat-box"><strong>{profile.joined || '-'}</strong><span>Joined</span></div>
          </div>
        </section>

        <div className="tabs" style={{ margin: '22px 0' }}>
          {['listings', 'saved', 'reviews'].map(tab => (
            <button key={tab} className={`chip ${activeTab === tab ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'listings' && (
          <div className="profile-layout">
            {listings.length === 0 ? (
              <div className="empty-state panel"><div><FiPackage size={42} /><h2>No listings yet</h2><Link to="/new-product" className="btn btn-primary">List a vehicle</Link></div></div>
            ) : listings.map(item => (
              <Link className="panel panel-pad listing-row listing-link" key={item.id} to={`/product/${item.id}`}>
                <img src={item.image || 'https://placehold.co/300x240/f1ede5/171717?text=Item'} alt={item.title} />
                <div>
                  <strong>{item.title}</strong>
                  <p className="section-subtitle" style={{ marginTop: 4 }}>{item.condition} · NZ${Number(item.price || 0).toLocaleString('en-NZ')}</p>
                </div>
                <span className={`badge ${item.status === 'available' ? 'badge-mint' : ''}`}>{item.status === 'available' ? 'Active' : 'Sold'}</span>
              </Link>
            ))}
          </div>
        )}

        {activeTab === 'saved' && <Empty title="No saved vehicles yet" action="Browse vehicles" to="/" />}
        {activeTab === 'reviews' && <Empty title="No reviews yet" />}
      </main>
    </div>
  )
}

function Empty({ title, action, to }) {
  return (
    <div className="empty-state panel">
      <div>
        <FiStar size={42} />
        <h2>{title}</h2>
        {action && <Link to={to} className="btn btn-primary">{action}</Link>}
      </div>
    </div>
  )
}
