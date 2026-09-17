import { defineConfig, loadEnv } from 'vite'
import { isPublicSupabaseKey, isSecureServiceUrl } from './src/services/runtimeConfig.js'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, '.', '')
  if (command === 'build') {
    const url = env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
    const key = env.VITE_SUPABASE_KEY || env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!isSecureServiceUrl(url) || !isPublicSupabaseKey(key)) throw new Error('Production requires an HTTPS Supabase URL and a public anon/publishable key.')
    for (const [name, value] of Object.entries(env)) {
      if (/^(VITE_|NEXT_PUBLIC_)/.test(name) && (/service.?role|secret|password/i.test(name) || value.startsWith('sb_secret_'))) throw new Error('A private setting is exposed to the browser. Remove it from public environment variables.')
    }
  }
  return {
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  plugins: [
    react(),
    tailwindcss(),
  ],
}
})
