import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { clearPersistedCache } from '@/lib/queryClient'
import { hasStoredSession, supabase } from '@/lib/supabase'

interface AuthState {
  /** true until the stored session has been read (never blocks rendering of the shell) */
  checking: boolean
  /** best guess while checking, confirmed afterwards */
  signedIn: boolean
  session: Session | null
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [checking, setChecking] = useState(true)
  const [hint] = useState(hasStoredSession)

  useEffect(() => {
    let alive = true
    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return
      setSession(data.session)
      setChecking(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setChecking(false)
    })
    return () => {
      alive = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value: AuthState = {
    checking,
    signedIn: checking ? hint : !!session,
    session,
    signOut: async () => {
      await supabase.auth.signOut()
      clearPersistedCache()
    },
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth outside AuthProvider')
  return ctx
}
