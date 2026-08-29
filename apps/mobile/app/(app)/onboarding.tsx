import {
  createSufraApi,
  getWeekStartDate,
  kitchenEquipmentCategory,
  mealMoodOptions,
  profileInputSchema,
  type Locale,
  type MealMoodSlug,
  type SufraTransport,
} from '@sufra/shared'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Card, Field, PrimaryButton, Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { generatePlanMock, getMockSnapshot, saveProfileMock } from '@/lib/mock-store'
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

const allowedDietSlugs = new Set(['omnivore', 'vegetarian', 'vegan', 'pescatarian'])

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
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [stores, setStores] = useState<Choice[]>([])
  const [appliances, setAppliances] = useState<Choice[]>([])
  const [diets, setDiets] = useState<Choice[]>([])
  const [displayName, setDisplayName] = useState('')
  const [city, setCity] = useState('Tbilisi')
  const [preferredStoreId, setPreferredStoreId] = useState(0)
  const [householdSize, setHouseholdSize] = useState(1)
  const [budget, setBudget] = useState('150')
  const [mealMoodSlug, setMealMoodSlug] = useState<MealMoodSlug>('healthy-comfort')
  const [dietId, setDietId] = useState(0)
  const [applianceIds, setApplianceIds] = useState<number[]>([])
  const [allergenIds, setAllergenIds] = useState<number[]>([])
  const [calories, setCalories] = useState('2000')
  const [protein, setProtein] = useState('120')
  const [carbs, setCarbs] = useState('220')
  const [fat, setFat] = useState('70')
  const [fiber, setFiber] = useState('30')
  const [maxCookMinutes] = useState('120')

  useEffect(() => {
    if (!session) return
    void (async () => {
      if (isMockMode()) {
        const snapshot = getMockSnapshot()
        const row = snapshot.profile
        const supportedDiets = snapshot.dietaryPatterns.filter((diet) =>
          allowedDietSlugs.has(diet.slug),
        )
        setStores(snapshot.stores)
        setAppliances(snapshot.appliances)
        setDiets(supportedDiets)
        setApplianceIds(row.applianceIds)
        setAllergenIds(row.allergenIds)
        setDietId(
          supportedDiets.find((diet) => row.dietaryPatternIds.includes(diet.id))?.id ??
            supportedDiets.find((diet) => diet.slug === 'omnivore')?.id ??
            0,
        )
        setDisplayName(row.displayName ?? '')
        setCity(row.city)
        setPreferredStoreId(row.preferredStoreId)
        setHouseholdSize(row.householdSize)
        setBudget(String(row.budgetAmountGel))
        setMealMoodSlug(row.mealMoodSlug)
        setCalories(String(row.dailyCalorieTarget))
        setProtein(String(row.proteinTargetG ?? ''))
        setCarbs(String(row.carbohydrateTargetG ?? ''))
        setFat(String(row.fatTargetG ?? ''))
        setFiber(String(row.fiberTargetG ?? ''))
        setLocale(row.locale)
        setLoading(false)
        return
      }

      const userId = session.user.id
      const [
        profile,
        storeRows,
        applianceRows,
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
          .from('dietary_patterns')
          .select('id, slug, translations:dietary_pattern_translations(locale, name)')
          .in('slug', ['omnivore', 'vegetarian', 'vegan', 'pescatarian'])
          .eq('is_active', true)
          .order('id'),
        supabase.from('profile_appliances').select('appliance_id').eq('user_id', userId),
        supabase.from('profile_allergens').select('allergen_id').eq('user_id', userId),
        supabase
          .from('profile_dietary_patterns')
          .select('dietary_pattern_id')
          .eq('user_id', userId),
      ])
      const supportedDiets = (dietRows.data ?? []) as unknown as Choice[]
      const selectedDietIds = (selectedDiets.data ?? []).map((row) => row.dietary_pattern_id)
      setStores((storeRows.data ?? []) as unknown as Choice[])
      setAppliances((applianceRows.data ?? []) as unknown as Choice[])
      setDiets(supportedDiets)
      setApplianceIds((selectedAppliances.data ?? []).map((row) => row.appliance_id))
      setAllergenIds((selectedAllergens.data ?? []).map((row) => row.allergen_id))
      setDietId(
        supportedDiets.find((diet) => selectedDietIds.includes(diet.id))?.id ??
          supportedDiets.find((diet) => diet.slug === 'omnivore')?.id ??
          0,
      )
      if (profile.data) {
        const row = profile.data
        setDisplayName(row.display_name ?? '')
        setCity(row.city ?? 'Tbilisi')
        setPreferredStoreId(row.preferred_store_id ?? 0)
        setHouseholdSize(row.household_size ?? 1)
        setBudget(String(row.budget_amount_gel ?? 150))
        const parsedMood = mealMoodOptions.find((option) => option.slug === row.meal_mood_slug)
        setMealMoodSlug(parsedMood?.slug ?? 'healthy-comfort')
        setCalories(String(row.daily_calorie_target ?? 2000))
        setProtein(String(row.protein_target_g ?? 120))
        setCarbs(String(row.carbohydrate_target_g ?? 220))
        setFat(String(row.fat_target_g ?? 70))
        setFiber(String(row.fiber_target_g ?? 30))
        if (row.locale === 'ka' || row.locale === 'en') setLocale(row.locale)
      }
      setLoading(false)
    })()
  }, [session])

  const copy =
    locale === 'ka'
      ? {
          questions: [
            ['აირჩიე მაღაზია', 'რომელი ქართული სუპერმარკეტის ფასებით დავგეგმოთ?'],
            [
              'რამდენი ადამიანისთვის ამზადებ?',
              'ყველა პორციასა და საყიდლების რაოდენობას ამას მოვარგებთ.',
            ],
            ['რა არის შენი კვირის ბიუჯეტი?', 'მიუთითე მთელი კვირის ზედა ზღვარი ლარში.'],
            ['რის ხასიათზე ხარ?', 'ეს არჩევანი განსაზღვრავს კვირის გემოსა და სტილს.'],
            ['გაქვს კვების განსაკუთრებული რეჟიმი?', 'ერთი ვარიანტი აირჩიე.'],
            [
              'რა მოსამზადებელი ტექნიკა და ინვენტარი გაქვს სახლში?',
              'მონიშნე ყველაფერი, რითაც კერძის მომზადება ან პროდუქტების დამუშავება შეგიძლია.',
            ],
          ],
          next: 'შემდეგი',
          back: 'უკან',
          none: 'არაფერი',
          people: 'ადამიანი',
          weekly: '₾ კვირაში',
          choose: 'აირჩიე ერთი ვარიანტი.',
          chooseAppliance: 'აირჩიე მინიმუმ ერთი ტექნიკა ან ინვენტარი.',
          cookingEquipment: 'მოსამზადებელი ტექნიკა',
          preparationEquipment: 'პროდუქტების დასამუშავებელი ინვენტარი',
          build: 'ჩემი კვირის გეგმის შექმნა',
          building: 'შენი კვირა იგეგმება…',
          invalid: 'გადაამოწმე პასუხები და ხელახლა სცადე.',
          failed: 'გეგმა ვერ შეიქმნა. ხელახლა სცადე.',
        }
      : {
          questions: [
            ['Choose your shop', 'Which Georgian supermarket should we use for price estimates?'],
            [
              'How many are you cooking for?',
              'We will scale every serving and grocery quantity to this number.',
            ],
            ["What's your weekly budget?", 'Set the spending ceiling for the whole week in GEL.'],
            ['What are you in the mood for?', 'This shapes the flavour and style of your week.'],
            ['Any dietary needs?', 'Choose one option.'],
            [
              'What cooking and prep equipment do you have at home?',
              'Select everything you can use to cook meals or prepare ingredients.',
            ],
          ],
          next: 'Next',
          back: 'Back',
          none: 'None',
          people: 'people',
          weekly: 'GEL per week',
          choose: 'Choose one option.',
          chooseAppliance: 'Choose at least one piece of kitchen equipment.',
          cookingEquipment: 'Cooking equipment',
          preparationEquipment: 'Preparation equipment',
          build: 'Build my weekly plan',
          building: 'Building your week…',
          invalid: 'Review your answers and try again.',
          failed: 'Could not build the plan. Please try again.',
        }

  const equipmentGroups = [
    {
      key: 'cooking',
      title: copy.cookingEquipment,
      items: appliances.filter((item) => kitchenEquipmentCategory(item.slug) === 'cooking'),
    },
    {
      key: 'preparation',
      title: copy.preparationEquipment,
      items: appliances.filter((item) => kitchenEquipmentCategory(item.slug) === 'preparation'),
    },
  ]

  const validStep =
    (step === 0 && preferredStoreId > 0) ||
    (step === 1 && householdSize >= 1 && householdSize <= 20) ||
    (step === 2 && Number(budget) > 0) ||
    (step === 3 && Boolean(mealMoodSlug)) ||
    (step === 4 && dietId > 0) ||
    (step === 5 && applianceIds.length > 0)

  function next() {
    if (!validStep) {
      setMessage(step === 5 ? copy.chooseAppliance : copy.choose)
      return
    }
    setMessage('')
    setStep((current) => Math.min(5, current + 1))
  }

  async function saveAndGenerate() {
    const parsed = profileInputSchema.safeParse({
      displayName: displayName.trim() || null,
      locale,
      timezone: 'Asia/Tbilisi',
      city: city.trim() || 'Tbilisi',
      preferredStoreId,
      householdSize,
      budgetPeriod: 'weekly',
      budgetAmountGel: Number(budget),
      mealMoodSlug,
      dailyCalorieTarget: Number(calories),
      proteinTargetG: nullableNumber(protein),
      carbohydrateTargetG: nullableNumber(carbs),
      fatTargetG: nullableNumber(fat),
      fiberTargetG: nullableNumber(fiber),
      mealsPerDay: 3,
      maxCookMinutes: mealMoodSlug === 'speedy-meals' ? 30 : nullableNumber(maxCookMinutes),
      includeLeftovers: true,
      allowBatchCooking: true,
      applianceIds,
      allergenIds,
      dietaryPatternIds: [dietId],
    })
    if (!parsed.success) {
      setMessage(copy.invalid)
      return
    }
    setSaving(true)
    setMessage('')
    try {
      if (isMockMode()) {
        saveProfileMock(parsed.data)
        generatePlanMock()
      } else {
        const api = createSufraApi(supabase as unknown as SufraTransport)
        await api.saveProfile(parsed.data)
        await api.generateWeeklyPlan({
          weekStartDate: getWeekStartDate(),
          locale,
          idempotencyKey: crypto.randomUUID(),
        })
      }
      await refreshProfile()
      router.replace('/(app)/(tabs)/plan')
    } catch {
      setMessage(copy.failed)
      setSaving(false)
    }
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.wine} size="large" />
      </View>
    )

  const [title, description] = copy.questions[step]!

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable
            onPress={() => (step > 0 ? setStep((value) => value - 1) : router.back())}
            style={styles.headerButton}
          >
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <Pressable
            onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')}
            style={styles.headerButton}
          >
            <Text style={styles.language}>{locale === 'ka' ? 'English' : 'ქართული'}</Text>
          </Pressable>
        </View>

        <Text style={styles.eyebrow}>01 · {locale === 'ka' ? 'შენი გეგმა' : 'YOUR PLAN'}</Text>
        <Title>
          {locale === 'ka' ? 'ექვსი პასუხი — მთელი კვირა' : 'Six answers, one complete week'}
        </Title>
        <Text style={styles.lead}>
          {locale === 'ka'
            ? 'ბოლოს სუფრა მაშინვე შექმნის კერძებს, რეცეპტებსა და საყიდლების სიას.'
            : 'At the end, Sufra immediately builds your meals, recipes, and grocery list.'}
        </Text>

        <View style={styles.progress}>
          {copy.questions.map((_, index) => (
            <View
              key={index}
              style={[styles.progressSegment, index <= step && styles.progressSegmentActive]}
            />
          ))}
        </View>

        <Card style={styles.questionCard}>
          <Text style={styles.stepCount}>{step + 1} / 6</Text>
          <Text style={styles.questionTitle}>{title}</Text>
          <Text style={styles.questionDescription}>{description}</Text>

          {step === 0 ? (
            <View style={styles.choices}>
              {stores.map((store) => (
                <Chip
                  key={store.id}
                  label={choiceName(store, locale)}
                  onPress={() => {
                    setPreferredStoreId(store.id)
                    setMessage('')
                  }}
                  selected={preferredStoreId === store.id}
                />
              ))}
            </View>
          ) : null}

          {step === 1 ? (
            <View style={styles.counter}>
              <CounterButton
                label="−"
                onPress={() => setHouseholdSize((value) => Math.max(1, value - 1))}
              />
              <View style={styles.counterValueWrap}>
                <Text style={styles.counterValue}>{householdSize}</Text>
                <Text style={styles.counterLabel}>{copy.people}</Text>
              </View>
              <CounterButton
                label="+"
                onPress={() => setHouseholdSize((value) => Math.min(20, value + 1))}
              />
            </View>
          ) : null}

          {step === 2 ? (
            <View style={styles.budgetWrap}>
              <Text style={styles.currency}>₾</Text>
              <Field
                keyboardType="decimal-pad"
                onChangeText={setBudget}
                style={styles.budgetField}
                value={budget}
              />
              <Text style={styles.budgetLabel}>{copy.weekly}</Text>
            </View>
          ) : null}

          {step === 3 ? (
            <View style={styles.optionList}>
              {mealMoodOptions.map((option) => (
                <OptionCard
                  description={option.description[locale]}
                  key={option.slug}
                  onPress={() => {
                    setMealMoodSlug(option.slug)
                    setMessage('')
                  }}
                  selected={mealMoodSlug === option.slug}
                  title={option.title[locale]}
                />
              ))}
            </View>
          ) : null}

          {step === 4 ? (
            <View style={styles.optionList}>
              {diets.map((diet) => (
                <OptionCard
                  key={diet.id}
                  onPress={() => {
                    setDietId(diet.id)
                    setMessage('')
                  }}
                  selected={dietId === diet.id}
                  title={diet.slug === 'omnivore' ? copy.none : choiceName(diet, locale)}
                />
              ))}
            </View>
          ) : null}

          {step === 5 ? (
            <View style={styles.equipmentGroups}>
              {equipmentGroups.map((group) => (
                <View key={group.key}>
                  <Text style={styles.equipmentGroupTitle}>{group.title}</Text>
                  <View style={styles.equipmentChoices}>
                    {group.items.map((item) => (
                      <Chip
                        key={item.id}
                        label={choiceName(item, locale)}
                        onPress={() => {
                          setApplianceIds(toggleId(applianceIds, item.id))
                          setMessage('')
                        }}
                        selected={applianceIds.includes(item.id)}
                      />
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {message ? <Text style={styles.message}>{message}</Text> : null}
        </Card>

        <View style={styles.actions}>
          {step > 0 ? (
            <Pressable
              onPress={() => {
                setMessage('')
                setStep((value) => Math.max(0, value - 1))
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>← {copy.back}</Text>
            </Pressable>
          ) : (
            <View />
          )}
          <View style={styles.primaryAction}>
            <PrimaryButton
              disabled={saving}
              onPress={step === 5 ? saveAndGenerate : next}
              title={step === 5 ? (saving ? copy.building : copy.build) : `${copy.next} →`}
            />
          </View>
        </View>
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

function OptionCard({
  title,
  description,
  selected,
  onPress,
}: {
  title: string
  description?: string
  selected: boolean
  onPress: () => void
}) {
  return (
    <Pressable onPress={onPress} style={[styles.option, selected && styles.optionSelected]}>
      <Text style={[styles.optionTitle, selected && styles.optionTextSelected]}>{title}</Text>
      {description ? (
        <Text style={[styles.optionDescription, selected && styles.optionDescriptionSelected]}>
          {description}
        </Text>
      ) : null}
    </Pressable>
  )
}

function CounterButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.counterButton}>
      <Text style={styles.counterButtonText}>{label}</Text>
    </Pressable>
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
    marginBottom: 20,
  },
  headerButton: { minHeight: 40, justifyContent: 'center', paddingHorizontal: 6 },
  back: { color: colors.ink, fontSize: 36, lineHeight: 38 },
  language: { color: colors.wine, fontSize: 14, fontWeight: '800' },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 12 },
  progress: { flexDirection: 'row', gap: 6, marginTop: 24 },
  progressSegment: { backgroundColor: colors.line, borderRadius: 999, flex: 1, height: 5 },
  progressSegmentActive: { backgroundColor: colors.wine },
  questionCard: { marginTop: 16, minHeight: 410 },
  stepCount: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  questionTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 33,
    marginTop: 10,
  },
  questionDescription: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 8 },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, marginTop: 22 },
  equipmentGroups: { gap: 22, marginTop: 22 },
  equipmentGroupTitle: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  equipmentChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  chip: {
    backgroundColor: colors.paperDeep,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  chipSelected: { backgroundColor: colors.wine, borderColor: colors.wine },
  chipText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  chipTextSelected: { color: 'white' },
  optionList: { gap: 10, marginTop: 22 },
  option: {
    backgroundColor: colors.paperDeep,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    padding: 15,
  },
  optionSelected: { backgroundColor: colors.wine, borderColor: colors.wine },
  optionTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  optionDescription: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 4 },
  optionTextSelected: { color: 'white' },
  optionDescriptionSelected: { color: 'rgba(255,255,255,0.76)' },
  counter: {
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 18,
    marginTop: 54,
  },
  counterButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    height: 54,
    justifyContent: 'center',
    width: 54,
  },
  counterButtonText: { color: colors.wine, fontSize: 28, fontWeight: '900' },
  counterValueWrap: { alignItems: 'center', minWidth: 90 },
  counterValue: { color: colors.ink, fontFamily: 'Georgia', fontSize: 48, fontWeight: '800' },
  counterLabel: { color: colors.muted, fontSize: 13, fontWeight: '700', marginTop: 2 },
  budgetWrap: { alignSelf: 'center', marginTop: 52, minWidth: 220, position: 'relative' },
  currency: {
    color: colors.wine,
    fontSize: 26,
    fontWeight: '900',
    left: 16,
    position: 'absolute',
    top: 12,
    zIndex: 1,
  },
  budgetField: { fontSize: 25, fontWeight: '900', paddingLeft: 48, textAlign: 'center' },
  budgetLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    marginTop: 9,
    textAlign: 'center',
  },
  message: { color: colors.danger, fontSize: 13, fontWeight: '700', lineHeight: 19, marginTop: 18 },
  actions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
    marginTop: 18,
  },
  secondaryButton: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  primaryAction: { flexShrink: 1, minWidth: 150 },
})
