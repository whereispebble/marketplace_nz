import { Link } from 'react-router-dom'
import { FiSearch, FiHeart, FiMessageCircle, FiPlusCircle, FiUser } from 'react-icons/fi'

export default function Navbar() {
  return (
    <nav style={{
      background: '#0d0d0d',
      borderBottom: '3px solid #D4F060',
      padding: '0 2rem',
      height: '64px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{
          background: '#D4F060',
          color: '#0d0d0d',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: '1.2rem',
          padding: '4px 12px',
          borderRadius: '6px',
        }}>MKT</span>
        <span style={{
          color: 'white',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '1.1rem',
        }}>place</span>
      </Link>

      <div style={{ flex: 1, maxWidth: '500px', margin: '0 2rem', position: 'relative' }}>
        <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
        <input
          type="text"
          placeholder="Busca lo que necesitas..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 40px',
            borderRadius: '50px',
            border: '2px solid #2a2a2a',
            background: '#1a1a1a',
            color: 'white',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box',
          }}
          onFocus={e => e.target.style.borderColor = '#D4F060'}
          onBlur={e => e.target.style.borderColor = '#2a2a2a'}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NavIcon to="/favorites" icon={<FiHeart />} label="Favoritos" />
        <NavIcon to="/chats" icon={<FiMessageCircle />} label="Chats" />
        <NavIcon to="/profile" icon={<FiUser />} label="Perfil" />
        <Link to="/new-product" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#D4F060',
          color: '#0d0d0d',
          padding: '8px 16px',
          borderRadius: '50px',
          textDecoration: 'none',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '0.85rem',
          marginLeft: '8px',
        }}>
          <FiPlusCircle /> Vender
        </Link>
      </div>
    </nav>
  )
}

function NavIcon({ to, icon, label }) {
  return (
    <Link to={to} title={label} style={{
      color: '#aaa',
      fontSize: '1.3rem',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = '#D4F060'; e.currentTarget.style.background = '#1a1a1a' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
    </Link>
  )
}