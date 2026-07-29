import { Link } from 'react-router-dom'
import { FiHeart, FiMail, FiMessageCircle } from 'react-icons/fi'
import logo from '../assets/swapy-logo.svg'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <img src={logo} alt="Swapy" />
          <p>
            The New Zealand marketplace for campervans, motorhomes and van conversions. Every listing shows the
            details that actually decide a purchase: WOF, self-contained certification, odometer and location.
          </p>
        </div>

        <nav className="site-footer-links" aria-label="Marketplace">
          <h3>Marketplace</h3>
          <Link to="/">Buy a vehicle</Link>
          <Link to="/new-product">Sell a vehicle</Link>
          <Link to="/favorites">
            <FiHeart />
            Saved vehicles
          </Link>
          <Link to="/chats">
            <FiMessageCircle />
            Messages
          </Link>
        </nav>

        <nav className="site-footer-links" aria-label="Company">
          <h3>Company</h3>
          <Link to="/how-it-works">How it works</Link>
          <Link to="/how-it-works">Frequently asked questions</Link>
          <Link to="/how-it-works#contact">
            <FiMail />
            Send us a request
          </Link>
        </nav>

        <nav className="site-footer-links" aria-label="Legal">
          <h3>Legal</h3>
          <Link to="/privacy">Privacy policy</Link>
          <Link to="/terms">Terms of use</Link>
        </nav>
      </div>

      <div className="container site-footer-bottom">
        <span>© {year} Swapy. Built in Aotearoa New Zealand.</span>
        <span>
          Swapy is a marketplace. Sellers are responsible for their own listings, so always view a vehicle
          in person before paying.
        </span>
      </div>
    </footer>
  )
}
