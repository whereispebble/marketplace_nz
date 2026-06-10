import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

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
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/')
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #F9E4EE 0%, #E8F4FB 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'DM Sans', sans-serif",
      padding: '2rem',
    }}>
      {/* Decorative circles */}
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '300px', height: '300px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.3, zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '280px', height: '280px', background: '#A8D4E8', borderRadius: '50%', opacity: 0.25, zIndex: 0 }} />

      <div style={{
        background: 'white',
        borderRadius: '28px',
        padding: '2.5rem',
        width: '100%',
        maxWidth: '420px',
        border: '2px solid #F5C6D8',
        boxShadow: '0 20px 60px rgba(245,198,216,0.25)',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', padding: '5px 14px', borderRadius: '10px' }}>MKT</span>
            <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem' }}>place</span>
          </Link>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#3a2030', margin: '1.2rem 0 6px' }}>
            Welcome back 👋
          </h1>
          <p style={{ color: '#b08090', fontSize: '0.9rem', margin: 0 }}>Sign in to your account</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: '#FFF0F5', border: '1.5px solid #F5C6D8', borderRadius: '12px', padding: '10px 14px', color: '#c0406a', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Email */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>Email</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '2px solid #F5C6D8',
              background: '#FDF6F8',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: 'border-box',
              color: '#333',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#A8D4E8'}
            onBlur={e => e.target.style.borderColor = '#F5C6D8'}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>Password</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '14px',
              border: '2px solid #F5C6D8',
              background: '#FDF6F8',
              fontSize: '0.95rem',
              outline: 'none',
              fontFamily: "'DM Sans', sans-serif",
              boxSizing: 'border-box',
              color: '#333',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = '#A8D4E8'}
            onBlur={e => e.target.style.borderColor = '#F5C6D8'}
          />
          <div style={{ textAlign: 'right', marginTop: '6px' }}>
            <span style={{ color: '#A8D4E8', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' }}>Forgot password?</span>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: loading ? '#f0d4e0' : 'linear-gradient(135deg, #F5C6D8, #e8a8c4)',
            color: '#5a2d3f',
            border: 'none',
            borderRadius: '50px',
            fontFamily: "'Syne', sans-serif",
            fontWeight: 700,
            fontSize: '1rem',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 4px 16px rgba(245,198,216,0.4)',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#F5C6D8' }} />
          <span style={{ color: '#c084a0', fontSize: '0.8rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#F5C6D8' }} />
        </div>

        {/* Register link */}
        <p style={{ textAlign: 'center', color: '#b08090', fontSize: '0.9rem', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#A8D4E8', fontWeight: 700, textDecoration: 'none' }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}