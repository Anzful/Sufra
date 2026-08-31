import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { isMockMode } from '@/lib/data-mode'
import {
  getMockState,
  signInMock,
  signOutMock,
  signUpMock,
  subscribeMockState,
} from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'

type AppSession = Session | NonNullable<ReturnType<typeof getMockState>['session']>

interface AuthState {
  session: AppSession | null
  loading: boolean
  onboardingComplete: boolean | null
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (
    email: string,
    password: string,
    locale: 'ka' | 'en',
    displayName?: string,
  ) => Promise<string | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AppSession | null>(null)
  const [loading, setLoading] = useState(true)
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null)

  async function loadProfile(activeSession: AppSession | null) {
    if (isMockMode()) {
      setOnboardingComplete(activeSession ? getMockState().onboardingComplete : null)
      return
    }
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
    if (isMockMode()) {
      const next = getMockState()
      setSession(next.session)
      setOnboardingComplete(next.session ? next.onboardingComplete : null)
    } else {
      await loadProfile(session)
    }
  }

  useEffect(() => {
    if (isMockMode()) {
      const sync = () => {
        const next = getMockState()
        setSession(next.session)
        setOnboardingComplete(next.session ? next.onboardingComplete : null)
        setLoading(false)
      }
      sync()
      return subscribeMockState(sync)
    }
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

  async function signIn(email: string, password: string): Promise<string | null> {
    if (isMockMode()) {
      signInMock(email)
      return null
    }
    const result = await supabase.auth.signInWithPassword({ email, password })
    return result.error?.message ?? null
  }

  async function signUp(
    email: string,
    password: string,
    locale: 'ka' | 'en',
    displayName?: string,
  ): Promise<string | null> {
    if (isMockMode()) {
      signUpMock(email, displayName)
      return null
    }
    const result = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName?.trim() || undefined, locale },
        emailRedirectTo: 'sufra://auth/callback',
      },
    })
    return result.error?.message ?? null
  }

  async function signOut(): Promise<void> {
    if (isMockMode()) signOutMock()
    else await supabase.auth.signOut()
  }

  const value = useMemo(
    () => ({ session, loading, onboardingComplete, refreshProfile, signIn, signUp, signOut }),
    [session, loading, onboardingComplete],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be called inside AuthProvider.')
  return value
}
