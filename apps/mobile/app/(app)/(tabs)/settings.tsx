import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Card, Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { useAuth } from '@/providers/auth-provider'
import { useLocale } from '@/providers/locale-provider'

export default function SettingsScreen() {
  const { locale, setLocale } = useLocale()
  const { session, signOut } = useAuth()
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>04 · {locale === 'ka' ? 'პარამეტრები' : 'SETTINGS'}</Text>
        <Title>{locale === 'ka' ? 'შენი Sufra' : 'Your Sufra'}</Title>
        <Text style={styles.email}>{session?.user.email}</Text>
        <Card style={styles.card}>
          <Pressable onPress={() => router.push('/onboarding')} style={styles.row}>
            <Text style={styles.rowTitle}>
              {locale === 'ka' ? 'პროფილი და მიზნები' : 'Profile and targets'}
            </Text>
            <Text>›</Text>
          </Pressable>
          <Pressable onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')} style={styles.row}>
            <Text style={styles.rowTitle}>{locale === 'ka' ? 'ენა' : 'Language'}</Text>
            <Text style={styles.value}>{locale === 'ka' ? 'ქართული' : 'English'} ›</Text>
          </Pressable>
          <Pressable onPress={() => void signOut()} style={[styles.row, styles.last]}>
            <Text style={[styles.rowTitle, { color: colors.wine }]}>
              {locale === 'ka' ? 'გასვლა' : 'Sign out'}
            </Text>
          </Pressable>
        </Card>
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            {locale === 'ka'
              ? 'Sufra-ს კვებითი შეფასებები სამედიცინო რჩევა არ არის.'
              : 'Sufra’s nutrition estimates are not medical advice.'}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: 20, paddingBottom: 42 },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
    marginTop: 18,
  },
  email: { color: colors.muted, fontSize: 14, marginTop: 10 },
  card: { marginTop: 28, paddingVertical: 0 },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
  },
  last: { borderBottomWidth: 0 },
  rowTitle: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  value: { color: colors.muted, fontSize: 13 },
  notice: { backgroundColor: colors.paperDeep, borderRadius: 18, marginTop: 22, padding: 16 },
  noticeText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
})
