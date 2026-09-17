export function isPublicSupabaseKey(key) {
  if (typeof key !== 'string') return false
  if (key.startsWith('sb_publishable_')) return true
  try {
    const payload = JSON.parse(atob(key.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role === 'anon'
  } catch { return false }
}
export function isSecureServiceUrl(value, development = false) {
  try {
    const url = new URL(value)
    return !url.username && !url.password && (url.protocol === 'https:' || (development && url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname)))
  } catch { return false }
}
