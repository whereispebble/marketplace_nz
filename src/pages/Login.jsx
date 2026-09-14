/**
 * Pagina de inicio de sesion.
 *
 * La contrasena no se guarda ni se procesa aqui: se manda por HTTPS a Supabase
 * Auth, que la compara contra su hash bcrypt y devuelve un token. Esta pagina
 * nunca ve ni almacena credenciales.
 */

import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { FaFacebookF, FaGoogle } from 'react-icons/fa'
import { FiArrowRight, FiEye, FiEyeOff, FiLock, FiMail } from 'react-icons/fi'
import { getAuthErrorMessage, supabase } from '../services/supabase'
import { useSession } from '../services/session'
import logo from '../assets/swapy-logo.svg'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  // Pagina a la que queria entrar el usuario antes de que RequireAuth lo
  // mandara aqui. Sin eso, tras identificarse acabaria siempre en la portada.
  const redirectTo = location.state?.from || '/'
  const { user, loading: sessionLoading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  /**
   * Con sesion ya iniciada esta pantalla no pinta nada, asi que se sale de
   * ella. Cubre tres casos: volver al login teniendo sesion, identificarse con
   * un proveedor externo (que no pasa por handleLogin) y activar la sesion de
   * prueba de desarrollo desde aqui.
   */
  useEffect(() => {
    if (sessionLoading || !user) return
    navigate(redirectTo, { replace: true })
  }, [user, sessionLoading, navigate, redirectTo])

  /**
   * Identifica al usuario con email y contrasena.
   * Los errores de Supabase se traducen a un mensaje legible sin revelar si el
   * correo existe o no, para no dar pistas a quien pruebe cuentas ajenas.
   */
  const handleLogin = async () => {
    if (!email || !password) { setError('Please fill in all fields'); return }
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(getAuthErrorMessage(error))
        setLoading(false)
        return
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
      setLoading(false)
      return
    }
    navigate(redirectTo, { replace: true })
  }

  /**
   * Identificacion con un proveedor externo (Google o Facebook).
   * @param {'google'|'facebook'} provider
   */
  const handleOAuthLogin = async provider => {
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
      })
      if (error) {
        setError(getAuthErrorMessage(error))
        setLoading(false)
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
      setLoading(false)
    }
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

        <div className="social-auth-grid">
          <button className="social-auth-btn" type="button" disabled={loading} onClick={() => handleOAuthLogin('google')}>
            <FaGoogle />
            Continue with Google
          </button>
          <button className="social-auth-btn" type="button" disabled={loading} onClick={() => handleOAuthLogin('facebook')}>
            <FaFacebookF />
            Continue with Facebook
          </button>
        </div>

        <div className="auth-divider"><span>or sign in with email</span></div>

        <div className="form-grid">
          <label className="field-group">
            <span>Email</span>
            <input className="field" type="email" placeholder="you@email.com" value={email} onChange={event => setEmail(event.target.value)} />
          </label>
          <label className="field-group">
            <span>Password</span>
            <div className="password-field">
              <input
                className="field"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                onKeyDown={event => event.key === 'Enter' && handleLogin()}
              />
              <button
                className="password-toggle"
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword(current => !current)}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
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
