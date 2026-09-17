import { loadEnv } from 'vite'
import { isPublicSupabaseKey, isSecureServiceUrl } from '../src/services/runtimeConfig.js'
const env = loadEnv('production', process.cwd(), '')
const base = (env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '')
const key = env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
if (!isPublicSupabaseKey(key) || !isSecureServiceUrl(base)) throw new Error('A public key and HTTPS Supabase URL are required')
let failed = false
for (const column of ['lat', 'lng', 'images']) {
  const response = await fetch(base + '/rest/v1/products?select=' + column + '&limit=0', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }, signal: AbortSignal.timeout(15000),
  })
  const result = await response.json()
  console.log(JSON.stringify({ column, status: response.status, code: result?.code, available: response.ok }))
  failed ||= !response.ok
}
process.exitCode = failed ? 1 : 0
