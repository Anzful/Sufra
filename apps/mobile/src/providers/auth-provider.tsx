import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase'

interface AuthState {
  session: Session | null
  loading: boolean
  onboardingComplete: boolean | null
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)

  async function loadProfile(activeSession: Session | null) {
    if (!activeSession) {
      setOnboardingComplete(null)
      return
    }
    const result = await supabase
      .from('profiles')
      .select('onboarding_completed_at')
      .eq('user_id', activeSession.user.id)
      .single()
    setOnboardingComplete(Boolean(result.data?.onboarding_completed_at))
  }

  async function refreshProfile() {
    await loadProfile(session)
  }

  useEffect(() => {
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      await loadProfile(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void loadProfile(nextSession)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo(
    () => ({ session, loading, onboardingComplete, refreshProfile }),
    [session, loading, onboardingComplete],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be called inside AuthProvider.')
  return value
}
