import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '../lib/supabase'

interface SignUpResult {
  error: string | null
  /** True when Supabase sent a confirmation email and the user must verify first. */
  needsConfirmation: boolean
}

interface AuthContextValue {
  user: User | null
  /** False when VITE_SUPABASE_* env vars are missing (local-only mode). */
  configured: boolean
  loading: boolean
  /** Returns an error message, or null on success. */
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<SignUpResult>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }
    let active = true

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!active) return
        setUser(data.session?.user ?? null)
        setLoading(false)
      })
      .catch(() => {
        if (active) setLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      configured: isSupabaseConfigured,
      loading,
      signIn: async (email, password) => {
        if (!supabase) return 'Supabase is not configured — the app is running in local mode.'
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        return error ? error.message : null
      },
      signUp: async (email, password) => {
        if (!supabase) {
          return { error: 'Supabase is not configured — the app is running in local mode.', needsConfirmation: false }
        }
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error) return { error: error.message, needsConfirmation: false }
        // When email confirmation is enabled, no session is returned yet.
        return { error: null, needsConfirmation: !data.session }
      },
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
