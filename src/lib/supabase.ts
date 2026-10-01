import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url     = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — copy .env.example to .env.local and fill in your Supabase project values. Sign-in and cloud saves are disabled.',
  )
}

// null when unconfigured so the emulator still runs; createClient throws on a
// missing URL, which would otherwise take down the whole app at import time.
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null

export function requireSupabase(): SupabaseClient {
  if (!supabase) throw new Error('Cloud saves are not configured')
  return supabase
}
