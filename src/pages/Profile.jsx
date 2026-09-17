/**
 * Perfil de usuario.
 *
 * Sirve dos pantallas con el mismo componente:
 *   /profile              perfil propio, con edicion, guardados y gestion de anuncios
 *   /profile/:sellerId    perfil publico de un vendedor, solo sus anuncios publicados
 *
 * Lo que NUNCA debe cruzarse entre ambas: los guardados y los datos de contacto
 * son privados del dueno de la cuenta. El perfil publico se lee de la vista
 * public_profiles, que no expone email ni telefono.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { FiCamera, FiEdit3, FiFlag, FiLogOut, FiMapPin, FiMoreHorizontal, FiPackage, FiStar, FiTrash2 } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import { getCurrentUser, signOut } from '../services/session'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import ProductCard from '../components/ProductCard'
import LoadingScreen from '../components/LoadingScreen'
import { getFavoriteProducts } from '../services/favorites'
import { PUBLIC_LISTING_STATUSES } from '../constants/listingStatus'
import { DEV_PROFILE, isDevSessionActive } from '../services/devAuth'
import { loadDevListings, saveDevListing } from '../services/devData'

const REPORT_REASONS = [
  'Scam or fraud',
  'Fake or misleading listing',
  'Offensive or abusive behaviour',
  'Spam',
  'Other',
]

/** Perfil vacio mientras se cargan los datos reales. */
const EMPTY_PROFILE = {
  username: '',
  email: '',
  location: '',
  phone: '',
  bio: '',
  avatar_url: null,
  rating: 0,
  total_sales: 0,
  joined: '',
}

