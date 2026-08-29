import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { colors } from '@/lib/colors'
import { useAuth } from '@/providers/auth-provider'

export default function ProtectedLayout() {
  const { session, loading } = useAuth()
  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.wine} />
      </View>
    )
  if (!session) return <Redirect href="/(auth)/sign-in" />
  return <Stack screenOptions={{ headerShown: false }} />
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
  },
})
