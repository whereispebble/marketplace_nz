import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FaFacebookF, FaGoogle } from 'react-icons/fa'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { getAuthErrorMessage, supabase } from '../services/supabase'
import logo from '../assets/swapy-logo.svg'

export default function Register() {
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false })

  const handleChange = event => setForm({ ...form, [event.target.name]: event.target.value })

  const handleOAuthSignUp = async provider => {
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

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) { setError('Please fill in all fields'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
      if (error) { setError(getAuthErrorMessage(error)); setLoading(false); return }
      if (data.user) {
        const { error: profileError } = await supabase.from('profiles').insert({ id: data.user.id, username: form.username, email: form.email })
        if (profileError) {
          setError(getAuthErrorMessage(profileError))
          setLoading(false)
          return
        }
      }
    } catch (authError) {
      setError(getAuthErrorMessage(authError))
      setLoading(false)
      return
    }
    setLoading(false)
    setSuccess(true)
  }

  if (success) {
    return (
      <main className="form-shell">
        <section className="panel panel-pad auth-card" style={{ textAlign: 'center' }}>
          <FiCheckCircle size={54} color="var(--mint)" />
          <h1 className="section-title" style={{ marginTop: 16 }}>Account created</h1>
          <p className="section-subtitle">Check your email to confirm your account.</p>
          <Link to="/login" className="btn btn-primary" style={{ marginTop: 18 }}>Go to login</Link>
        </section>
      </main>
    )
  }

  return (
    <main className="form-shell">
      <section className="panel panel-pad auth-card">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Link to="/" className="brand" style={{ justifyContent: 'center' }}>
            <img src={logo} alt="Swapy" />
          </Link>
          <h1 className="section-title" style={{ marginTop: 18 }}>Create account</h1>
          <p className="section-subtitle">Save campervans, message sellers and list your NZ vehicle.</p>
        </div>

        {error && <div className="alert">{error}</div>}

        <div className="social-auth-grid">
          <button className="social-auth-btn" type="button" disabled={loading} onClick={() => handleOAuthSignUp('google')}>
            <FaGoogle />
            Continue with Google
          </button>
          <button className="social-auth-btn" type="button" disabled={loading} onClick={() => handleOAuthSignUp('facebook')}>
            <FaFacebookF />
            Continue with Facebook
          </button>
        </div>

        <div className="auth-divider"><span>or create with email</span></div>

        <div className="form-grid">
          {[
            { name: 'username', label: 'Username', type: 'text', placeholder: 'yourname' },
            { name: 'email', label: 'Email', type: 'email', placeholder: 'you@email.com' },
            { name: 'password', label: 'Password', type: 'password', placeholder: 'Password' },
            { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: 'Repeat password' },
          ].map(field => (
            <label className="field-group" key={field.name}>
              <span>{field.label}</span>
              {field.type === 'password' ? (
                <div className="password-field">
                  <input
                    className="field"
                    name={field.name}
                    type={visiblePasswords[field.name] ? 'text' : 'password'}
                    placeholder={field.placeholder}
                    value={form[field.name]}
                    onChange={handleChange}
                  />
                  <button
                    className="password-toggle"
                    type="button"
                    aria-label={visiblePasswords[field.name] ? 'Hide password' : 'Show password'}
                    onClick={() => setVisiblePasswords(current => ({ ...current, [field.name]: !current[field.name] }))}
                  >
                    {visiblePasswords[field.name] ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              ) : (
                <input
                  className="field"
                  name={field.name}
                  type={field.type}
                  placeholder={field.placeholder}
                  value={form[field.name]}
                  onChange={handleChange}
                />
              )}
            </label>
          ))}

          <button className="btn btn-primary btn-full" type="button" disabled={loading} onClick={handleRegister}>
            {loading ? 'Creating account...' : 'Create account'}
            {loading ? null : <FiArrowRight />}
          </button>
        </div>

        <p className="section-subtitle" style={{ textAlign: 'center' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--accent)', fontWeight: 900, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </section>
    </main>
  )
}
