import { Link } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiPlusCircle, FiUser, FiSearch } from 'react-icons/fi'
import logo from '../assets/logo.png'

export default function Navbar() {
  return (
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

      {/* Logo */}
              <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
          <img
            src={logo}
            alt="Kiwimart"
            style={{
              height: 'clamp(36px, 10vw, 65px)',
              width: 'auto',
              objectFit: 'contain',
              filter: 'drop-shadow(0px 4px 8px rgba(245, 198, 216, 0.8))',
            }}
          />
        </Link>
      {/* Search */}
      <div style={{ flex: 1, maxWidth: '500px', margin: '0 2rem', position: 'relative' }}>
        <FiSearch style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#c084a0' }} />
        <input
          type="text"
          placeholder="Search for anything..."
          style={{
            width: '100%',
            padding: '10px 14px 10px 40px',
            borderRadius: '50px',
            border: '2px solid #F5C6D8',
            background: '#FDF6F8',
            color: '#333',
            fontSize: '0.9rem',
            outline: 'none',
            fontFamily: "'DM Sans', sans-serif",
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = '#A8D4E8'}
          onBlur={e => e.target.style.borderColor = '#F5C6D8'}
        />
      </div>

      {/* Icons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <NavIcon to="/favorites" icon={<FiHeart />} label="Favorites" />
        <NavIcon to="/chats" icon={<FiMessageCircle />} label="Chats" />
        <NavIcon to="/profile" icon={<FiUser />} label="Profile" />
        <Link to="/new-product" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: '#F5C6D8',
          color: '#5a2d3f',
          padding: '8px 18px',
          borderRadius: '50px',
          textDecoration: 'none',
          fontFamily: "'Syne', sans-serif",
          fontWeight: 700,
          fontSize: '0.85rem',
          marginLeft: '8px',
          transition: 'transform 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <FiPlusCircle /> Sell
        </Link>
      </div>
    </nav>
  )
}

function NavIcon({ to, icon, label }) {
  return (
    <Link to={to} title={label} style={{
      color: '#c084a0',
      fontSize: '1.3rem',
      padding: '8px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      textDecoration: 'none',
      transition: 'color 0.2s, background 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.color = '#5a2d3f'; e.currentTarget.style.background = '#FDF6F8' }}
      onMouseLeave={e => { e.currentTarget.style.color = '#c084a0'; e.currentTarget.style.background = 'transparent' }}
    >
      {icon}
    </Link>
  )
}