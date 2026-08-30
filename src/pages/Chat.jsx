import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCheck, FiSend, FiTag, FiX } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'
import { MOCK_VEHICLES } from '../data/mockVehicles'

const MOCK_CHATS = MOCK_VEHICLES.map((vehicle, index) => ({
  id: index + 1,
  sellerId: vehicle.seller?.id,
  product: vehicle,
  other_user: vehicle.seller?.name || 'Seller',
  last_message: index === 0
    ? 'Is it still available to view this weekend?'
    : 'Hi, I am interested in this listing.',
  last_message_at: index === 0 ? '10:30' : 'New',
  unread: index === 0 ? 2 : 0,
}))

const MOCK_MESSAGES = [
  { id: 1, sender_id: 'other', content: 'Hi, is the Hiace still available?', created_at: '10:28' },
  { id: 2, sender_id: 'me', content: 'Yes, it is. WOF is current and it is certified self-contained.', created_at: '10:29' },
  { id: 3, sender_id: 'other', content: 'Great. Can I view it in Auckland this weekend?', created_at: '10:30' },
  { id: 4, sender_id: 'me', content: 'Sure. Saturday morning works, and I can show you the WOF, service history and layout.', created_at: '10:31' },
  { id: 5, sender_id: 'other', content: 'Perfect, I am interested.', created_at: '10:32' },
]

function formatPrice(value) {
  return `NZ$${Number(value || 0).toLocaleString('en-NZ')}`
}

