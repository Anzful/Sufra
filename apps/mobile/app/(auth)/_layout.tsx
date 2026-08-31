import { Redirect, Stack } from 'expo-router'
import { useEffect, useState } from 'react'

import { useAuth } from '@/providers/auth-provider'

const AUTH_REDIRECT_DELAY_MS = 900

export default function AuthLayout() {
  const { session, loading } = useAuth()
  const [redirectReady, setRedirectReady] = useState(false)

  useEffect(() => {
    if (loading || !session) {
      setRedirectReady(false)
      return undefined
    }

    const timer = setTimeout(() => setRedirectReady(true), AUTH_REDIRECT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [loading, session])

  if (!loading && session && redirectReady) return <Redirect href="/" />
  return <Stack screenOptions={{ headerShown: false }} />
}
