/**
 * Pagina de registro.
 *
 * Crea la cuenta en Supabase Auth. El perfil asociado lo crea un trigger de la
 * base de datos (handle_new_user), no esta pagina: asi no queda una cuenta sin
 * perfil si el navegador se cierra entre las dos llamadas.
 *
 * La contrasena viaja por HTTPS y la cifra Supabase con bcrypt; aqui solo se
 * valida su forma antes de mandarla.
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaFacebookF, FaGoogle } from 'react-icons/fa'
import { FiArrowRight, FiCheckCircle, FiEye, FiEyeOff } from 'react-icons/fi'
import { getAuthErrorMessage, supabase } from '../services/supabase'
import { useSession } from '../services/session'
import logo from '../assets/swapy-logo.svg'

/**
 * Comprueba los campos del formulario antes de mandarlos.
 *
 * Estas reglas son una primera barrera para dar un mensaje claro al momento.
 * La exigencia real la impone Supabase Auth con la longitud minima y la
 * comprobacion de contrasenas filtradas configuradas en el panel.
 *
 * @param {{username: string, email: string, password: string, confirmPassword: string}} form
 * @returns {string} mensaje de error, o cadena vacia si todo es correcto
 */
function validatePassword(form) {
  if (!form.username.trim() || !form.email.trim() || !form.password) {
    return 'Please fill in all fields'
  }
  if (form.password !== form.confirmPassword) {
    return 'Passwords do not match'
  }
  if (form.password.length < 8) {
    return 'Password must be at least 8 characters'
  }
  if (!/[a-zA-Z]/.test(form.password) || !/[0-9]/.test(form.password)) {
    return 'Password must include at least one letter and one number'
  }
  return ''
}

export default function Register() {
  const navigate = useNavigate()
  const { user, loading: sessionLoading } = useSession()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [visiblePasswords, setVisiblePasswords] = useState({ password: false, confirmPassword: false })

  // Con sesion iniciada no tiene sentido seguir en el registro. Tambien cubre
  // el caso de activar la sesion de prueba de desarrollo desde esta pantalla.
  useEffect(() => {
    if (sessionLoading || !user || success) return
    navigate('/', { replace: true })
  }, [user, sessionLoading, success, navigate])

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

  /**
   * Crea la cuenta.
   *
   * El nombre de usuario viaja dentro de options.data y el trigger de la base
   * lo copia al perfil. Esta pagina ya no inserta en profiles: hacerlo desde el
   * navegador dejaba cuentas sin perfil cuando la segunda llamada fallaba.
   */
  const handleRegister = async () => {
    const validationError = validatePassword(form)
    if (validationError) { setError(validationError); return }

    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { username: form.username.trim() } },
      })
      if (error) { setError(getAuthErrorMessage(error)); setLoading(false); return }
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
