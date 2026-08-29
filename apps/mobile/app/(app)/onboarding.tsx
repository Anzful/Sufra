import { createSufraApi, profileInputSchema, type Locale, type SufraTransport } from '@sufra/shared'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Card, Field, Label, PrimaryButton, Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot, saveProfileMock } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/providers/auth-provider'
import { useLocale } from '@/providers/locale-provider'

interface Translation {
  locale: Locale
  name: string
}

interface Choice {
  id: number
  slug: string
  translations: Translation[]
}

function choiceName(choice: Choice, locale: Locale) {
  return (
    choice.translations.find((item) => item.locale === locale)?.name ??
    choice.translations[0]?.name ??
    choice.slug
  )
}

function toggleId(values: number[], id: number): number[] {
  return values.includes(id) ? values.filter((value) => value !== id) : [...values, id]
}

function nullableNumber(value: string): number | null {
  return value.trim() ? Number(value) : null
}

export default function OnboardingScreen() {
  const { session, refreshProfile } = useAuth()
  const { locale, setLocale } = useLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [stores, setStores] = useState<Choice[]>([])
  const [appliances, setAppliances] = useState<Choice[]>([])
  const [allergens, setAllergens] = useState<Choice[]>([])
  const [diets, setDiets] = useState<Choice[]>([])
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('Tbilisi')
  const [preferredStoreId, setPreferredStoreId] = useState(0)
  const [householdSize, setHouseholdSize] = useState('1')
  const [budgetPeriod, setBudgetPeriod] = useState<'daily' | 'weekly'>('weekly')
  const [budget, setBudget] = useState('150')
  const [calories, setCalories] = useState('2000')
  const [protein, setProtein] = useState('120')
  const [carbs, setCarbs] = useState('220')
  const [fat, setFat] = useState('65')
  const [fiber, setFiber] = useState('30')
  const [mealsPerDay, setMealsPerDay] = useState('3')
  const [maxCookMinutes, setMaxCookMinutes] = useState('45')
  const [includeLeftovers, setIncludeLeftovers] = useState(true)
  const [allowBatchCooking, setAllowBatchCooking] = useState(true)
  const [applianceIds, setApplianceIds] = useState<number[]>([])
  const [allergenIds, setAllergenIds] = useState<number[]>([])
  const [dietIds, setDietIds] = useState<number[]>([])

  useEffect(() => {
    if (!session) return
    void (async () => {
      if (isMockMode()) {
        const snapshot = getMockSnapshot()
        const row = snapshot.profile
        setStores(snapshot.stores)
        setAppliances(snapshot.appliances)
        setAllergens(snapshot.allergens)
        setDiets(snapshot.dietaryPatterns)
        setApplianceIds(row.applianceIds)
        setAllergenIds(row.allergenIds)
        setDietIds(row.dietaryPatternIds)
        setDisplayName(row.displayName ?? '')
        setCity(row.city)
        setPreferredStoreId(row.preferredStoreId)
        setHouseholdSize(String(row.householdSize))
        setBudgetPeriod(row.budgetPeriod)
        setBudget(String(row.budgetAmountGel))
        setCalories(String(row.dailyCalorieTarget))
        setProtein(String(row.proteinTargetG ?? ''))
        setCarbs(String(row.carbohydrateTargetG ?? ''))
        setFat(String(row.fatTargetG ?? ''))
        setFiber(String(row.fiberTargetG ?? ''))
        setMealsPerDay(String(row.mealsPerDay))
        setMaxCookMinutes(String(row.maxCookMinutes ?? ''))
        setIncludeLeftovers(row.includeLeftovers)
        setAllowBatchCooking(row.allowBatchCooking)
        setLocale(row.locale)
        setLoading(false)
        return
      }
      const userId = session.user.id
      const [
        profile,
        storeRows,
        applianceRows,
        allergenRows,
        dietRows,
        selectedAppliances,
        selectedAllergens,
        selectedDiets,
      ] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', userId).single(),
        supabase
          .from('stores')
          .select('id, slug, translations:store_translations(locale, name)')
          .eq('is_active', true)
          .order('slug'),
        supabase
          .from('appliances')
          .select('id, slug, translations:appliance_translations(locale, name)')
          .eq('is_active', true)
          .order('id'),
        supabase
          .from('allergens')
          .select('id, slug, translations:allergen_translations(locale, name)')
          .eq('is_active', true)
          .order('id'),
        supabase
          .from('dietary_patterns')
          .select('id, slug, translations:dietary_pattern_translations(locale, name)')
          .eq('is_active', true)
          .order('id'),
        supabase.from('profile_appliances').select('appliance_id').eq('user_id', userId),
        supabase.from('profile_allergens').select('allergen_id').eq('user_id', userId),
        supabase
          .from('profile_dietary_patterns')
          .select('dietary_pattern_id')
          .eq('user_id', userId),
      ])
      setStores((storeRows.data ?? []) as unknown as Choice[])
      setAppliances((applianceRows.data ?? []) as unknown as Choice[])
      setAllergens((allergenRows.data ?? []) as unknown as Choice[])
      setDiets((dietRows.data ?? []) as unknown as Choice[])
      setApplianceIds((selectedAppliances.data ?? []).map((row) => row.appliance_id))
      setAllergenIds((selectedAllergens.data ?? []).map((row) => row.allergen_id))
      setDietIds((selectedDiets.data ?? []).map((row) => row.dietary_pattern_id))
      if (profile.data) {
        const row = profile.data
        setDisplayName(row.display_name ?? '')
        setCity(row.city ?? 'Tbilisi')
        setPreferredStoreId(row.preferred_store_id ?? 0)
        setHouseholdSize(String(row.household_size ?? 1))
        setBudgetPeriod(row.budget_period ?? 'weekly')
        setBudget(String(row.budget_amount_gel ?? 150))
        setCalories(String(row.daily_calorie_target ?? 2000))
        setProtein(String(row.protein_target_g ?? 120))
        setCarbs(String(row.carbohydrate_target_g ?? 220))
        setFat(String(row.fat_target_g ?? 65))
        setFiber(String(row.fiber_target_g ?? 30))
        setMealsPerDay(String(row.meals_per_day ?? 3))
        setMaxCookMinutes(String(row.max_cook_minutes ?? 45))
        setIncludeLeftovers(row.include_leftovers ?? true)
        setAllowBatchCooking(row.allow_batch_cooking ?? true)
        if (row.locale === 'ka' || row.locale === 'en') setLocale(row.locale)
      }
      setLoading(false)
    })()
  }, [session])

  async function save() {
    const parsed = profileInputSchema.safeParse({
      displayName: displayName.trim() || null,
      locale,
      timezone: 'Asia/Tbilisi',
      city: city.trim(),
      preferredStoreId,
      householdSize: Number(householdSize),
      budgetPeriod,
      budgetAmountGel: Number(budget),
      dailyCalorieTarget: Number(calories),
      proteinTargetG: nullableNumber(protein),
      carbohydrateTargetG: nullableNumber(carbs),
      fatTargetG: nullableNumber(fat),
      fiberTargetG: nullableNumber(fiber),
      mealsPerDay: Number(mealsPerDay),
      maxCookMinutes: nullableNumber(maxCookMinutes),
      includeLeftovers,
      allowBatchCooking,
      applianceIds,
      allergenIds,
      dietaryPatternIds: dietIds,
    })
    if (!parsed.success) {
      setMessage(
        locale === 'ka'
          ? 'გადაამოწმე ყველა რიცხვი და აირჩიე მაღაზია.'
          : 'Check every number and select a store.',
      )
      return
    }
    setSaving(true)
    setMessage('')
    try {
      if (isMockMode()) saveProfileMock(parsed.data)
      else await createSufraApi(supabase as unknown as SufraTransport).saveProfile(parsed.data)
    } catch {
      setMessage(locale === 'ka' ? 'პროფილი ვერ შეინახა.' : 'Could not save the profile.')
      setSaving(false)
      return
    }
    await refreshProfile()
    router.replace('/(app)/(tabs)/plan')
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.wine} size="large" />
      </View>
    )

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text onPress={() => router.back()} style={styles.back}>
            ‹
          </Text>
          <Text onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')} style={styles.language}>
            {locale === 'ka' ? 'English' : 'ქართული'}
          </Text>
        </View>
        <Text style={styles.eyebrow}>01 · PROFILE</Text>
        <Title>
          {locale === 'ka' ? 'მოვარგოთ სუფრა შენს ცხოვრებას' : 'Let’s make Sufra fit your life'}
        </Title>
        <Text style={styles.lead}>
          {locale === 'ka'
            ? 'ალერგენები მკაცრი შეზღუდვაა; ფასი და მაკროები ყოველი გეგმისას მოწმდება.'
            : 'Allergens are hard constraints; pricing and nutrition are checked for every plan.'}
        </Text>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {locale === 'ka' ? 'ოჯახი და რიტმი' : 'Household and rhythm'}
          </Text>
          <Label>{locale === 'ka' ? 'სახელი' : 'Name'}</Label>
          <Field onChangeText={setDisplayName} value={displayName} />
          <View style={styles.gap} />
          <Label>{locale === 'ka' ? 'ქალაქი' : 'City'}</Label>
          <Field onChangeText={setCity} value={city} />
          <View style={styles.columns}>
            <View style={styles.column}>
              <Label>{locale === 'ka' ? 'ადამიანი' : 'People'}</Label>
              <Field
                keyboardType="number-pad"
                onChangeText={setHouseholdSize}
                value={householdSize}
              />
            </View>
            <View style={styles.column}>
              <Label>{locale === 'ka' ? 'კვება / დღე' : 'Meals / day'}</Label>
              <Field keyboardType="number-pad" onChangeText={setMealsPerDay} value={mealsPerDay} />
            </View>
          </View>
          <View style={styles.gap} />
          <Label>{locale === 'ka' ? 'მომზადების მაქს. დრო (წთ)' : 'Maximum cook time (min)'}</Label>
          <Field
            keyboardType="number-pad"
            onChangeText={setMaxCookMinutes}
            value={maxCookMinutes}
          />
          <Toggle
            label={locale === 'ka' ? 'ნარჩენების გამოყენება' : 'Use leftovers'}
            value={includeLeftovers}
            onValueChange={setIncludeLeftovers}
          />
          <Toggle
            label={locale === 'ka' ? 'რამდენიმე პორციის ერთად მომზადება' : 'Allow batch cooking'}
            value={allowBatchCooking}
            onValueChange={setAllowBatchCooking}
          />
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {locale === 'ka' ? 'მაღაზია და ბიუჯეტი' : 'Store and budget'}
          </Text>
          <View style={styles.chips}>
            {stores.map((store) => (
              <Chip
                key={store.id}
                label={choiceName(store, locale)}
                selected={preferredStoreId === store.id}
                onPress={() => setPreferredStoreId(store.id)}
              />
            ))}
          </View>
          <View style={styles.gap} />
          <Label>{locale === 'ka' ? 'ბიუჯეტი (₾)' : 'Budget (GEL)'}</Label>
          <Field keyboardType="decimal-pad" onChangeText={setBudget} value={budget} />
          <View style={styles.chips}>
            <Chip
              label={locale === 'ka' ? 'კვირეული' : 'Weekly'}
              selected={budgetPeriod === 'weekly'}
              onPress={() => setBudgetPeriod('weekly')}
            />
            <Chip
              label={locale === 'ka' ? 'დღიური' : 'Daily'}
              selected={budgetPeriod === 'daily'}
              onPress={() => setBudgetPeriod('daily')}
            />
          </View>
        </Card>

        <Card style={styles.section}>
          <Text style={styles.sectionTitle}>
            {locale === 'ka' ? 'კვების მიზნები' : 'Nutrition targets'}
          </Text>
          <Label>kcal / {locale === 'ka' ? 'დღე' : 'day'}</Label>
          <Field keyboardType="number-pad" onChangeText={setCalories} value={calories} />
          <View style={styles.columns}>
            <View style={styles.column}>
              <Label>{locale === 'ka' ? 'ცილა (გ)' : 'Protein (g)'}</Label>
              <Field keyboardType="decimal-pad" onChangeText={setProtein} value={protein} />
            </View>
            <View style={styles.column}>
              <Label>{locale === 'ka' ? 'ნახშირწყალი (გ)' : 'Carbs (g)'}</Label>
              <Field keyboardType="decimal-pad" onChangeText={setCarbs} value={carbs} />
            </View>
          </View>
          <View style={styles.columns}>
            <View style={styles.column}>
              <Label>{locale === 'ka' ? 'ცხიმი (გ)' : 'Fat (g)'}</Label>
              <Field keyboardType="decimal-pad" onChangeText={setFat} value={fat} />
            </View>
            <View style={styles.column}>
              <Label>{locale === 'ka' ? 'ბოჭკო (გ)' : 'Fibre (g)'}</Label>
              <Field keyboardType="decimal-pad" onChangeText={setFiber} value={fiber} />
            </View>
          </View>
        </Card>

        <ChoiceSection
          title={locale === 'ka' ? 'კვების სტილი' : 'Dietary pattern'}
          choices={diets}
          selected={dietIds}
          locale={locale}
          onToggle={(id) => setDietIds(toggleId(dietIds, id))}
        />
        <ChoiceSection
          title={locale === 'ka' ? 'ალერგენები — სრულად გამოირიცხოს' : 'Allergens — always exclude'}
          choices={allergens}
          selected={allergenIds}
          locale={locale}
          onToggle={(id) => setAllergenIds(toggleId(allergenIds, id))}
        />
        <ChoiceSection
          title={locale === 'ka' ? 'სამზარეულოს ტექნიკა' : 'Kitchen equipment'}
          choices={appliances}
          selected={applianceIds}
          locale={locale}
          onToggle={(id) => setApplianceIds(toggleId(applianceIds, id))}
        />

        {message ? <Text style={styles.message}>{message}</Text> : null}
        <PrimaryButton
          disabled={saving}
          onPress={save}
          title={locale === 'ka' ? 'შენახვა და გაგრძელება' : 'Save and continue'}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  )
}

