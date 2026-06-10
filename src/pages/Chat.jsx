import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../services/supabase'

const MOCK_CHATS = [
  { id: 1, product: { title: 'iPhone 13 Pro', image: 'https://via.placeholder.com/50x50?text=iPhone' }, other_user: 'Maria G.', last_message: 'Is it still available?', last_message_at: '10:30', unread: 2 },
  { id: 2, product: { title: 'Nike Air Max', image: 'https://via.placeholder.com/50x50?text=Nike' }, other_user: 'Carlos R.', last_message: 'Can you do 70€?', last_message_at: 'Yesterday', unread: 0 },
  { id: 3, product: { title: 'MacBook Air', image: 'https://via.placeholder.com/50x50?text=Mac' }, other_user: 'Sofia L.', last_message: 'Thanks!', last_message_at: 'Mon', unread: 0 },
]

const MOCK_MESSAGES = [
  { id: 1, sender_id: 'other', content: 'Hi! Is the iPhone still available?', created_at: '10:28' },
  { id: 2, sender_id: 'me', content: 'Yes it is! Just like I described in the listing.', created_at: '10:29' },
  { id: 3, sender_id: 'other', content: 'Great! Would you accept 600€?', created_at: '10:30' },
  { id: 4, sender_id: 'me', content: 'The lowest I can go is 630€, it\'s in perfect condition.', created_at: '10:31' },
  { id: 5, sender_id: 'other', content: 'Deal! When can we meet?', created_at: '10:32' },
]

export default function Chat() {
  const { chatId } = useParams()
  const [chats, setChats] = useState(MOCK_CHATS)
  const [messages, setMessages] = useState(MOCK_MESSAGES)
  const [selectedChat, setSelectedChat] = useState(MOCK_CHATS[0])
  const [newMessage, setNewMessage] = useState('')
  const [currentUser, setCurrentUser] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    getCurrentUser()
    scrollToBottom()
  }, [messages])

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!newMessage.trim()) return
    const msg = { id: Date.now(), sender_id: 'me', content: newMessage, created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    setMessages([...messages, msg])
    setNewMessage('')

    if (currentUser && selectedChat) {
      await supabase.from('messages').insert({
        chat_id: selectedChat.id,
        sender_id: currentUser.id,
        content: newMessage,
      })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6F8', fontFamily: "'DM Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ background: 'white', borderBottom: '2px solid #F5C6D8', padding: '0 2rem', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100, boxShadow: '0 2px 12px rgba(245,198,216,0.2)', flexShrink: 0 }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem', padding: '4px 12px', borderRadius: '8px' }}>MKT</span>
          <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.1rem' }}>place</span>
        </Link>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', margin: 0, fontSize: '1.1rem' }}>Messages 💬</h2>
        <Link to="/profile" style={{ color: '#c084a0', fontSize: '1.3rem', textDecoration: 'none' }}>👤</Link>
      </nav>

      {/* Chat layout */}
      <div style={{ flex: 1, display: 'flex', maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '1.5rem 2rem', gap: '1.5rem', height: 'calc(100vh - 64px)' }}>

        {/* Sidebar — chat list */}
        <div style={{ width: '320px', flexShrink: 0, background: 'white', borderRadius: '20px', border: '2px solid #F5C6D8', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1.5px solid #F5C6D8' }}>
            <h3 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', margin: 0, fontSize: '1rem' }}>Conversations</h3>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {chats.map(chat => (
              <div
                key={chat.id}
                onClick={() => setSelectedChat(chat)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '1rem 1.5rem',
                  cursor: 'pointer',
                  background: selectedChat?.id === chat.id ? '#FDF6F8' : 'white',
                  borderLeft: selectedChat?.id === chat.id ? '3px solid #F5C6D8' : '3px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (selectedChat?.id !== chat.id) e.currentTarget.style.background = '#FDF6F8' }}
                onMouseLeave={e => { if (selectedChat?.id !== chat.id) e.currentTarget.style.background = 'white' }}
              >
                <img src={chat.product.image} alt="" style={{ width: '46px', height: '46px', borderRadius: '12px', objectFit: 'cover', border: '2px solid #F5C6D8', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: '#3a2030', fontSize: '0.88rem' }}>{chat.other_user}</span>
                    <span style={{ color: '#c084a0', fontSize: '0.72rem' }}>{chat.last_message_at}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{chat.product.title}</div>
                  <div style={{ fontSize: '0.8rem', color: chat.unread > 0 ? '#5a2d3f' : '#aaa', fontWeight: chat.unread > 0 ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {chat.last_message}
                  </div>
                </div>
                {chat.unread > 0 && (
                  <div style={{ background: '#F5C6D8', color: '#5a2d3f', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>
                    {chat.unread}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main chat */}
        <div style={{ flex: 1, background: 'white', borderRadius: '20px', border: '2px solid #F5C6D8', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Chat header */}
          {selectedChat && (
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1.5px solid #F5C6D8', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img src={selectedChat.product.image} alt="" style={{ width: '42px', height: '42px', borderRadius: '10px', border: '2px solid #F5C6D8' }} />
              <div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', fontSize: '0.95rem' }}>{selectedChat.other_user}</div>
                <div style={{ color: '#b08090', fontSize: '0.78rem' }}>Re: {selectedChat.product.title}</div>
              </div>
              <Link to={`/product/1`} style={{ marginLeft: 'auto', color: '#A8D4E8', fontSize: '0.82rem', fontWeight: 600, textDecoration: 'none' }}>
                View listing →
              </Link>
            </div>
          )}

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', justifyContent: msg.sender_id === 'me' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '65%',
                  padding: '10px 16px',
                  borderRadius: msg.sender_id === 'me' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: msg.sender_id === 'me' ? 'linear-gradient(135deg, #F5C6D8, #e8a8c4)' : '#F8F0F4',
                  color: msg.sender_id === 'me' ? '#5a2d3f' : '#333',
                  fontSize: '0.9rem',
                  lineHeight: 1.5,
                  boxShadow: msg.sender_id === 'me' ? '0 2px 10px rgba(245,198,216,0.3)' : 'none',
                }}>
                  {msg.content}
                  <div style={{ fontSize: '0.68rem', color: msg.sender_id === 'me' ? '#c084a0' : '#bbb', marginTop: '4px', textAlign: 'right' }}>
                    {msg.created_at}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1.5px solid #F5C6D8', display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              style={{
                flex: 1, padding: '12px 18px', borderRadius: '50px',
                border: '2px solid #F5C6D8', background: '#FDF6F8',
                fontSize: '0.9rem', outline: 'none',
                fontFamily: "'DM Sans', sans-serif", color: '#333',
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = '#A8D4E8'}
              onBlur={e => e.target.style.borderColor = '#F5C6D8'}
            />
            <button
              onClick={handleSend}
              style={{
                width: '46px', height: '46px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #F5C6D8, #e8a8c4)',
                border: 'none', cursor: 'pointer', fontSize: '1.1rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245,198,216,0.4)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}