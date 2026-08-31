import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect, useState } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { SufraPreloader } from '@/components/sufra-preloader'
import { fontAssets } from '@/lib/theme'
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import { LocaleProvider, useLocale } from '@/providers/locale-provider'

void SplashScreen.preventAutoHideAsync()

const MINIMUM_LAUNCH_MS = 1100

function AppNavigator() {
  const { loading } = useAuth()
  const { locale } = useLocale()
  const [minimumElapsed, setMinimumElapsed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setMinimumElapsed(true), MINIMUM_LAUNCH_MS)
    return () => clearTimeout(timer)
  }, [])

  if (loading || !minimumElapsed) {
    return <SufraPreloader message={locale === 'ka' ? 'კვირას ვამზადებთ' : 'Preparing your week'} />
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  )
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets)

  useEffect(() => {
    // Georgian reflows heavily between the system fallback and Noto, so hold the
    // splash rather than let every screen visibly reset. A load failure still
    // releases it: system fallback is worse than a blank app.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync()
  }, [fontsLoaded, fontError])

  if (!fontsLoaded && !fontError) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <LocaleProvider>
          <AuthProvider>
            <AppNavigator />
          </AuthProvider>
        </LocaleProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
