import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session } from '@supabase/supabase-js'
import { getSupabase, isSupabaseConfigured } from '../supabaseClient'

type AuthValue = {
  configured: boolean
  ready: boolean
  session: Session | null
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!isSupabaseConfigured)
  const [session, setSession] = useState<Session | null>(null)

  useEffect(() => {
    const sb = getSupabase()
    if (!sb) {
      setReady(true)
      return
    }
    void sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      setSession(s)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return 'Supabaseが未設定です'
    const { error } = await sb.auth.signInWithPassword({ email, password })
    return error?.message ?? null
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const sb = getSupabase()
    if (!sb) return 'Supabaseが未設定です'
    const redirectTo =
      (import.meta.env.VITE_AUTH_EMAIL_REDIRECT_URL as string | undefined)?.trim() ||
      (typeof window !== 'undefined' ? window.location.origin : undefined)
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: redirectTo ? { emailRedirectTo: redirectTo } : undefined,
    })
    return error?.message ?? null
  }, [])

  const signOut = useCallback(async () => {
    const sb = getSupabase()
    await sb?.auth.signOut()
  }, [])

  const value = useMemo(
    () => ({
      configured: isSupabaseConfigured,
      ready,
      session,
      signIn,
      signUp,
      signOut,
    }),
    [ready, session, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('AuthProvider required')
  return ctx
}
