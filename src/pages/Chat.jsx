/**
 * Mensajes entre comprador y vendedor.
 *
 * Lista de conversaciones a la izquierda y la conversacion abierta a la
 * derecha; en movil se alterna entre las dos. Una conversacion solo la ven sus
 * dos participantes: lo garantizan las politicas RLS de chats y messages.
 */

import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCheck, FiFile, FiImage, FiMessageSquare, FiPaperclip, FiSend, FiStar, FiTag, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import LoadingScreen from '../components/LoadingScreen'
import { loadMockVehicles } from '../services/devData'
import { isDevSessionActive } from '../services/devAuth'
import { isUuid } from '../services/validation'

/**
 * Conversaciones de ejemplo a partir de los anuncios de prueba.
 * Solo se usan en desarrollo: en produccion la bandeja arranca vacia hasta que
 * haya conversaciones reales en la base de datos.
 *
 * @returns {Promise<object[]>}
 */
async function buildMockChats() {
  const vehicles = await loadMockVehicles()

  return vehicles.map((vehicle, index) => ({
    id: index + 1,
    sellerId: vehicle.seller?.id,
    otherUserId: vehicle.seller?.id,
    product: vehicle,
    other_user: vehicle.seller?.name || 'Seller',
    last_message: index === 0
      ? 'Is it still available to view this weekend?'
      : 'Hi, I am interested in this listing.',
    last_message_at: index === 0 ? '10:30' : 'New',
    unread: index === 0 ? 2 : 0,
  }))
}

const mockDay = new Date().toISOString().slice(0, 10)
const MOCK_MESSAGES = [
  { id: 1, sender_id: 'other', content: 'Hi, is the Hiace still available?', created_at: `${mockDay}T10:28:00`, read_at: `${mockDay}T10:29:00` },
  { id: 2, sender_id: 'me', content: 'Yes, it is. WOF is current and it is certified self-contained.', created_at: `${mockDay}T10:29:00`, read_at: `${mockDay}T10:30:00` },
  { id: 3, sender_id: 'other', content: 'Great. Can I view it in Auckland this weekend?', created_at: `${mockDay}T10:30:00`, read_at: `${mockDay}T10:31:00` },
  { id: 4, sender_id: 'me', content: 'Sure. Saturday morning works, and I can show you the WOF, service history and layout.', created_at: `${mockDay}T10:31:00`, read_at: `${mockDay}T10:32:00` },
  { id: 5, sender_id: 'other', content: 'Perfect, I am interested.', created_at: `${mockDay}T10:32:00`, read_at: `${mockDay}T10:32:00` },
]

function formatPrice(value) {
  return `NZ$${Number(value || 0).toLocaleString('en-NZ')}`
}

