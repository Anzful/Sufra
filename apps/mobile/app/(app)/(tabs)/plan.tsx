import {
  formatDate,
  formatGel,
  formatMealSlot,
  createSufraApi,
  getWeekStartDate,
  type Locale,
  type MealSlot,
  type SufraTransport,
} from '@sufra/shared'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Card, PrimaryButton, Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

interface PlanRow {
  id: string
  week_start_date: string
  summary_ka: string | null
  summary_en: string | null
  estimated_cost_gel: number | null
  average_daily_calories: number | null
}

interface MealRow {
  id: string
  day_index: number
  meal_slot: MealSlot
  calories: number
  protein_g: number
  carbohydrate_g: number
  fat_g: number
  recipes: {
    id: string
    recipe_translations: Array<{ locale: Locale; title: string }>
  }
}

function recipeTitle(meal: MealRow, locale: Locale): string {
  return (
    meal.recipes.recipe_translations.find((row) => row.locale === locale)?.title ??
    meal.recipes.recipe_translations[0]?.title ??
    '—'
  )
}

function dateForDay(weekStart: string, dayIndex: number): string {
  const date = new Date(`${weekStart}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toISOString()
}

export default function PlanScreen() {
  const { locale, setLocale } = useLocale()
  const [plan, setPlan] = useState<PlanRow | null>(null)
  const [meals, setMeals] = useState<MealRow[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    const planResult = await supabase
      .from('weekly_plans')
      .select(
        'id, week_start_date, summary_ka, summary_en, estimated_cost_gel, average_daily_calories',
      )
      .eq('week_start_date', getWeekStartDate())
      .eq('is_current', true)
      .maybeSingle()
    if (!planResult.data) {
      setPlan(null)
      setMeals([])
      setLoading(false)
      return
    }
    setPlan(planResult.data as PlanRow)
    const mealsResult = await supabase
      .from('planned_meals')
      .select(
        'id, day_index, meal_slot, calories, protein_g, carbohydrate_g, fat_g, recipes!inner(id, recipe_translations(locale, title))',
      )
      .eq('weekly_plan_id', planResult.data.id)
      .order('day_index')
      .order('slot_position')
    setMeals((mealsResult.data ?? []) as unknown as MealRow[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function generate() {
    setGenerating(true)
    setMessage('')
    try {
      await createSufraApi(supabase as unknown as SufraTransport).generateWeeklyPlan({
        weekStartDate: getWeekStartDate(),
        locale,
        idempotencyKey: crypto.randomUUID(),
      })
      await load()
    } catch {
      setMessage(locale === 'ka' ? 'გეგმის შექმნა ვერ მოხერხდა.' : 'Could not generate the plan.')
    }
    setGenerating(false)
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.wine} size="large" />
      </View>
    )

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.wine} />
        }
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>სუფრა</Text>
            <Text style={styles.eyebrow}>SUFRA · 7 DAYS</Text>
          </View>
          <Pressable
            onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')}
            style={styles.language}
          >
            <Text style={styles.languageText}>{locale === 'ka' ? 'EN' : 'ქარ'}</Text>
          </Pressable>
        </View>

        {!plan ? (
          <View style={styles.empty}>
            <Text style={styles.eyebrow}>02 · {locale === 'ka' ? 'გეგმა' : 'PLAN'}</Text>
            <Title>
              {locale === 'ka' ? 'ამ კვირის სუფრა ჯერ ცარიელია.' : 'This week’s table is waiting.'}
            </Title>
            <Text style={styles.body}>
              {locale === 'ka'
                ? 'Sufra უსაფრთხო რეცეპტებს შეარჩევს და ფასებსა და მაკროებს გადაამოწმებს.'
                : 'Sufra will choose safe recipes, then verify pricing and nutrition.'}
            </Text>
            <Card style={styles.generateCard}>
              <PrimaryButton
                disabled={generating}
                onPress={generate}
                title={
                  generating
                    ? locale === 'ka'
                      ? 'სუფრა იგეგმება…'
                      : 'Planning…'
                    : locale === 'ka'
                      ? 'კვირის გეგმის შექმნა'
                      : 'Generate weekly plan'
                }
              />
              {message ? <Text style={styles.message}>{message}</Text> : null}
            </Card>
          </View>
        ) : (
          <>
            <Text style={styles.eyebrow}>
              02 · {locale === 'ka' ? 'კვირის გეგმა' : 'WEEKLY PLAN'}
            </Text>
            <Title>{locale === 'ka' ? 'ამ კვირის სუფრა' : 'This week’s table'}</Title>
            <Text style={styles.body}>
              {(locale === 'ka' ? plan.summary_ka : plan.summary_en) ?? ''}
            </Text>
            <View style={styles.metrics}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>
                  {locale === 'ka' ? 'სავარაუდო' : 'ESTIMATED'}
                </Text>
                <Text style={styles.metricValue}>
                  {plan.estimated_cost_gel === null
                    ? '—'
                    : formatGel(Number(plan.estimated_cost_gel), locale)}
                </Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>{locale === 'ka' ? 'დღიური' : 'DAILY'}</Text>
                <Text style={styles.metricValue}>
                  {Math.round(Number(plan.average_daily_calories))} kcal
                </Text>
              </View>
            </View>
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <View key={dayIndex} style={styles.day}>
                <Text style={styles.dayTitle}>
                  {formatDate(dateForDay(plan.week_start_date, dayIndex), locale)}
                </Text>
                {meals
                  .filter((meal) => meal.day_index === dayIndex)
                  .map((meal) => (
                    <Pressable
                      key={meal.id}
                      onPress={() =>
                        router.push({ pathname: '/recipe/[id]', params: { id: meal.recipes.id } })
                      }
                      style={({ pressed }) => [styles.meal, pressed && { opacity: 0.75 }]}
                    >
                      <View style={styles.mealCopy}>
                        <Text style={styles.mealSlot}>
                          {formatMealSlot(meal.meal_slot, locale)}
                        </Text>
                        <Text style={styles.mealTitle}>{recipeTitle(meal, locale)}</Text>
                      </View>
                      <Text style={styles.macro}>
                        {Math.round(Number(meal.calories))} kcal{`\n`}
                        {Math.round(Number(meal.protein_g))}P ·{' '}
                        {Math.round(Number(meal.carbohydrate_g))}C ·{' '}
                        {Math.round(Number(meal.fat_g))}F
                      </Text>
                    </Pressable>
                  ))}
              </View>
            ))}
            <View style={styles.regenerate}>
              <PrimaryButton
                disabled={generating}
                onPress={generate}
                title={locale === 'ka' ? 'ახალი ვერსიის შექმნა' : 'Generate a new version'}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
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
  content: { padding: 20, paddingBottom: 40 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 36,
  },
  brand: { color: colors.ink, fontFamily: 'Georgia', fontSize: 24, fontWeight: '800' },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  language: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 52,
  },
  languageText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  empty: { paddingTop: 28 },
  body: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 14 },
  generateCard: { marginTop: 28 },
  message: { color: colors.danger, fontSize: 13, marginTop: 12 },
  metrics: { flexDirection: 'row', gap: 10, marginVertical: 22 },
  metric: { backgroundColor: colors.paperDeep, borderRadius: 18, flex: 1, padding: 15 },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  metricValue: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 5,
  },
  day: { marginBottom: 22 },
  dayTitle: {
    color: colors.wine,
    fontFamily: 'Georgia',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  meal: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    marginBottom: 8,
    padding: 14,
  },
  mealCopy: { flex: 1, paddingRight: 10 },
  mealSlot: {
    color: colors.leaf,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mealTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 20, marginTop: 3 },
  macro: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'right' },
  regenerate: { marginTop: 8 },
})
