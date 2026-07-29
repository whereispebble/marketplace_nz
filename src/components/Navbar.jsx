import { Link, NavLink, useNavigate } from 'react-router-dom'
import { FiHeart, FiHome, FiMail, FiMessageCircle, FiPlus, FiSliders, FiUser } from 'react-icons/fi'
import logo from '../assets/swapy-logo.svg'

const NAV_LINKS = [
  { to: '/', label: 'Buy', end: true },
  { to: '/new-product', label: 'Sell' },
  { to: '/how-it-works', label: 'How it works' },
]

export default function Navbar({ onFilterClick, compact = false, title }) {
  const navigate = useNavigate()

  const handleFilterClick = () => {
    if (onFilterClick) {
      onFilterClick()
      return
    }
    navigate('/')
  }

  return (
    <nav className={`topbar ${compact && !title ? 'topbar-compact' : ''}`}>
      <Link to="/" className="brand" aria-label="Swapy home">
        <img src={logo} alt="Swapy" />
      </Link>

      {title ? (
        <h2 className="section-title" style={{ fontSize: '1.05rem', justifySelf: 'center' }}>{title}</h2>
      ) : (
        <div className="nav-links" aria-label="Sections">
          {NAV_LINKS.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </div>
      )}

      {!title && (
        <button className="mobile-filter-toggle" type="button" onClick={handleFilterClick} aria-label="Open filters">
          <FiSliders />
        </button>
      )}

      <div className="nav-actions" aria-label="Main navigation">
        <NavIcon to="/" label="Home" icon={<FiHome />} className="mobile-nav-only" />
        <NavIcon to="/favorites" label="Favorites" icon={<FiHeart />} />
        <NavIcon to="/chats" label="Messages" icon={<FiMail />} />
        <Link to="/new-product" className="nav-icon mobile-nav-only" title="Sell" aria-label="Sell">
          <FiPlus />
          <span className="nav-label">Sell</span>
        </Link>
        <Link to="/profile" className="btn btn-primary nav-profile-btn">
          <FiUser />
          <span className="sell-label-desktop">Profile</span>
          <span className="nav-label sell-label-mobile">Profile</span>
        </Link>
      </div>
    </nav>
  )
}

function NavIcon({ to, label, icon, className = '' }) {
  return (
    <Link to={to} className={`nav-icon ${className}`.trim()} title={label} aria-label={label}>
      {icon}
      <span className="nav-label">{label}</span>
    </Link>
  )
}
