import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { FiFileText, FiHeart, FiHome, FiMail, FiMenu, FiPlus, FiShield, FiUser, FiX } from 'react-icons/fi'
import logo from '../assets/swapy-logo.svg'

// mobileHidden: en movil solo se dejan Buy y Sell en la cabecera; el resto
// sigue estando en el panel lateral.
const NAV_LINKS = [
  { to: '/', label: 'Buy', end: true },
  { to: '/new-product', label: 'Sell' },
  { to: '/how-it-works', label: 'How it works', mobileHidden: true },
]

const MENU_SECTIONS = [
  {
    title: 'Marketplace',
    links: [
      { to: '/', label: 'Buy', icon: <FiHome />, end: true },
      { to: '/new-product', label: 'Sell', icon: <FiPlus /> },
      { to: '/how-it-works', label: 'How it works', icon: <FiFileText /> },
    ],
  },
  {
    title: 'Your account',
    links: [
      { to: '/profile', label: 'Profile', icon: <FiUser /> },
      { to: '/favorites', label: 'Favorites', icon: <FiHeart /> },
      { to: '/chats', label: 'Messages', icon: <FiMail /> },
    ],
  },
  {
    title: 'Legal',
    links: [
      { to: '/privacy', label: 'Privacy policy', icon: <FiShield /> },
      { to: '/terms', label: 'Terms of use', icon: <FiFileText /> },
    ],
  },
]

export default function Navbar({ compact = false, title }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()

  // Cerrar al navegar, para que el panel no quede abierto sobre la pagina nueva.
  useEffect(() => setMenuOpen(false), [pathname])

  // Con el panel abierto la pagina de detras no debe poder desplazarse.
  useEffect(() => {
    if (!menuOpen) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = event => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [menuOpen])

  return (
    <>
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
                className={({ isActive }) => `nav-link ${link.mobileHidden ? 'nav-link-desktop' : ''} ${isActive ? 'is-active' : ''}`.replace(/\s+/g, ' ').trim()}
              >
                {link.label}
              </NavLink>
            ))}
          </div>
        )}

        <button
          className="menu-toggle"
          type="button"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <FiMenu />
        </button>

        <div className="nav-actions" aria-label="Main navigation">
          <NavIcon to="/favorites" label="Favorites" icon={<FiHeart />} />
          <NavIcon to="/chats" label="Messages" icon={<FiMail />} />
          <Link to="/profile" className="btn btn-primary nav-profile-btn">
            <FiUser />
            <span className="sell-label-desktop">Profile</span>
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <aside
            className="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            onClick={event => event.stopPropagation()}
          >
            <header className="mobile-menu-head">
              <img src={logo} alt="Swapy" />
              <button className="icon-btn" type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <FiX />
              </button>
            </header>

            <div className="mobile-menu-body">
              {MENU_SECTIONS.map(section => (
                <nav className="mobile-menu-section" key={section.title} aria-label={section.title}>
                  <h3>{section.title}</h3>
                  {section.links.map(link => (
                    <NavLink
                      key={`${section.title}-${link.to}`}
                      to={link.to}
                      end={link.end}
                      className={({ isActive }) => `mobile-menu-link ${isActive ? 'is-active' : ''}`}
                    >
                      {link.icon}
                      {link.label}
                    </NavLink>
                  ))}
                </nav>
              ))}
            </div>

            <footer className="mobile-menu-foot">
              <Link className="btn btn-primary btn-full" to="/new-product">
                <FiPlus />
                List a vehicle
              </Link>
            </footer>
          </aside>
        </div>
      )}
    </>
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
