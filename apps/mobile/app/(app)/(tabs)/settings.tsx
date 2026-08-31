import Ionicons from '@expo/vector-icons/Ionicons'
import type { Locale } from '@sufra/shared'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState, type ComponentProps } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SufraBrand } from '@/components/sufra-brand'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { fontFamilyFor, shadow } from '@/lib/theme'
import { useAuth } from '@/providers/auth-provider'
import { useLocale } from '@/providers/locale-provider'

type IoniconName = ComponentProps<typeof Ionicons>['name']

interface TranslationRow {
  locale: Locale
  name: string
}

interface SettingsSummary {
  budgetAmountGel: number
  budgetPeriod: string
  diet: string
  householdSize: number
  maxCookMinutes: number | null
  store: string
}

function localized(rows: TranslationRow[], locale: Locale, fallback: string): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? fallback
}

function ProfileFact({
  icon,
  value,
  wide = false,
}: {
  icon: IoniconName
  value: string
  wide?: boolean
}) {
  return (
    <View style={[styles.fact, wide && styles.factWide]}>
      <Ionicons color={colors.ink} name={icon} size={23} />
      <Text numberOfLines={1} style={styles.factText}>
        {value}
      </Text>
    </View>
  )
}

export default function SettingsScreen() {
  const { locale, setLocale } = useLocale()
  const { session, signOut } = useAuth()
  const [summary, setSummary] = useState<SettingsSummary | null>(null)

  async function loadSummary() {
    if (isMockMode()) {
      const snapshot = getMockSnapshot()
      const profile = snapshot.profile
      const store = snapshot.stores.find((item) => item.id === profile.preferredStoreId)
      const diet = snapshot.dietaryPatterns.find((item) =>
        profile.dietaryPatternIds.includes(item.id),
      )
      setSummary({
        budgetAmountGel: profile.budgetAmountGel,
        budgetPeriod: profile.budgetPeriod,
        diet: diet ? localized(diet.translations, locale, diet.slug) : '·',
        householdSize: profile.householdSize,
        maxCookMinutes: profile.maxCookMinutes,
        store: store ? localized(store.translations, locale, store.slug) : '·',
      })
      return
    }

    if (!session) return
    const profileResult = await supabase
      .from('profiles')
      .select(
        'preferred_store_id, household_size, budget_period, budget_amount_gel, max_cook_minutes',
      )
      .eq('user_id', session.user.id)
      .maybeSingle()
    if (profileResult.error || !profileResult.data) return

    const profile = profileResult.data
    const [storeResult, dietResult] = await Promise.all([
      profile.preferred_store_id
        ? supabase
            .from('stores')
            .select('slug, store_translations(locale, name)')
            .eq('id', profile.preferred_store_id)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from('profile_dietary_patterns')
        .select('dietary_patterns!inner(slug, dietary_pattern_translations(locale, name))')
        .eq('user_id', session.user.id)
        .limit(1)
        .maybeSingle(),
    ])

    const store = storeResult.data as { slug: string; store_translations: TranslationRow[] } | null
    const selectedDiet = dietResult.data?.dietary_patterns as unknown as {
      slug: string
      dietary_pattern_translations: TranslationRow[]
    } | null
    setSummary({
      budgetAmountGel: Number(profile.budget_amount_gel ?? 0),
      budgetPeriod: String(profile.budget_period ?? 'weekly'),
      diet: selectedDiet
        ? localized(selectedDiet.dietary_pattern_translations, locale, selectedDiet.slug)
        : '·',
      householdSize: Number(profile.household_size ?? 1),
      maxCookMinutes: profile.max_cook_minutes === null ? null : Number(profile.max_cook_minutes),
      store: store ? localized(store.store_translations, locale, store.slug) : '·',
    })
  }

  useFocusEffect(
    useCallback(() => {
      void loadSummary()
    }, [locale, session?.user.id]),
  )

  const period =
    summary?.budgetPeriod === 'daily'
      ? locale === 'ka'
        ? 'დღე'
        : 'day'
      : summary?.budgetPeriod === 'monthly'
        ? locale === 'ka'
          ? 'თვე'
          : 'month'
        : locale === 'ka'
          ? 'კვირა'
          : 'week'
  const people = summary
    ? locale === 'ka'
      ? `${summary.householdSize} ადამიანი`
      : `${summary.householdSize} people`
    : '·'
  const budget = summary ? `${summary.budgetAmountGel.toLocaleString()} ₾ / ${period}` : '·'
  const cookTime = summary?.maxCookMinutes
    ? `${summary.maxCookMinutes} ${locale === 'ka' ? 'წთ' : 'min'}`
    : '·'

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SufraBrand size="compact" />

        <Text style={styles.title}>{locale === 'ka' ? 'შენი Sufra' : 'Your Sufra'}</Text>
        <Text style={styles.email}>{session?.user.email}</Text>

        <View style={styles.profileCard}>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/onboarding')}
            style={({ pressed }) => [styles.profileHeader, pressed && styles.pressed]}
          >
            <View style={styles.profileHeaderCopy}>
              <Ionicons color={colors.ink} name="person-add-outline" size={30} />
              <View style={styles.profileHeaderText}>
                <Text style={styles.profileTitle}>
                  {locale === 'ka' ? 'პროფილი და მიზნები' : 'Profile and targets'}
                </Text>
                <Text style={styles.profileSubtitle}>
                  {locale === 'ka' ? 'შეცვალე შენი არჩევანი' : 'Update your preferences'}
                </Text>
              </View>
            </View>
            <Ionicons color={colors.ink} name="chevron-forward" size={23} />
          </Pressable>

          <View style={styles.factGrid}>
            <ProfileFact icon="people-outline" value={people} />
            <ProfileFact icon="wallet-outline" value={budget} />
            <ProfileFact icon="restaurant-outline" value={summary?.diet ?? '·'} />
            <ProfileFact icon="time-outline" value={cookTime} />
            <ProfileFact icon="storefront-outline" value={summary?.store ?? '·'} wide />
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')}
          style={({ pressed }) => [styles.settingRow, pressed && styles.pressed]}
        >
          <View style={styles.settingStart}>
            <Ionicons color={colors.ink} name="globe-outline" size={27} />
            <Text style={styles.settingLabel}>{locale === 'ka' ? 'ენა' : 'Language'}</Text>
          </View>
          <View style={styles.settingEnd}>
            <Text style={styles.settingValue}>{locale === 'ka' ? 'ქართული' : 'English'}</Text>
            <Ionicons color={colors.inkSoft} name="chevron-forward" size={21} />
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => void signOut()}
          style={({ pressed }) => [styles.signOutRow, pressed && styles.pressed]}
        >
          <View style={styles.settingStart}>
            <Ionicons color={colors.danger} name="log-out-outline" size={27} />
            <Text style={styles.signOutText}>{locale === 'ka' ? 'გასვლა' : 'Sign out'}</Text>
          </View>
          <Ionicons color={colors.inkSoft} name="chevron-forward" size={21} />
        </Pressable>

        <Text style={styles.notice}>
          {locale === 'ka'
            ? 'Sufra-ს კვებითი შეფასებები სამედიცინო რჩევა არ არის.'
            : "Sufra's nutrition estimates are not medical advice."}
        </Text>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#fbfcfa', flex: 1 },
  content: { flexGrow: 1, paddingBottom: 28, paddingHorizontal: 22, paddingTop: 18 },
  title: {
    color: colors.emeraldBlack,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 34,
    letterSpacing: -0.8,
    lineHeight: 44,
    marginTop: 25,
  },
  email: {
    color: colors.inkSoft,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 15,
    marginTop: 2,
  },
  profileCard: {
    backgroundColor: 'rgba(246,251,248,0.92)',
    borderColor: '#b9dbca',
    borderRadius: 22,
    borderWidth: 1,
    marginTop: 20,
    padding: 15,
    ...shadow(1),
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 55,
  },
  profileHeaderCopy: { alignItems: 'center', flexDirection: 'row', flex: 1 },
  profileHeaderText: { flex: 1, marginLeft: 14 },
  profileTitle: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 15,
    lineHeight: 21,
  },
  profileSubtitle: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 12,
    marginTop: 3,
  },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  fact: {
    alignItems: 'center',
    borderColor: '#b9dbca',
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    height: 49,
    paddingHorizontal: 12,
    width: '48%',
  },
  factWide: { width: '100%' },
  factText: {
    color: colors.inkSoft,
    flex: 1,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 12,
    marginLeft: 10,
  },
  settingRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 18,
    ...shadow(1),
  },
  settingStart: { alignItems: 'center', flexDirection: 'row' },
  settingLabel: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 15,
    marginLeft: 15,
  },
  settingEnd: { alignItems: 'center', flexDirection: 'row', gap: 11 },
  settingValue: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 13,
  },
  signOutRow: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    height: 60,
    justifyContent: 'space-between',
    marginTop: 24,
    paddingHorizontal: 18,
    ...shadow(1),
  },
  signOutText: {
    color: colors.danger,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 15,
    marginLeft: 15,
  },
  notice: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 12,
    lineHeight: 17,
    marginHorizontal: 8,
    marginTop: 12,
    maxWidth: 270,
  },
  pressed: { opacity: 0.67 },
})