function messageDate(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function messageDayKey(value) {
  const date = messageDate(value)
  if (!date) return ''
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
}

function formatMessageTime(value) {
  const date = messageDate(value)
  return date ? date.toLocaleTimeString('en-NZ', { hour: '2-digit', minute: '2-digit' }) : ''
}

function formatMessageDay(value) {
  const date = messageDate(value)
  if (!date) return ''
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (messageDayKey(date) === messageDayKey(today)) return 'Today'
  if (messageDayKey(date) === messageDayKey(yesterday)) return 'Yesterday'
  return date.toLocaleDateString('en-NZ', { day: 'numeric', month: 'long', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' })
}

export default function Chat() {
  const { chatId } = useParams()
  const [searchParams] = useSearchParams()
  const requestedProductId = searchParams.get('productId')
  const requestedSellerId = searchParams.get('sellerId')

  const [chats, setChats] = useState([])
  const [chatsLoading, setChatsLoading] = useState(true)
  const [messages, setMessages] = useState([])
  const [selectedChatId, setSelectedChatId] = useState(null)
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(chatId))
  const [newMessage, setNewMessage] = useState('')
  const [chatError, setChatError] = useState('')
  const [sending, setSending] = useState(false)
  const [attachment, setAttachment] = useState(null)
  const [attachmentUrls, setAttachmentUrls] = useState({})
  const [chatReviews, setChatReviews] = useState([])
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewBusy, setReviewBusy] = useState(false)
  const sendLock = useRef(false)
  const attachmentInputRef = useRef(null)
  const activeChatRef = useRef(null)
  const [offerAmount, setOfferAmount] = useState('')
  const [offers, setOffers] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const messagesRef = useRef(null)
  const selectedChat = chats.find(chat => chat.id === selectedChatId) || chats[0] || null
  useEffect(() => { activeChatRef.current = selectedChat?.id }, [selectedChat?.id])
  const selectedOffer = selectedChat ? offers[selectedChat.id] : null
  const agreedPrice = selectedOffer?.status === 'accepted' ? selectedOffer.amount : selectedChat?.product?.price
  const sellerUserId = selectedChat?.product?.user_id || selectedChat?.product?.seller_id || selectedChat?.sellerId
  const isSeller = Boolean(currentUser?.id && sellerUserId && String(currentUser.id) === String(sellerUserId))

  useEffect(() => {
    let ignore = false

    async function loadCurrentUser() {
      if (isDevSessionActive()) {
        setCurrentUser(null)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!ignore) setCurrentUser(user)
    }

    loadCurrentUser().catch(() => { if (!ignore) setChatError('Could not check your session. Please sign in again.') })
    return () => { ignore = true }
  }, [])

  // En modo DEV se conservan las conversaciones de ejemplo. Con una cuenta
  // real se cargan exclusivamente chats y mensajes de Supabase.
  useEffect(() => {
    let ignore = false

    async function loadChats() {
      if (isDevSessionActive()) {
        const mockChats = await buildMockChats()
        if (ignore) return
        const allChats = mockChats
        setChats(allChats)
        setMessages(MOCK_MESSAGES)
        const requested = mockChats.find(chat => String(chat.id) === String(chatId) || String(chat.sellerId) === String(chatId) || String(chat.product?.id) === String(chatId))
        setSelectedChatId(current => current || requested?.id || allChats[0]?.id || null)
        setChatsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setChatsLoading(false); return }
      const { data: rows, error } = await supabase.from('chats').select('*').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).order('updated_at', { ascending: false })
      if (error) throw error
      // The product is the context and identity of every conversation.
      // Legacy direct chats are deliberately omitted from the frontend.
      const listingRows = (rows || []).filter(row => row.product_id)
      const productIds = listingRows.map(row => row.product_id)
      const participantIds = [...new Set(listingRows.flatMap(row => [row.buyer_id, row.seller_id]).filter(id => id && id !== user.id))]
      const [{ data: products }, { data: profiles }] = await Promise.all([
        productIds.length ? supabase.from('products').select('*').in('id', productIds) : Promise.resolve({ data: [] }),
        participantIds.length ? supabase.from('public_profiles').select('id, username').in('id', participantIds) : Promise.resolve({ data: [] }),
      ])
      const productById = new Map((products || []).map(product => [String(product.id), product]))
      const profileById = new Map((profiles || []).map(profile => [String(profile.id), profile]))
      const realChats = listingRows.map(row => {
        const otherId = row.buyer_id === user.id ? row.seller_id : row.buyer_id
        const product = productById.get(String(row.product_id)) || null
        return { ...row, sellerId: row.seller_id, otherUserId: otherId, product, other_user: profileById.get(String(otherId))?.username || 'User', last_message: 'Open conversation', last_message_at: row.updated_at ? new Date(row.updated_at).toLocaleDateString() : '', unread: 0 }
      }).filter(chat => chat.product)
      let requested = chatId
      if (requestedProductId) {
        if (!isUuid(requestedProductId) || (requestedSellerId && !isUuid(requestedSellerId))) throw new Error('Invalid conversation link.')
        const { data: opened, error: openError } = await supabase.rpc('start_conversation', {
          p_product_id: requestedProductId, p_seller_id: requestedSellerId || null,
        })
        if (openError) throw openError
        if (ignore) return
        requested = opened.id
        if (!realChats.some(chat => chat.id === opened.id)) {
          const otherId = opened.buyer_id === user.id ? opened.seller_id : opened.buyer_id
          const [{ data: product }, { data: profile }] = await Promise.all([
            opened.product_id ? supabase.from('products').select('*').eq('id', opened.product_id).maybeSingle() : Promise.resolve({ data: null }),
            supabase.from('public_profiles').select('username').eq('id', otherId).maybeSingle(),
          ])
          if (!product) throw new Error('Listing unavailable.')
          realChats.unshift({ ...opened, sellerId: opened.seller_id, otherUserId: otherId, product, other_user: profile?.username || 'User', unread: 0 })
        }
      }
      if (ignore) return
      if (requested && !realChats.some(chat => chat.id === requested)) throw new Error('Conversation unavailable.')
      setChats(realChats)
      setSelectedChatId(requested || realChats[0]?.id || null)
      setMobileChatOpen(Boolean(requested))
      setChatsLoading(false)
    }

    loadChats().catch(() => { if (!ignore) { setChats([]); setChatsLoading(false); setChatError('Could not open conversations. Please reload to try again.') } })
    return () => { ignore = true }
  }, [chatId, requestedProductId, requestedSellerId])

  const activeChatId = selectedChat?.id
  const isListingConversation = Boolean(selectedChat?.product)
  useEffect(() => {
    if (!activeChatId || isDevSessionActive() || !currentUser || !isUuid(activeChatId)) return
    let ignore = false
    let timer
    async function refresh() {
      try {
        const [{ data, error }, { data: chatOffers, error: offerError }, reviewResult, chatStateResult] = await Promise.all([
          supabase.from('messages').select('*').eq('chat_id', activeChatId).order('created_at', { ascending: true }),
          isListingConversation
            ? supabase.from('offers').select('*').eq('chat_id', activeChatId).order('created_at', { ascending: false }).limit(1)
            : Promise.resolve({ data: [], error: null }),
          supabase.from('reviews').select('*').eq('chat_id', activeChatId).order('created_at', { ascending: true }),
          supabase.from('chats').select('sold_at').eq('id', activeChatId).single(),
        ])
        if (error || offerError) throw error || offerError
        if (ignore) return
        let nextMessages = data || []
        const unreadIds = nextMessages
          .filter(message => message.sender_id !== currentUser.id && !message.read_at)
          .map(message => message.id)
        if (unreadIds.length) {
          const readAt = new Date().toISOString()
          const { error: readError } = await supabase
            .from('messages')
            .update({ read_at: readAt })
            .in('id', unreadIds)
            .is('read_at', null)
          if (!readError) {
            const unreadSet = new Set(unreadIds.map(String))
            nextMessages = nextMessages.map(message => unreadSet.has(String(message.id)) ? { ...message, read_at: readAt } : message)
          }
        }
        setMessages(nextMessages)
        if (!reviewResult.error) setChatReviews(reviewResult.data || [])
        if (!chatStateResult.error) setChats(current => current.map(chat => chat.id === activeChatId ? { ...chat, sold_at: chatStateResult.data?.sold_at || null } : chat))
        setOffers(current => ({ ...current, [activeChatId]: chatOffers?.[0] || null }))
        const missingPaths = nextMessages.map(message => message.attachment_path).filter(path => path && !attachmentUrls[path])
        if (missingPaths.length) {
          const signed = await Promise.all([...new Set(missingPaths)].map(async path => {
            const { data: signedData } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 3600)
            return [path, signedData?.signedUrl]
          }))
          if (!ignore) setAttachmentUrls(current => ({ ...current, ...Object.fromEntries(signed.filter(([, url]) => url)) }))
        }
      } catch {
        // A temporary refresh problem must not replace or block the chat UI.
      } finally {
        if (!ignore) timer = setTimeout(refresh, 4000)
      }
    }
    // Never show the previous conversation while the next one loads.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([])
    refresh()
    return () => { ignore = true; clearTimeout(timer) }
  }, [activeChatId, currentUser, isListingConversation, attachmentUrls])

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, selectedChat])

  const handleSend = async () => {
    const content = newMessage.trim()
    if ((!content && !attachment) || content.length > 5000 || !selectedChat || sendLock.current) return
    const targetId = selectedChat.id
    sendLock.current = true
    setSending(true)
    setChatError('')
    try {
      let message
      if (isDevSessionActive()) {
        message = { id: crypto.randomUUID(), sender_id: 'me', content, created_at: new Date().toISOString(), attachment_name: attachment?.name, attachment_type: attachment?.type, attachment_url: attachment ? URL.createObjectURL(attachment) : null }
      } else {
        if (!currentUser || !isUuid(targetId)) throw new Error('Sign in again.')
        let attachmentPath = null
        if (attachment) {
          const extension = attachment.name.includes('.') ? `.${attachment.name.split('.').pop().toLowerCase()}` : ''
          attachmentPath = `${targetId}/${currentUser.id}/${crypto.randomUUID()}${extension}`
          const { error: uploadError } = await supabase.storage.from('chat-attachments').upload(attachmentPath, attachment)
          if (uploadError) throw uploadError
        }
        const messagePayload = { chat_id: targetId, sender_id: currentUser.id, content }
        if (attachment) Object.assign(messagePayload, {
          attachment_path: attachmentPath, attachment_name: attachment.name,
          attachment_type: attachment.type, attachment_size: attachment.size,
        })
        const { data, error } = await supabase.from('messages').insert(messagePayload).select().single()
        if (error) throw error
        message = data
        if (attachmentPath) {
          const { data: signedData } = await supabase.storage.from('chat-attachments').createSignedUrl(attachmentPath, 3600)
          if (signedData?.signedUrl) setAttachmentUrls(current => ({ ...current, [attachmentPath]: signedData.signedUrl }))
        }
      }
      if (activeChatRef.current === targetId) {
        setMessages(current => current.some(item => item.id === message.id) ? current : [...current, message])
        setNewMessage('')
        setAttachment(null)
      }
    } catch {
      setChatError('Message was not confirmed as sent. Check the conversation before retrying.')
    } finally {
      sendLock.current = false
      setSending(false)
    }
  }

  const handleAttachment = event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) || file.size > 10 * 1024 * 1024) {
      setChatError('Choose a JPEG, PNG, WebP, PDF or Word file under 10 MB.')
      return
    }
    setChatError('')
    setAttachment(file)
  }

  const handleMarkSold = async () => {
    if (!selectedChat || !isSeller) return
    if (isDevSessionActive()) {
      const soldAt = new Date().toISOString()
      setChats(current => current.map(chat => chat.id === selectedChat.id ? { ...chat, sold_at: soldAt, product: { ...chat.product, status: 'sold' } } : chat))
      return
    }
    const { data, error } = await supabase.rpc('mark_listing_sold', { p_chat_id: selectedChat.id })
    if (error) { setChatError('Could not mark this sale as completed.'); return }
    setChats(current => current.map(chat => chat.id === selectedChat.id ? { ...chat, ...data, product: { ...chat.product, status: 'sold' } } : chat))
  }

  const handleReview = async () => {
    if (!selectedChat?.sold_at || !currentUser || reviewBusy) return
    setReviewBusy(true)
    const payload = { chat_id: selectedChat.id, product_id: selectedChat.product.id, reviewer_id: currentUser.id, reviewed_user_id: selectedChat.otherUserId, rating: reviewRating, comment: reviewComment.trim() || null }
    const { data, error } = await supabase.from('reviews').insert(payload).select().single()
    if (error) setChatError('Could not publish your review.')
    else { setChatReviews(current => [...current, data]); setReviewComment('') }
    setReviewBusy(false)
  }

  const handleMakeOffer = async () => {
    if (!selectedChat?.product || !currentUser) return
    const amount = Number(String(offerAmount).replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) return

    if (!isDevSessionActive()) {
      const { data, error } = await supabase.from('offers').insert({ chat_id: selectedChat.id, buyer_id: currentUser.id, amount }).select().single()
      if (error) { setChatError('Could not send the offer. A pending offer may already exist.'); return }
      setOffers(current => ({ ...current, [selectedChat.id]: data }))
      setOfferAmount('')
      return
    }
    setOffers(current => ({
      ...current,
      [selectedChat.id]: {
        amount,
        status: 'pending',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    }))
    setOfferAmount('')
  }

  const handleOfferDecision = async status => {
    if (!selectedChat) return
    if (!isDevSessionActive()) {
      const { data, error } = await supabase.from('offers').update({ status }).eq('id', selectedOffer.id).eq('status', 'pending').select().single()
      if (error) { setChatError('Could not update the offer. Please reload.'); return }
      setOffers(current => ({ ...current, [selectedChat.id]: data }))
      return
    }
    setOffers(current => ({
      ...current,
      [selectedChat.id]: {
        ...current[selectedChat.id],
        status,
        decidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    }))
  }

  if (chatsLoading) {
    return <LoadingScreen fullPage label="Loading messages" />
  }

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section">
        {chatError && <p role="alert" className="form-error">{chatError}</p>}
        <section className={`chat-layout ${mobileChatOpen ? 'is-chat-open' : ''}`}>
          <aside className="panel chat-list">
            <div className="panel-pad" style={{ borderBottom: '1px solid var(--line)' }}>
              <h1 className="section-title" style={{ fontSize: '1.35rem' }}>Inbox</h1>
              <p className="section-subtitle">Ask about WOF, mileage, self-contained status and viewing times.</p>
            </div>

            <div className="chat-list-scroll">
              {chats.map(chat => (
                <button
                  className={`chat-item ${selectedChat?.id === chat.id ? 'is-active' : ''}`}
                  key={chat.id}
                  type="button"
                  onClick={() => {
                    setSelectedChatId(chat.id)
                    setMobileChatOpen(true)
                  }}
                >
                  {chat.product
                    ? <img src={chat.product.image} alt="" />
                    : <span className="avatar chat-avatar">{chat.other_user?.[0]?.toUpperCase() || 'U'}</span>}
                  <span className="chat-item-copy">
                    <strong style={{ display: 'block' }}>{chat.other_user}</strong>
                    <span className="section-subtitle chat-item-title">{chat.product.title}</span>
                    <span className="chat-item-message" style={{ fontWeight: chat.unread ? 850 : 500 }}>{chat.last_message}</span>
                  </span>
                  <span style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                    <small style={{ color: 'var(--muted)' }}>{chat.last_message_at}</small>
                    {chat.unread > 0 && <span className="badge badge-accent">{chat.unread}</span>}
                  </span>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel chat-main">
            {!selectedChat && (
              <div className="empty-state">
                <div>
                  <FiMessageSquare size={42} />
                  <h2>No conversations yet</h2>
                  <p>When you message a seller about a listing, it will show up here.</p>
                </div>
              </div>
            )}

            {selectedChat && (
              <div className="panel-pad chat-product" style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line)' }}>
                <button className="icon-btn mobile-chat-back" type="button" onClick={() => setMobileChatOpen(false)} aria-label="Back to chats">
                  <FiArrowLeft />
                </button>
                <Link
                  className="chat-product-image-link"
                  to={`/product/${selectedChat.product.id}`}
                  aria-label={`View ${selectedChat.product.title}`}
                >
                  <img src={selectedChat.product.image} alt={selectedChat.product.title} />
                </Link>
                <div className="chat-product-copy">
                  <Link className="chat-profile-link" to={`/profile/${selectedChat.otherUserId}`}>
                    {selectedChat.other_user}
                  </Link>
                  {selectedChat.product ? (
                    <>
                      <p className="section-subtitle" style={{ marginTop: 2 }}>Re: {selectedChat.product.title}</p>
                      <p className="chat-price-line">
                        {selectedOffer?.status === 'accepted' ? 'Agreed price' : 'Listing price'}: <strong>{formatPrice(agreedPrice)}</strong>
                      </p>
                    </>
                  ) : (
                    <p className="section-subtitle" style={{ marginTop: 2 }}>Private conversation</p>
                  )}
                </div>
                <div className="chat-product-actions">
                  {selectedChat.product && <Link to={`/product/${selectedChat.product.id}`} className="btn btn-secondary chat-view-listing">View listing<FiArrowRight /></Link>}
                  {isSeller && !selectedChat.sold_at && <button className="btn btn-ghost chat-mark-sold" type="button" onClick={handleMarkSold}><FiCheck />Mark as sold</button>}
                  {selectedChat.sold_at && <span className="sale-complete-label"><FiCheck />Sale completed</span>}
                  {selectedChat.product && !isSeller && (
                    <div className="offer-inline" aria-label="Make an offer">
                      <input
                        className="field"
                        inputMode="numeric"
                        placeholder="Offer amount"
                        value={offerAmount}
                        disabled={selectedOffer?.status === 'pending'}
                        onChange={event => setOfferAmount(event.target.value)}
                        onKeyDown={event => event.key === 'Enter' && handleMakeOffer()}
                      />
                      <button className="btn btn-ghost offer-submit" type="button" disabled={selectedOffer?.status === 'pending'} onClick={handleMakeOffer}>
                        <FiTag />
                        {selectedOffer?.status === 'pending' ? 'Pending' : 'Make an offer'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedChat && (
            <div className="messages" ref={messagesRef}>
              {messages.length === 0 && (
                <p className="chat-empty">Say hi to {selectedChat.other_user}. Your messages are private to this conversation.</p>
              )}
              {messages.map((message, index) => {
                const isMine = message.sender_id === 'me' || message.sender_id === currentUser?.id
                const showDay = index === 0 || messageDayKey(message.created_at) !== messageDayKey(messages[index - 1]?.created_at)
                return (
                  <div className="message-entry" key={message.id}>
                    {showDay && <div className="message-day"><span>{formatMessageDay(message.created_at)}</span></div>}
                    <div className={`message ${isMine ? 'is-me' : ''}`}>
                      <div className="bubble">
                        <span className="message-content">{message.content}</span>
                        {(message.attachment_path || message.attachment_url) && (
                          message.attachment_type?.startsWith('image/')
                            ? <a className="message-image" href={message.attachment_url || attachmentUrls[message.attachment_path]} target="_blank" rel="noreferrer"><img src={message.attachment_url || attachmentUrls[message.attachment_path]} alt={message.attachment_name || 'Shared image'} /></a>
                            : <a className="message-file" href={message.attachment_url || attachmentUrls[message.attachment_path]} target="_blank" rel="noreferrer"><FiFile />{message.attachment_name || 'Document'}</a>
                        )}
                        <span className="message-meta">
                          <time dateTime={message.created_at}>{formatMessageTime(message.created_at)}</time>
                          {isMine && (
                            <span className={`message-receipt ${message.read_at ? 'is-read' : ''}`} aria-label={message.read_at ? 'Read' : 'Delivered'}>
                              {message.read_at ? '✓✓' : '✓'}
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}

              {selectedOffer && selectedChat.product && (
                <div className="message is-me">
                  <div className={`offer-card offer-${selectedOffer.status}`}>
                    <div className="offer-card-head">
                      <FiTag />
                      <div>
                        <strong>{formatPrice(selectedOffer.amount)}</strong>
                        <span>{selectedOffer.status === 'pending' ? 'Offer sent' : `Offer ${selectedOffer.status}`}</span>
                      </div>
                    </div>
                    {selectedOffer.status === 'pending' && isSeller && (
                      <div className="seller-offer-actions" aria-label="Seller offer controls">
                        <span>Seller response</span>
                        <button className="btn btn-primary" type="button" onClick={() => handleOfferDecision('accepted')}>
                          <FiCheck />
                          Accept
                        </button>
                        <button className="btn btn-secondary" type="button" onClick={() => handleOfferDecision('declined')}>
                          <FiX />
                          Decline
                        </button>
                      </div>
                    )}
                    {selectedOffer.status === 'pending' && !isSeller && <p>Pending seller response.</p>}
                    {selectedOffer.status === 'accepted' && <p>This agreed price is visible only in this conversation.</p>}
                    {selectedOffer.status === 'declined' && <p>The listing price remains {formatPrice(selectedChat.product?.price)} for this buyer.</p>}
                  </div>
                </div>
              )}
              {selectedChat.sold_at && currentUser && (
                <div className="sale-review-card">
                  {chatReviews.some(review => review.reviewer_id === currentUser.id) ? (
                    <p><FiCheck /> Your review has been published.</p>
                  ) : (
                    <>
                      <strong>{isSeller ? `Rate ${selectedChat.other_user} as a buyer` : 'Rate the seller and your purchase'}</strong>
                      <div className="review-stars" aria-label="Rating">
                        {[1,2,3,4,5].map(value => <button type="button" key={value} className={value <= reviewRating ? 'is-active' : ''} onClick={() => setReviewRating(value)} aria-label={`${value} stars`}><FiStar fill={value <= reviewRating ? 'currentColor' : 'none'} /></button>)}
                      </div>
                      <textarea className="field" rows={2} maxLength={1000} placeholder="Share your experience (optional)" value={reviewComment} onChange={event => setReviewComment(event.target.value)} />
                      <button className="btn btn-primary" type="button" disabled={reviewBusy} onClick={handleReview}>{reviewBusy ? 'Publishing...' : 'Publish review'}</button>
                    </>
                  )}
                </div>
              )}
            </div>
            )}

            {selectedChat && (
            <div className="chat-compose">
              <input ref={attachmentInputRef} type="file" accept="image/jpeg,image/png,image/webp,.pdf,.doc,.docx" hidden onChange={handleAttachment} />
              <button className="icon-btn chat-attach" type="button" disabled={sending} onClick={() => attachmentInputRef.current?.click()} aria-label="Attach photo or document"><FiPaperclip /></button>
              {attachment && <div className="attachment-preview">{attachment.type.startsWith('image/') ? <FiImage /> : <FiFile />}<span>{attachment.name}</span><button type="button" onClick={() => setAttachment(null)} aria-label="Remove attachment"><FiX /></button></div>}
              <input
                className="field"
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                maxLength={5000}
                disabled={sending}
                onChange={event => setNewMessage(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleSend()}
              />
              <button className="btn btn-primary" type="button" onClick={handleSend} disabled={sending || (!newMessage.trim() && !attachment)} aria-label="Send message">
                <FiSend />
              </button>
            </div>
            )}
          </section>
        </section>
      </main>
      <Footer />
    </div>
  )
}
