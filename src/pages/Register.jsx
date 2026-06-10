import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../services/supabase'

export default function Register() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleRegister = async () => {
    if (!form.username || !form.email || !form.password) { setError('Please fill in all fields'); return }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signUp({ email: form.email, password: form.password })
    if (error) { setError(error.message); setLoading(false); return }
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, username: form.username, email: form.email })
    }
    setLoading(false)
    setSuccess(true)
  }

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9E4EE 0%, #E8F4FB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ background: 'white', borderRadius: '28px', padding: '2.5rem', maxWidth: '420px', width: '100%', textAlign: 'center', border: '2px solid #F5C6D8', boxShadow: '0 20px 60px rgba(245,198,216,0.25)' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>🎉</div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, color: '#3a2030', margin: '0 0 10px' }}>You're in!</h2>
        <p style={{ color: '#b08090', marginBottom: '1.5rem' }}>Check your email to confirm your account.</p>
        <Link to="/login" style={{ background: 'linear-gradient(135deg, #F5C6D8, #e8a8c4)', color: '#5a2d3f', padding: '12px 32px', borderRadius: '50px', textDecoration: 'none', fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
          Go to Login
        </Link>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #F9E4EE 0%, #E8F4FB 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", padding: '2rem' }}>
      <div style={{ position: 'fixed', top: '-80px', right: '-80px', width: '300px', height: '300px', background: '#F5C6D8', borderRadius: '50%', opacity: 0.3, zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-80px', left: '-80px', width: '280px', height: '280px', background: '#A8D4E8', borderRadius: '50%', opacity: 0.25, zIndex: 0 }} />

      <div style={{ background: 'white', borderRadius: '28px', padding: '2.5rem', width: '100%', maxWidth: '420px', border: '2px solid #F5C6D8', boxShadow: '0 20px 60px rgba(245,198,216,0.25)', position: 'relative', zIndex: 1 }}>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ background: '#F5C6D8', color: '#5a2d3f', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.3rem', padding: '5px 14px', borderRadius: '10px' }}>MKT</span>
            <span style={{ color: '#A8D4E8', fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.2rem' }}>place</span>
          </Link>
          <h1 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: '1.6rem', color: '#3a2030', margin: '1.2rem 0 6px' }}>Create account ✨</h1>
          <p style={{ color: '#b08090', fontSize: '0.9rem', margin: 0 }}>Join thousands of buyers and sellers</p>
        </div>

        {error && (
          <div style={{ background: '#FFF0F5', border: '1.5px solid #F5C6D8', borderRadius: '12px', padding: '10px 14px', color: '#c0406a', fontSize: '0.85rem', marginBottom: '1rem', textAlign: 'center' }}>
            ⚠️ {error}
          </div>
        )}

        {[
          { name: 'username', label: 'Username', type: 'text', placeholder: 'yourname' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
          { name: 'password', label: 'Password', type: 'password', placeholder: '••••••••' },
          { name: 'confirmPassword', label: 'Confirm password', type: 'password', placeholder: '••••••••' },
        ].map(field => (
          <div key={field.name} style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, color: '#5a2d3f', fontSize: '0.85rem', marginBottom: '6px' }}>{field.label}</label>
            <input
              type={field.type}
              name={field.name}
              placeholder={field.placeholder}
              value={form[field.name]}
              onChange={handleChange}
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
        ))}

        <button
          onClick={handleRegister}
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
            marginTop: '0.5rem',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-2px)' }}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '1.5rem 0' }}>
          <div style={{ flex: 1, height: '1px', background: '#F5C6D8' }} />
          <span style={{ color: '#c084a0', fontSize: '0.8rem' }}>or</span>
          <div style={{ flex: 1, height: '1px', background: '#F5C6D8' }} />
        </div>

        <p style={{ textAlign: 'center', color: '#b08090', fontSize: '0.9rem', margin: 0 }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#A8D4E8', fontWeight: 700, textDecoration: 'none' }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}