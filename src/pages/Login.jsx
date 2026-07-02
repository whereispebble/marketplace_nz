import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FiArrowRight, FiLock, FiMail } from 'react-icons/fi'
import { supabase } from '../services/supabase'
import logo from '../assets/swapy-logo.svg'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    navigate('/')
  }

  return (
    <main className="form-shell">
      <section className="panel panel-pad auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" className="brand" style={{ justifyContent: 'center' }}>
            <img src={logo} alt="Swapy" />
          </Link>
          <h1 className="section-title" style={{ marginTop: 18 }}>Welcome back</h1>
          <p className="section-subtitle">Sign in to save vehicles, contact sellers and list your campervan.</p>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="form-grid">
          <label className="field-group">
            <span>Email</span>
            <input className="field" type="email" placeholder="you@email.com" value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Password</span>
            <input
              className="field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={event => setPassword(event.target.value)}
              onKeyDown={event => event.key === 'Enter' && handleLogin()}
            />
          </label>
          <button className="btn btn-primary btn-full" type="button" disabled={loading} onClick={handleLogin}>
            {loading ? 'Signing in...' : 'Sign in'}
            {loading ? null : <FiArrowRight />}
          </button>
        </div>

        <div className="stats-grid" style={{ margin: '22px 0' }}>
          <div className="stat-box"><FiMail /><span>Email access</span></div>
          <div className="stat-box"><FiLock /><span>Secure login</span></div>
          <div className="stat-box"><strong>NZ</strong><span>Camper market</span></div>
        </div>

        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          New here? <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 900, textDecoration: 'none' }}>Create an account</Link>
        </p>
      </section>
    </main>
  )
}
