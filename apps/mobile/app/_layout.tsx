import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'

import { AuthProvider } from '@/providers/auth-provider'
import { LocaleProvider } from '@/providers/locale-provider'

export default function RootLayout() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </LocaleProvider>
  )
}
