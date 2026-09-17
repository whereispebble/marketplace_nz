import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAuthRedirectUrl, supabase } from '../services/supabase'
import { useSession } from '../services/session'

export default function PasswordRecovery({ reset = false }) {
  const { user, loading: sessionLoading } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const submit = async event => {
    event.preventDefault()
    if (busy) return
    setError('')
    if (user?.isDevUser) { setError('Test mode cannot send recovery emails or change real passwords.'); return }
    if (reset && (password.length < 8 || !/[a-zA-Z]/.test(password) || !/[0-9]/.test(password))) { setError('Use at least 8 characters, including a letter and a number.'); return }
    if (reset && password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (reset && (!user || user.isDevUser)) { setError('Open a valid password recovery link from your email.'); return }
    setBusy(true)
    try {
      const result = reset
        ? await supabase.auth.updateUser({ password })
        : await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${getAuthRedirectUrl()}reset-password` })
      if (result.error) throw result.error
      setPassword('')
      setConfirmPassword('')
      setDone(true)
    } catch { setError(reset ? 'Could not update the password. Request a fresh recovery link and try again.' : 'Could not request recovery. Please try again later.') }
    finally { setBusy(false) }
  }
  return <main className="form-shell"><section className="panel panel-pad auth-card">
    <h1 className="section-title">{reset ? 'Set a new password' : 'Recover your account'}</h1>
    {done ? <p role="status">{reset ? 'Your password has been updated.' : 'If an account matches this address, you will receive a password recovery email.'}</p> :
      <form onSubmit={submit}>
        {reset ? <>
          <label className="field-group"><span>New password</span><input className="field" type="password" autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} /></label>
          <label className="field-group"><span>Confirm new password</span><input className="field" type="password" autoComplete="new-password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required /></label>
        </> : <label className="field-group"><span>Email</span><input className="field" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>}
        {error && <p role="alert">{error}</p>}
        {reset && !sessionLoading && !user && <p>This recovery link is missing or expired. <Link to="/forgot-password">Request a new link</Link>.</p>}
        <button className="btn btn-primary" disabled={busy || (reset && (sessionLoading || !user))}>{busy ? 'Please wait...' : reset ? 'Update password' : 'Send recovery link'}</button>
      </form>}
    <p><Link to={reset && done ? '/profile' : '/login'}>{reset && done ? 'Go to your account' : 'Back to sign in'}</Link></p>
  </section></main>
}
