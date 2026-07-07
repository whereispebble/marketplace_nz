import { createClient } from '@supabase/supabase-js'

const rawSupabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = rawSupabaseUrl?.replace(/\/rest\/v1\/?$/i, '').replace(/\/$/, '')
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
  || import.meta.env.VITE_SUPABASE_ANON_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)
const connectionErrorMessage = 'Could not connect to Supabase. Check that the Supabase URL is correct, the Supabase project is active, and the site URL is allowed in Supabase Auth settings.'

function createMockQuery() {
  const result = { data: null, error: null }
  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    insert: () => query,
    upsert: () => query,
    update: () => query,
    delete: () => query,
    single: async () => result,
    maybeSingle: async () => result,
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  }

  return query
}

function createMockSupabase() {
  return {
    from: () => createMockQuery(),
    auth: {
      signInWithPassword: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
      signUp: async () => ({ data: { user: null }, error: { message: 'Supabase is not configured.' } }),
      signInWithOAuth: async () => ({ data: null, error: { message: 'Supabase OAuth is not configured.' } }),
      getUser: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null }),
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: { message: 'Supabase is not configured.' } }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  }
}

if (!hasSupabaseConfig) {
  console.warn('Supabase env vars are missing. The app will render with local mock data.')
}

export const supabase = hasSupabaseConfig
  ? createClient(supabaseUrl, supabaseKey)
  : createMockSupabase()

export function getAuthErrorMessage(error) {
  const message = String(error?.message || error || '')
  if (message.toLowerCase().includes('email rate limit')) {
    return 'Supabase has temporarily limited confirmation emails. Wait a few minutes, use Google/Facebook sign up, or configure a custom SMTP provider in Supabase Auth.'
  }
  if (message.toLowerCase().includes('failed to fetch') || message.toLowerCase().includes('fetch')) {
    return connectionErrorMessage
  }
  return message || 'Something went wrong. Please try again.'
}

export async function checkSupabaseConnection() {
  if (!hasSupabaseConfig) return 'Supabase is not configured.'

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
      cache: 'no-store',
      method: 'GET',
    })

    if (!response.ok) return connectionErrorMessage
    return ''
  } catch {
    return connectionErrorMessage
  }
}
