import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiCamera, FiEdit3, FiFlag, FiLogOut, FiMapPin, FiMessageCircle, FiMoreHorizontal, FiPackage, FiStar, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { MOCK_VEHICLES } from '../data/mockVehicles'
import ProductCard from '../components/ProductCard'
import { getFavoriteProducts } from '../services/favorites'

const REPORT_REASONS = [
  'Scam or fraud',
  'Fake or misleading listing',
  'Offensive or abusive behaviour',
  'Spam',
  'Other',
]

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
  const [saved, setSaved] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportBusy, setReportBusy] = useState(false)
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const avatarInputRef = useRef(null)
  const avatarMenuRef = useRef(null)
  const moreMenuRef = useRef(null)

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

  // El menu de la foto se cierra al pulsar fuera, como cualquier desplegable.
  useEffect(() => {
    if (!avatarMenuOpen) return undefined

    const handleClickOutside = event => {
      if (!avatarMenuRef.current?.contains(event.target)) setAvatarMenuOpen(false)
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') setAvatarMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [avatarMenuOpen])

  // El menu de los tres puntos se cierra al pulsar fuera o con Escape.
  useEffect(() => {
    if (!moreMenuOpen) return undefined

    const handleClickOutside = event => {
      if (!moreMenuRef.current?.contains(event.target)) setMoreMenuOpen(false)
    }
    const handleKeyDown = event => {
      if (event.key === 'Escape') setMoreMenuOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [moreMenuOpen])

  // Los guardados son privados: solo se cargan en el perfil propio.
  useEffect(() => {
    if (isPublicProfile || activeTab !== 'saved') return undefined
    let ignore = false

    async function loadSaved() {
      setSavedLoading(true)
      const savedProducts = await getFavoriteProducts()
      if (ignore) return
      setSaved(savedProducts)
      setSavedLoading(false)
    }

    loadSaved()
    return () => { ignore = true }
  }, [activeTab, isPublicProfile])

  // Al abrir el perfil de otra persona la pestana de guardados no existe.
  const currentTab = isPublicProfile && activeTab === 'saved' ? 'listings' : activeTab

  // Marcar vendido o reservado desde la propia tarjeta del anuncio.
  const handleListingStatus = async (listingId, status) => {
    setListings(current => current.map(item => (item.id === listingId ? { ...item, status } : item)))
    await supabase.from('products').update({ status }).eq('id', listingId)
  }

  const handleReport = async () => {
    setReportBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('user_reports').insert({
      reported_user_id: sellerId,
      reporter_id: user?.id || null,
      reason: reportReason,
      details: reportDetails.trim() || null,
    })
    setReportBusy(false)
    setReportSent(true)
  }

  const closeReport = () => {
    setReportOpen(false)
    setReportSent(false)
    setReportReason(REPORT_REASONS[0])
    setReportDetails('')
  }

  const persistAvatar = async avatarUrl => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAvatarError('Sign in again to change your photo.')
      return false
    }

    const { error } = await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id)
    if (error) {
      setAvatarError(error.message)
      return false
    }

    setProfile(current => ({ ...current, avatar_url: avatarUrl }))
    setForm(current => ({ ...current, avatar_url: avatarUrl }))
    return true
  }

  const handleAvatarFile = async event => {
    const file = event.target.files?.[0]
    // El input se limpia siempre para que elegir el mismo fichero dos veces
    // seguidas vuelva a disparar el cambio.
    event.target.value = ''
    if (!file) return

    setAvatarError('')

    if (!file.type.startsWith('image/')) {
      setAvatarError('Choose an image file.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setAvatarError('The photo must be under 4 MB.')
      return
    }

    setAvatarBusy(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setAvatarError('Sign in again to change your photo.')
      setAvatarBusy(false)
      return
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })

    if (uploadError) {
      setAvatarError(uploadError.message)
      setAvatarBusy(false)
      return
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
    await persistAvatar(urlData.publicUrl)
    setAvatarBusy(false)
    setAvatarMenuOpen(false)
  }

  const handleAvatarRemove = async () => {
    setAvatarError('')
    setAvatarBusy(true)
    await persistAvatar(null)
    setAvatarBusy(false)
    setAvatarMenuOpen(false)
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

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section" style={{ maxWidth: 960 }}>
        <section className="panel panel-pad profile-layout">
          <div className="profile-head">
            {isPublicProfile ? (
              <div className="avatar avatar-lg">
                {profile.avatar_url
                  ? <img src={profile.avatar_url} alt={profile.username || 'Profile photo'} />
                  : profile.username?.[0]?.toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="avatar-editor" ref={avatarMenuRef}>
                <button
                  className="avatar avatar-lg avatar-button"
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={avatarMenuOpen}
                  aria-label="Change profile photo"
                  disabled={avatarBusy}
                  onClick={() => setAvatarMenuOpen(current => !current)}
                >
                  {profile.avatar_url
                    ? <img src={profile.avatar_url} alt="" />
                    : profile.username?.[0]?.toUpperCase() || 'U'}
                  <span className="avatar-overlay" aria-hidden="true">
                    <FiCamera />
                  </span>
                </button>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAvatarFile}
                />

                {avatarMenuOpen && (
                  <div className="avatar-menu" role="menu">
                    <button type="button" role="menuitem" onClick={() => avatarInputRef.current?.click()}>
                      <FiCamera />
                      {profile.avatar_url ? 'Change photo' : 'Upload photo'}
                    </button>
                    {profile.avatar_url && (
                      <button type="button" role="menuitem" className="is-danger" onClick={handleAvatarRemove}>
                        <FiTrash2 />
                        Remove photo
                      </button>
                    )}
                  </div>
                )}

                {avatarBusy && <span className="avatar-status">Saving...</span>}
                {avatarError && <span className="avatar-status is-error">{avatarError}</span>}
              </div>
            )}
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
                  <h1 className="page-title">{profile.username}</h1>
                  <p className="muted-row" style={{ marginTop: 10 }}><FiMapPin />{profile.location || 'No location'} · {profile.email}</p>
                  <p className="section-subtitle" style={{ maxWidth: 650 }}>{profile.bio || 'No bio yet.'}</p>
                </>
              )}
            </div>
            {isPublicProfile && (
              <div className="profile-public-actions">
                <Link className="btn btn-secondary btn-compact" to={`/chats/user/${sellerId}`}>
                  <FiMessageCircle />
                  Message
                </Link>
                <div className="more-menu" ref={moreMenuRef}>
                  <button
                    className="icon-btn"
                    type="button"
                    aria-haspopup="menu"
                    aria-expanded={moreMenuOpen}
                    aria-label="More options"
                    onClick={() => setMoreMenuOpen(current => !current)}
                  >
                    <FiMoreHorizontal />
                  </button>
                  {moreMenuOpen && (
                    <div className="avatar-menu more-menu-list" role="menu">
                      <button
                        type="button"
                        role="menuitem"
                        className="is-danger"
                        onClick={() => { setMoreMenuOpen(false); setReportOpen(true) }}
                      >
                        <FiFlag />
                        Report user
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
          {(isPublicProfile ? ['listings', 'reviews'] : ['listings', 'saved', 'reviews']).map(tab => (
            <button key={tab} className={`chip ${currentTab === tab ? 'is-active' : ''}`} type="button" onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {currentTab === 'listings' && (
          listings.length === 0 ? (
            <div className="empty-state panel"><div><FiPackage size={42} /><h2>No listings yet</h2><Link to="/new-product" className="btn btn-primary">List a vehicle</Link></div></div>
          ) : (
            <div className="products-grid profile-products-grid">
              {listings.map(item => (
                <div className="profile-listing" key={item.id}>
                  <ProductCard
                    product={item}
                    owned={!isPublicProfile}
                    onStatusChange={status => handleListingStatus(item.id, status)}
                  />
                  <div className="profile-listing-actions">
                    <span className={`badge ${['active', 'available'].includes(item.status) ? 'badge-mint' : ''}`}>{formatStatus(item.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {currentTab === 'saved' && !isPublicProfile && (
          savedLoading ? (
            <div className="loading-state"><div><div className="spinner" />Loading saved vehicles...</div></div>
          ) : saved.length === 0 ? (
            <Empty title="No saved vehicles yet" action="Browse vehicles" to="/" />
          ) : (
            <div className="products-grid profile-products-grid">
              {saved.map(item => <ProductCard key={`saved-${item.id}`} product={item} initiallyLiked />)}
            </div>
          )
        )}
        {currentTab === 'reviews' && <Empty title="No reviews yet" />}
      </main>

      {reportOpen && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Report user" onClick={closeReport}>
          <div className="panel panel-pad modal-card" onClick={event => event.stopPropagation()}>
            {reportSent ? (
              <>
                <h2 className="section-title" style={{ fontSize: '1.2rem' }}>Report sent</h2>
                <p className="section-subtitle">Thanks for letting us know. Our team reviews every report about {profile.username}.</p>
                <div className="modal-actions">
                  <button className="btn btn-primary" type="button" onClick={closeReport}>Close</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="section-title" style={{ fontSize: '1.2rem' }}>Report {profile.username}</h2>
                <p className="section-subtitle">Tell us what is wrong. Reports are private and the seller is not notified.</p>
                <label className="field-group">
                  <span>Reason</span>
                  <select className="field" value={reportReason} onChange={event => setReportReason(event.target.value)}>
                    {REPORT_REASONS.map(reason => <option key={reason} value={reason}>{reason}</option>)}
                  </select>
                </label>
                <label className="field-group" style={{ marginTop: 12 }}>
                  <span>Details (optional)</span>
                  <textarea
                    className="field"
                    rows={4}
                    placeholder="What happened?"
                    value={reportDetails}
                    onChange={event => setReportDetails(event.target.value)}
                  />
                </label>
                <div className="modal-actions">
                  <button className="btn btn-secondary" type="button" onClick={closeReport}>Cancel</button>
                  <button className="btn btn-primary" type="button" disabled={reportBusy} onClick={handleReport}>
                    {reportBusy ? 'Sending...' : 'Send report'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

function formatStatus(status) {
  if (status === 'available') return 'Active'
  if (status === 'reserved') return 'Booked'
  if (!status) return 'Draft'
  return status.charAt(0).toUpperCase() + status.slice(1)
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
