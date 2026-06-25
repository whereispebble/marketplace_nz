import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiSend } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import Navbar from '../components/Navbar'

const MOCK_CHATS = [
  { id: 1, product: { title: 'iPhone 13 Pro', image: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?auto=format&fit=crop&w=200&q=80' }, other_user: 'Maria G.', last_message: 'Is it still available?', last_message_at: '10:30', unread: 2 },
  { id: 2, product: { title: 'Nike Air Max', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=200&q=80' }, other_user: 'Carlos R.', last_message: 'Can you do 70 EUR?', last_message_at: 'Yesterday', unread: 0 },
  { id: 3, product: { title: 'MacBook Air', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=200&q=80' }, other_user: 'Sofia L.', last_message: 'Thanks!', last_message_at: 'Mon', unread: 0 },
]

const MOCK_MESSAGES = [
  { id: 1, sender_id: 'other', content: 'Hi! Is the iPhone still available?', created_at: '10:28' },
  { id: 2, sender_id: 'me', content: 'Yes it is. It matches the listing and includes the original box.', created_at: '10:29' },
  { id: 3, sender_id: 'other', content: 'Great. Would you accept 600 EUR?', created_at: '10:30' },
  { id: 4, sender_id: 'me', content: 'The lowest I can go is 630 EUR. It is in excellent condition.', created_at: '10:31' },
  { id: 5, sender_id: 'other', content: 'Deal. When can we meet?', created_at: '10:32' },
]

export default function Chat() {
  const [chats] = useState(MOCK_CHATS)
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    let ignore = false

    async function loadCurrentUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!ignore) setCurrentUser(user)
    }

    loadCurrentUser()
    return () => { ignore = true }
  }, [])
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const msg = {
      id: Date.now(),
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

  return (
    <div className="app-shell">
      <Navbar compact title="Messages" />

      <main className="container page-section">
        <section className="chat-layout">
          <aside className="panel chat-list">
            <div className="panel-pad" style={{ borderBottom: '1px solid var(--line)' }}>
              <h1 className="section-title" style={{ fontSize: '1.35rem' }}>Inbox</h1>
              <p className="section-subtitle">Keep deals moving with clear conversations.</p>
            </div>

            <div style={{ overflowY: 'auto' }}>
              {chats.map(chat => (
                <button
                  className={`chat-item ${selectedChat?.id === chat.id ? 'is-active' : ''}`}
                  key={chat.id}
                  type="button"
                  onClick={() => setSelectedChat(chat)}
                >
                  <img src={chat.product.image} alt="" />
                  <span style={{ minWidth: 0 }}>
                    <strong style={{ display: 'block' }}>{chat.other_user}</strong>
                    <span className="section-subtitle" style={{ display: 'block', margin: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.product.title}</span>
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
                <img src={selectedChat.product.image} alt="" />
                <div>
                  <strong>{selectedChat.other_user}</strong>
                  <p className="section-subtitle" style={{ marginTop: 2 }}>Re: {selectedChat.product.title}</p>
                </div>
                <Link to="/product/1" className="btn btn-secondary" style={{ marginLeft: 'auto' }}>View listing<FiArrowRight /></Link>
              </div>
            )}

            <div className="messages">
              {messages.map(message => (
                <div className={`message ${message.sender_id === 'me' ? 'is-me' : ''}`} key={message.id}>
                  <div className="bubble">
                    {message.content}
                    <div style={{ marginTop: 6, opacity: 0.68, fontSize: '0.75rem', textAlign: 'right' }}>{message.created_at}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
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