function Toggle({
  label,
  value,
  onValueChange,
}: {
  label: string
  value: boolean
  onValueChange: (value: boolean) => void
}) {
  return (
    <View style={styles.toggle}>
      <Text style={styles.toggleText}>{label}</Text>
      <Switch
        onValueChange={onValueChange}
        value={value}
        trackColor={{ false: colors.paperDeep, true: colors.wine }}
      />
    </View>
  )
}

function ChoiceSection({
  title,
  choices,
  selected,
  locale,
  onToggle,
}: {
  title: string
  choices: Choice[]
  selected: number[]
  locale: Locale
  onToggle: (id: number) => void
}) {
  return (
    <Card style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.chips}>
        {choices.map((choice) => (
          <Chip
            key={choice.id}
            label={choiceName(choice, locale)}
            selected={selected.includes(choice.id)}
            onPress={() => onToggle(choice.id)}
          />
        ))}
      </View>
    </Card>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
  },
  content: { padding: 20, paddingBottom: 54 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  back: { color: colors.ink, fontSize: 36, paddingHorizontal: 6 },
  language: { color: colors.wine, fontSize: 14, fontWeight: '800', padding: 8 },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 14 },
  section: { marginTop: 18 },
  sectionTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 21,
    fontWeight: '800',
    marginBottom: 18,
  },
  gap: { height: 14 },
  columns: { flexDirection: 'row', gap: 10, marginTop: 14 },
  column: { flex: 1 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  chip: {
    backgroundColor: colors.paperDeep,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: colors.wine, borderColor: colors.wine },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: 'white' },
  toggle: {
    alignItems: 'center',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
  },
  toggleText: { color: colors.ink, flex: 1, fontSize: 13, fontWeight: '700', paddingRight: 10 },
  message: { color: colors.danger, fontSize: 13, lineHeight: 19, marginVertical: 16 },
})
