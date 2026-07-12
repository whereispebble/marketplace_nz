import { Link } from 'react-router-dom'
import { FiHeart, FiHome, FiMessageCircle, FiPlus, FiSearch, FiSliders, FiUser } from 'react-icons/fi'
import logo from '../assets/swapy-logo.svg'

export default function Navbar({ search = '', onSearchChange, onSearchSubmit, onFilterClick, compact = false, title }) {
  const handleSearchKeyDown = event => {
    if (event.key === 'Enter') onSearchSubmit?.()
  }

  return (
    <nav className={`topbar ${compact && !title ? 'topbar-compact' : ''}`}>
      <Link to="/" className="brand" aria-label="Swapy home">
        <img src={logo} alt="Swapy" />
      </Link>

      {title ? (
        <h2 className="section-title" style={{ fontSize: '1.05rem', justifySelf: 'center' }}>{title}</h2>
      ) : compact ? (
        null
      ) : (
        <div className="search-pill">
          <FiSearch />
          <input
            type="search"
            placeholder="Search model, region, WOF or self-contained"
            value={search}
            onChange={event => onSearchChange?.(event.target.value)}
            onKeyDown={handleSearchKeyDown}
          />
        </div>
      )}

      {!title && !compact && (
        <button className="mobile-filter-toggle" type="button" onClick={onFilterClick} aria-label="Open filters">
          <FiSliders />
        </button>
      )}

      <div className="nav-actions" aria-label="Main navigation">
        <NavIcon to="/" label="Home" icon={<FiHome />} className="mobile-nav-only" />
        <NavIcon to="/favorites" label="Favorites" icon={<FiHeart />} />
        <Link to="/new-product" className="btn btn-primary">
          <FiPlus />
          <span className="sell-label-desktop">List vehicle</span>
          <span className="nav-label sell-label-mobile">Sell</span>
        </Link>
        <NavIcon to="/chats" label="Messages" icon={<FiMessageCircle />} />
        <NavIcon to="/profile" label="Profile" icon={<FiUser />} />
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