export default function Profile() {
  const navigate = useNavigate()
  // sellerId solo llega en /profile/:sellerId, es decir en un perfil ajeno.
  const { sellerId } = useParams()
  const isPublicProfile = Boolean(sellerId)

  // Datos del perfil que se esta mostrando y copia editable del formulario.
  const [profile, setProfile] = useState(EMPTY_PROFILE)
  const [form, setForm] = useState(EMPTY_PROFILE)
  const [listings, setListings] = useState([])
  const [profileLoading, setProfileLoading] = useState(true)
  const [profileError, setProfileError] = useState('')
  const [actionError, setActionError] = useState('')

  // Pestana visible y estado del formulario de edicion.
  const [activeTab, setActiveTab] = useState('listings')
  const [editing, setEditing] = useState(false)

  // Guardados: solo se cargan en el perfil propio y nunca en uno ajeno.
  const [saved, setSaved] = useState([])
  const [savedLoading, setSavedLoading] = useState(false)
  const [reviews, setReviews] = useState([])

  // Menu de los tres puntos y formulario de denuncia de un perfil ajeno.
  const [moreMenuOpen, setMoreMenuOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState(REPORT_REASONS[0])
  const [reportDetails, setReportDetails] = useState('')
  const [reportSent, setReportSent] = useState(false)
  const [reportBusy, setReportBusy] = useState(false)

  // Cambio de la foto de perfil.
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  // Estas cifras proceden de los anuncios que realmente pertenecen al perfil.
  // Evitamos usar total_sales como contador de anuncios: es un campo heredado
  // que puede quedarse desactualizado y nunca representó el total de listings.
  const salesCount = listings.filter(listing => listing.status === 'sold').length

  const avatarInputRef = useRef(null)
  const avatarMenuRef = useRef(null)
  const moreMenuRef = useRef(null)

  /**
   * Carga el perfil que toca segun la ruta.
   *
   * Lo primero que hace es vaciar el estado anterior. Sin eso, al pasar del
   * perfil de un vendedor al propio (por ejemplo pulsando "Profile" en el
   * menu) se quedaban en pantalla los datos del vendedor mientras llegaban
   * los nuevos, y con ellos aparecia la pestana de guardados: era el fallo
   * que hacia parecer que se veian los favoritos de otra persona.
   */
  useEffect(() => {
    let ignore = false

    // Clear private state immediately when switching profile routes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfile(EMPTY_PROFILE)
    setForm(EMPTY_PROFILE)
    setListings([])
    setSaved([])
    setReviews([])
    setActiveTab('listings')
    setEditing(false)
    setProfileError('')
    setProfileLoading(true)

    async function loadProfile() {
      async function loadReviewsFor(profileId) {
        const { data: reviewRows, error: reviewError } = await supabase
          .from('public_reviews')
          .select('*')
          .eq('reviewed_user_id', profileId)
          .order('created_at', { ascending: false })
        if (reviewError || !reviewRows?.length) { setReviews([]); return }
        const reviewerIds = [...new Set(reviewRows.map(review => review.reviewer_id))]
        const { data: reviewers } = await supabase.from('public_profiles').select('id,username,avatar_url').in('id', reviewerIds)
        const byId = new Map((reviewers || []).map(reviewer => [String(reviewer.id), reviewer]))
        setReviews(reviewRows.map(review => ({ ...review, reviewer: byId.get(String(review.reviewer_id)) })))
      }
      // --- Perfil ajeno: vista publica, sin email ni telefono --------------
      if (isPublicProfile && isDevSessionActive()) {
        const devListings = await loadDevListings()
        if (ignore) return
        const sellerListing = devListings.find(listing => String(listing.seller?.id) === String(sellerId))
        if (String(sellerId) === String(DEV_PROFILE.id)) {
          setProfile({ ...DEV_PROFILE, email: '', phone: '' })
          setListings(devListings)
        } else if (sellerListing?.seller) {
          setProfile({
            ...EMPTY_PROFILE,
            username: sellerListing.seller.name || 'Seller',
            rating: sellerListing.seller.rating || 0,
            total_sales: sellerListing.seller.sales || 0,
            joined: sellerListing.seller.joined || '',
          })
          setListings(devListings.filter(listing => String(listing.seller?.id) === String(sellerId)))
        } else {
          setProfileError('This profile is not available.')
        }
        setProfileLoading(false)
        return
      }

      if (isPublicProfile) {
        const { data: publicProfile, error } = await supabase
          .from('public_profiles')
          .select('id, username, location, bio, avatar_url, rating, total_sales, joined, created_at')
          .eq('id', sellerId)
          .maybeSingle()

        if (ignore) return

        if (error || !publicProfile) {
          setProfileError('This profile is not available.')
          setProfileLoading(false)
          return
        }

        // Solo los anuncios publicados. Los borradores del vendedor no se ven
        // ni aqui ni consultando la API: la politica RLS tambien los filtra.
        const { data: sellerListings } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', sellerId)
          .in('status', PUBLIC_LISTING_STATUSES)
          .order('created_at', { ascending: false })

        if (ignore) return
        setProfile({ ...EMPTY_PROFILE, ...publicProfile })
        setListings(sellerListings || [])
        await loadReviewsFor(sellerId)
        setProfileLoading(false)
        return
      }

      // --- Perfil propio ---------------------------------------------------
      const user = await getCurrentUser()
      if (ignore) return

      if (!user) {
        // RequireAuth ya deberia haber redirigido; esto cubre el caso de que
        // la sesion caduque con la pagina abierta.
        navigate('/login', { replace: true })
        return
      }

      // Sesion de prueba de desarrollo: no hay fila en la base de datos, asi
      // que se pintan un perfil y unos anuncios de ejemplo. Esta rama no
      // existe en el paquete de produccion (ver services/devAuth.js).
      if (isDevSessionActive()) {
        const devListings = await loadDevListings()
        if (ignore) return

        setProfile(DEV_PROFILE)
        setForm(DEV_PROFILE)
        setListings(devListings)
        setProfileLoading(false)
        return
      }

      const { data: ownProfile, error: ownError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (ignore) return

      if (ownError || !ownProfile) throw new Error('Profile unavailable')
      // Si el perfil aun no existe se usa el correo de la sesion como base.
      const resolvedProfile = { ...EMPTY_PROFILE, email: user.email || '', ...(ownProfile || {}) }
      setProfile(resolvedProfile)
      setForm(resolvedProfile)

      // Aqui si entran todos los estados: el dueno ve tambien sus borradores.
      const { data: ownListings } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (ignore) return
      setListings(ownListings || [])
      await loadReviewsFor(user.id)
      setProfileLoading(false)
    }

    loadProfile().catch(() => { if (!ignore) { setProfileError('Could not load this profile. Please try again.'); setProfileLoading(false) } })
    return () => { ignore = true }
  }, [isPublicProfile, sellerId, navigate])

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

    loadSaved().catch(() => { if (!ignore) { setSavedLoading(false); setActionError('Could not load saved vehicles. Please try again.') } })
    return () => { ignore = true }
  }, [activeTab, isPublicProfile])

  // Al abrir el perfil de otra persona la pestana de guardados no existe.
  const currentTab = isPublicProfile && activeTab === 'saved' ? 'listings' : activeTab

  /**
   * Marca un anuncio propio como vendido o reservado desde su tarjeta.
   * El filtro por user_id es defensa en capas: la politica RLS ya impide
   * actualizar un anuncio ajeno, pero asi la consulta tampoco lo intenta.
   * @param {string} listingId id del anuncio
   * @param {string} status nuevo estado
   */
  const handleListingStatus = async (listingId, status) => {
    const user = await getCurrentUser()
    if (!user) return

    const previousListings = listings
    setListings(current => current.map(item => (item.id === listingId ? { ...item, status } : item)))
    if (isDevSessionActive()) {
      saveDevListing(listingId, { status })
      return
    }

    const { error } = await supabase
      .from('products')
      .update({ status })
      .eq('id', listingId)
      .eq('user_id', user.id)
    if (error) { setListings(previousListings); setActionError('Could not change the listing status. Please try again.') }
  }

  const handleDeleteListing = async () => {
    if (!deleteTarget) return
    setDeleteBusy(true)
    setActionError('')
    const listingId = deleteTarget.id

    if (isDevSessionActive()) {
      saveDevListing(listingId, { deleted: true })
      setListings(current => current.filter(item => item.id !== listingId))
      setDeleteTarget(null)
      setDeleteBusy(false)
      return
    }

    const user = await getCurrentUser()
    if (!user) { setDeleteBusy(false); navigate('/login', { replace: true }); return }
    const { data: deletedListing, error } = await supabase
      .from('products')
      .delete()
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle()
    if (error || !deletedListing) {
      setActionError('Could not delete the listing. Please try again.')
      setDeleteBusy(false)
      return
    }

    setListings(current => current.filter(item => item.id !== listingId))
    setDeleteTarget(null)
    setDeleteBusy(false)
  }

  /**
   * Envia una denuncia sobre el perfil que se esta viendo.
   * Requiere sesion: la politica de user_reports exige que reporter_id sea el
   * usuario identificado, asi que una denuncia anonima se rechazaria.
   */
  const handleReport = async () => {
    setReportBusy(true)
    const user = await getCurrentUser()

    if (!user) {
      setReportBusy(false)
      navigate('/login', { replace: true })
      return
    }

    // Las acciones de la sesion DEV nunca escriben en tablas reales.
    if (isDevSessionActive()) {
      setReportBusy(false)
      setReportSent(true)
      return
    }

    const { error } = await supabase.from('user_reports').insert({
      reported_user_id: sellerId,
      reporter_id: user.id,
      reason: reportReason,
      details: reportDetails.trim() || null,
    })

    setReportBusy(false)
    if (error) { setActionError('Report could not be sent. Please try again.'); return }
    setReportSent(true)
  }

  const closeReport = () => {
    setReportOpen(false)
    setReportSent(false)
    setReportReason(REPORT_REASONS[0])
    setReportDetails('')
  }

  /**
   * Guarda (o borra, con null) la URL de la foto de perfil.
   * @param {string|null} avatarUrl
   * @returns {Promise<boolean>} true si se guardo
   */
  const persistAvatar = async avatarUrl => {
    const user = await getCurrentUser()
    if (!user) {
      setAvatarError('Sign in again to change your photo.')
      return false
    }

    if (isDevSessionActive()) {
      setProfile(current => ({ ...current, avatar_url: avatarUrl }))
      setForm(current => ({ ...current, avatar_url: avatarUrl }))
      return true
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

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setAvatarError('Choose an image file.')
      return
    }
    if (file.size > 4 * 1024 * 1024) {
      setAvatarError('The photo must be under 4 MB.')
      return
    }

    setAvatarBusy(true)
    const user = await getCurrentUser()
    if (!user) {
      setAvatarError('Sign in again to change your photo.')
      setAvatarBusy(false)
      return
    }

    if (isDevSessionActive()) {
      await persistAvatar(URL.createObjectURL(file))
      setAvatarBusy(false)
      setAvatarMenuOpen(false)
      return
    }
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
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

  /**
   * Guarda los cambios del perfil propio.
   * Solo se mandan los campos que el usuario puede editar: la reputacion y el
   * numero de ventas los calcula el sistema, no el navegador.
   */
  const handleSave = async () => {
    if (isDevSessionActive()) { setProfile(current => ({ ...current, ...form })); setEditing(false); return }
    const user = await getCurrentUser()
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        username: form.username,
        location: form.location,
        phone: form.phone,
        bio: form.bio,
      })
      .eq('id', user.id)

    if (error) {
      setActionError('Could not save your profile. The username may already be taken. Please try again.')
      return
    }

    setProfile(current => ({ ...current, ...form }))
    setEditing(false)
  }

  /**
   * Cierra la sesion. signOut borra ademas los guardados que quedasen en el
   * navegador, para que no los herede quien use el equipo despues.
   */
  const handleLogout = async () => {
    try {
      await signOut()
      navigate('/login', { replace: true })
    } catch { setActionError('Could not sign out. Please try again.') }
  }

  // Mientras llegan los datos no se pinta el perfil: si no, se vería un
  // esqueleto con los campos vacíos que parece una cuenta sin rellenar.
  if (profileLoading) {
    return <LoadingScreen fullPage label="Loading profile" />
  }

  // Perfil inexistente o sin permiso para verlo.
  if (profileError) {
    return (
      <div className="app-shell">
        <Navbar compact />
        <main className="container page-section">
          <div className="empty-state panel">
            <div>
              <FiPackage size={42} />
              <h2>{profileError}</h2>
              <Link to="/" className="btn btn-primary">Browse vehicles</Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section" style={{ maxWidth: 960 }}>
        {actionError && <p role="alert">{actionError}</p>}
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
                  <p className="muted-row" style={{ marginTop: 10 }}>
                    <FiMapPin />
                    {profile.location || 'No location'}
                    {!isPublicProfile && profile.email ? ` · ${profile.email}` : ''}
                  </p>
                  <p className="section-subtitle" style={{ maxWidth: 650 }}>{profile.bio || 'No bio yet.'}</p>
                </>
              )}
            </div>
            {isPublicProfile && (
              <div className="profile-public-actions">
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
            <div className="stat-box"><strong>{salesCount}</strong><span>Sales</span></div>
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
                <ProductCard
                  key={item.id}
                  product={item}
                  owned={!isPublicProfile}
                  onStatusChange={status => handleListingStatus(item.id, status)}
                  onDelete={() => setDeleteTarget(item)}
                />
              ))}
            </div>
          )
        )}

        {currentTab === 'saved' && !isPublicProfile && (
          savedLoading ? (
            <LoadingScreen label="Loading saved vehicles" />
          ) : saved.length === 0 ? (
            <Empty title="No saved vehicles yet" action="Browse vehicles" to="/" />
          ) : (
            <div className="products-grid profile-products-grid">
              {saved.map(item => <ProductCard key={`saved-${item.id}`} product={item} initiallyLiked />)}
            </div>
          )
        )}
        {currentTab === 'reviews' && (
          reviews.length === 0 ? <Empty title="No reviews yet" /> : (
            <div className="review-list">
              {reviews.map(review => (
                <article className="panel panel-pad profile-review" key={review.id}>
                  <div className="profile-review-head">
                    <div className="avatar">
                      {review.reviewer?.avatar_url ? <img src={review.reviewer.avatar_url} alt="" /> : review.reviewer?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <strong>{review.reviewer?.username || 'Swapy user'}</strong>
                      <span className="profile-review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5-review.rating)}</span>
                    </div>
                    <time dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString('en-NZ')}</time>
                  </div>
                  {review.comment && <p>{review.comment}</p>}
                  {review.product_id && <Link to={`/product/${review.product_id}`}>View related listing</Link>}
                </article>
              ))}
            </div>
          )
        )}
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

      {deleteTarget && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="delete-listing-title" onClick={() => { if (!deleteBusy) setDeleteTarget(null) }}>
          <div className="panel panel-pad modal-card" onClick={event => event.stopPropagation()}>
            <h2 id="delete-listing-title" className="section-title" style={{ fontSize: '1.2rem' }}>Delete listing?</h2>
            <p className="section-subtitle">“{deleteTarget.title}” will be permanently deleted. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" type="button" disabled={deleteBusy} onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="btn btn-danger" type="button" disabled={deleteBusy} onClick={handleDeleteListing}>
                {deleteBusy ? 'Deleting...' : 'Delete listing'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
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
