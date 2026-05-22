import { createClient, type SupabaseClient } from '@supabase/supabase-js'

function trimEnv(s: string | undefined): string | undefined {
  if (s == null) return undefined
  const t = s.trim().replace(/^['"]+|['"]+$/g, '')
  return t || undefined
}

const url = trimEnv(import.meta.env.VITE_SUPABASE_URL as string | undefined)
const anon = trimEnv(import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)

export const isSupabaseConfigured = Boolean(
  url && anon && /^https?:\/\//i.test(url),
)

let client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured || !url || !anon) return null
  if (!client) {
    client = createClient(url, anon, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'synqa-auth',
      },
    })
  }
  return client
}
