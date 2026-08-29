import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'

import { colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

export default function AuthCallbackScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>()
  const { locale } = useLocale()
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!code) {
      setFailed(true)
      return
    }
    void supabase.auth.exchangeCodeForSession(code).then((result) => {
      if (result.error) setFailed(true)
      else router.replace('/')
    })
  }, [code])

  return (
    <View style={styles.container}>
      {failed ? (
        <>
          <Text style={styles.message}>
            {locale === 'ka'
              ? 'ბმული არასწორია ან ვადა გაუვიდა.'
              : 'The confirmation link is invalid or expired.'}
          </Text>
          <Text onPress={() => router.replace('/(auth)/sign-in')} style={styles.link}>
            {locale === 'ka' ? 'შესვლაზე დაბრუნება' : 'Back to sign in'}
          </Text>
        </>
      ) : (
        <ActivityIndicator color={colors.wine} size="large" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  message: { color: colors.ink, fontSize: 16, lineHeight: 24, textAlign: 'center' },
  link: { color: colors.wine, fontSize: 14, fontWeight: '800', marginTop: 20, padding: 10 },
})
