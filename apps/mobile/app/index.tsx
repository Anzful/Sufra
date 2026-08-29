import { Redirect } from 'expo-router'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { colors } from '@/lib/colors'
import { useAuth } from '@/providers/auth-provider'

export default function Index() {
  const { session, loading, onboardingComplete } = useAuth()
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.wine} size="large" />
      </View>
    )
  }
  if (!session) return <Redirect href="/(auth)/sign-in" />
  if (!onboardingComplete) return <Redirect href="/(app)/onboarding" />
  return <Redirect href="/(app)/(tabs)/plan" />
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
  },
})