export default function Chat() {
  const { chatId, sellerId } = useParams()

  // Conversacion directa desde el perfil de alguien: no va sobre un anuncio
  // concreto, asi que la cabecera solo lleva a la persona.
  const directChat = useMemo(() => {
    if (!sellerId) return null
    const seller = MOCK_VEHICLES.find(vehicle => String(vehicle.seller?.id) === String(sellerId))?.seller
    return {
      id: `user-${sellerId}`,
      sellerId,
      product: null,
      direct: true,
      other_user: seller?.name || 'Seller',
      last_message: 'New conversation',
      last_message_at: 'Now',
      unread: 0,
    }
  }, [sellerId])

  const initialChat = directChat || MOCK_CHATS.find(chat => (
    String(chat.id) === String(chatId)
    || String(chat.sellerId) === String(chatId)
    || String(chat.product.id) === String(chatId)
  )) || MOCK_CHATS[0]
  const [chats] = useState(() => (directChat ? [directChat, ...MOCK_CHATS] : MOCK_CHATS))
  const [messages, setMessages] = useState(directChat ? [] : MOCK_MESSAGES)
  const [selectedChatId, setSelectedChatId] = useState(initialChat.id)
  const [mobileChatOpen, setMobileChatOpen] = useState(Boolean(chatId || sellerId))
  const [newMessage, setNewMessage] = useState('')
  const [offerAmount, setOfferAmount] = useState('')
  const [offers, setOffers] = useState({})
  const [currentUser, setCurrentUser] = useState(null)
  const messagesRef = useRef(null)
  const selectedChat = chats.find(chat => chat.id === selectedChatId) || initialChat
  const selectedOffer = offers[selectedChat.id]
  const agreedPrice = selectedOffer?.status === 'accepted' ? selectedOffer.amount : selectedChat.product?.price
  const sellerUserId = selectedChat.product?.user_id || selectedChat.product?.seller_id || selectedChat.sellerId
  const isSeller = Boolean(currentUser?.id && sellerUserId && String(currentUser.id) === String(sellerUserId))

  useEffect(() => {
    let ignore = false

    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!ignore) setCurrentUser(user)
    }

    loadCurrentUser()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    if (!messagesRef.current) return
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight
  }, [messages, selectedChat])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const msg = {
      id: messages.length + 1,
      sender_id: 'me',
      content: newMessage,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages([...messages, msg])
    setNewMessage('')

    if (currentUser && selectedChat) {
      await supabase.from('messages').insert({ chat_id: selectedChat.id, sender_id: currentUser.id, content: newMessage })
    }
  }

  const handleMakeOffer = () => {
    const amount = Number(String(offerAmount).replace(/[^0-9.]/g, ''))
    if (!Number.isFinite(amount) || amount <= 0) return

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

  const handleOfferDecision = status => {
    setOffers(current => ({
      ...current,
      [selectedChat.id]: {
        ...current[selectedChat.id],
        status,
        decidedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    }))
  }

  return (
    <div className="app-shell">
      <Navbar compact />

      <main className="container page-section">
        <section className={`chat-layout ${mobileChatOpen ? 'is-chat-open' : ''}`}>
          <aside className="panel chat-list">
            <div className="panel-pad" style={{ borderBottom: '1px solid var(--line)' }}>
              <h1 className="section-title" style={{ fontSize: '1.35rem' }}>Inbox</h1>
              <p className="section-subtitle">Ask about WOF, mileage, self-contained status and viewing times.</p>
            </div>

            <div style={{ overflowY: 'auto' }}>
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
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{chat.other_user}</strong>
                    <span className="section-subtitle" style={{ display: 'block', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.product ? chat.product.title : 'Direct message'}</span>
                    <span style={{ color: chat.unread ? 'var(--ink)' : 'var(--muted)', fontWeight: chat.unread ? 850 : 500 }}>{chat.last_message}</span>
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
            {selectedChat && (
              <div className="panel-pad chat-product" style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid var(--line)' }}>
                <button className="icon-btn mobile-chat-back" type="button" onClick={() => setMobileChatOpen(false)} aria-label="Back to chats">
                  <FiArrowLeft />
                </button>
                {selectedChat.product
                  ? <img src={selectedChat.product.image} alt="" />
                  : <span className="avatar chat-avatar">{selectedChat.other_user?.[0]?.toUpperCase() || 'U'}</span>}
                <div>
                  <strong>{selectedChat.other_user}</strong>
                  {selectedChat.product ? (
                    <>
                      <p className="section-subtitle" style={{ marginTop: 2 }}>Re: {selectedChat.product.title}</p>
                      <p className="chat-price-line">
                        {selectedOffer?.status === 'accepted' ? 'Agreed price' : 'Listing price'}: <strong>{formatPrice(agreedPrice)}</strong>
                      </p>
                    </>
                  ) : (
                    <p className="section-subtitle" style={{ marginTop: 2 }}>Direct message</p>
                  )}
                </div>
                <div className="chat-product-actions">
                  {selectedChat.product && <Link to={`/product/${selectedChat.product.id}`} className="btn btn-secondary">View listing<FiArrowRight /></Link>}
                  {selectedChat.product && !isSeller && (
                    <div className="offer-inline">
                      <input
                        className="field"
                        inputMode="numeric"
                        placeholder="Offer amount"
                        value={offerAmount}
                        disabled={selectedOffer?.status === 'pending'}
                        onChange={event => setOfferAmount(event.target.value)}
                        onKeyDown={event => event.key === 'Enter' && handleMakeOffer()}
                      />
                      <button className="btn btn-secondary" type="button" disabled={selectedOffer?.status === 'pending'} onClick={handleMakeOffer}>
                        <FiTag />
                        {selectedOffer?.status === 'pending' ? 'Pending' : 'Make an offer'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="messages" ref={messagesRef}>
              {messages.length === 0 && (
                <p className="chat-empty">Say hi to {selectedChat.other_user}. This conversation is not tied to any listing.</p>
              )}
              {messages.map(message => (
                <div className={`message ${message.sender_id === 'me' ? 'is-me' : ''}`} key={message.id}>
                  <div className="bubble">
                    {message.content}
                    <div style={{ marginTop: 6, opacity: 0.68, fontSize: '0.75rem', textAlign: 'right' }}>{message.created_at}</div>
                  </div>
                </div>
              ))}

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
            </div>

            <div className="chat-compose">
              <input
                className="field"
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={event => setNewMessage(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleSend()}
              />
              <button className="btn btn-primary" type="button" onClick={handleSend} aria-label="Send message">
                <FiSend />
              </button>
            </div>
          </section>
        </section>
      </main>
    </div>
  )
}
