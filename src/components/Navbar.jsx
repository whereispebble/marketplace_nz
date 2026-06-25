import { Link } from 'react-router-dom'
import { FiHeart, FiMessageCircle, FiPlus, FiSearch, FiUser } from 'react-icons/fi'
import logo from '../assets/logo.png'

export default function Navbar({ search = '', onSearchChange, compact = false, title }) {
  return (
    <nav className="topbar">
      <Link to="/" className="brand" aria-label="Kiwimart home">
        <img src={logo} alt="Kiwimart" />
        <span className="brand-text">
          <strong>Kiwimart</strong>
          <span>Local marketplace</span>
        </span>
      </Link>

      {title ? (
        <h2 className="section-title" style={{ fontSize: '1.05rem', justifySelf: 'center' }}>{title}</h2>
      ) : compact ? (
        <div />
      ) : (
        <div className="search-pill">
          <FiSearch />
          <input
            type="search"
            placeholder="Search products, brands or categories"
            value={search}
            onChange={event => onSearchChange?.(event.target.value)}
          />
        </div>
      )}

      <div className="nav-actions">
        <NavIcon to="/favorites" label="Favorites" icon={<FiHeart />} />
        <NavIcon to="/chats" label="Messages" icon={<FiMessageCircle />} />
        <NavIcon to="/profile" label="Profile" icon={<FiUser />} />
        <Link to="/new-product" className="btn btn-primary">
          <FiPlus />
          <span className="sell-label">Sell</span>
        </Link>
      </div>
    </nav>
  )
}

function NavIcon({ to, label, icon }) {
  return (
    <Link to={to} className="nav-icon" title={label} aria-label={label}>
      {icon}
    </Link>
  )
}
