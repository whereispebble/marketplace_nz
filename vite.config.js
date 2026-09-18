import { defineConfig, loadEnv } from 'vite'
import { isPublicSupabaseKey, isSecureServiceUrl } from './src/services/runtimeConfig.js'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '')
  if (command === 'build') {
    const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
    const key = env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY
    // Preview deployments may intentionally have no database attached. If one
    // side is configured, require the complete and safe public pair.
    if (Boolean(url) !== Boolean(key)) throw new Error('Supabase configuration is incomplete: provide both the project URL and public anon/publishable key.')
    if (url && !isSecureServiceUrl(url)) throw new Error('The Supabase URL must be a valid HTTPS project URL.')
    if (key && !isPublicSupabaseKey(key)) throw new Error('The Supabase browser key must be anon or sb_publishable_. Never use service_role or sb_secret_.')
    for (const [name, value] of Object.entries(env)) {
      if (/^(VITE_|NEXT_PUBLIC_)/.test(name) && (/service.?role|secret|password/i.test(name) || value.startsWith('sb_secret_'))) throw new Error('A private setting is exposed to the browser. Remove it from public environment variables.')
    }
  }
  return {
  // Only these two integration variables are additionally exposed. Never use
  // a broad SUPABASE_ prefix: it would also bundle service-role secrets.
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'],
  plugins: [
    react(),
    tailwindcss(),
  ],
}
})
