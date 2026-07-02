import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY
const hasSupabaseConfig = Boolean(supabaseUrl && supabaseKey)

function createMockQuery() {
  const result = { data: null, error: null }
  const query = {
    select: () => query,
    order: () => query,
    eq: () => query,
    insert: () => query,
    update: () => query,
    single: async () => result,
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
