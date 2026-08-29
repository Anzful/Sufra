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
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Modal,
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
import { isMockMode } from '@/lib/data-mode'
import {
  generatePlanMock,
  getMockSnapshot,
  setMealServingsMock,
  swapMealMock,
} from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

interface PlanRow {
  id: string
  week_start_date: string
  summary_ka: string | null
  summary_en: string | null
  estimated_cost_gel: number | null
  average_daily_calories: number | null
  updated_at: string
  validation_warnings: string[]
}

interface MealRow {
  id: string
  day_index: number
  meal_slot: MealSlot
  calories: number
  protein_g: number
  carbohydrate_g: number
  fat_g: number
  servings: number
  alternative_recipe_ids?: string[]
  recipes: {
    id: string
    recipe_translations: Array<{ locale: Locale; title: string }>
  }
}

interface RecipeOption {
  id: string
  title: string
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
  const [recipeOptions, setRecipeOptions] = useState<RecipeOption[]>([])
  const [selectedMeal, setSelectedMeal] = useState<MealRow | null>(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [editing, setEditing] = useState(false)
  const [message, setMessage] = useState('')

  async function load() {
    setLoading(true)
    if (isMockMode()) {
      const snapshot = getMockSnapshot()
      if (!snapshot.plan) {
        setPlan(null)
        setMeals([])
        setLoading(false)
        return
      }
      const mockPlan = snapshot.plan
      const recipes = new Map(snapshot.recipes.map((recipe) => [recipe.id, recipe]))
      setPlan({
        id: mockPlan.id,
        week_start_date: mockPlan.weekStartDate,
        summary_ka: mockPlan.summary.ka,
        summary_en: mockPlan.summary.en,
        estimated_cost_gel: mockPlan.estimatedCostGel,
        average_daily_calories: mockPlan.averageDailyNutrition.calories,
        updated_at: new Date(0).toISOString(),
        validation_warnings: mockPlan.warnings,
      })
      setRecipeOptions(
        snapshot.recipes.map((recipe) => ({ id: recipe.id, title: recipe.title[locale] })),
      )
      setMeals(
        mockPlan.meals.map((meal) => {
          const recipe = recipes.get(meal.recipeId)
          return {
            id: meal.id,
            day_index: meal.dayIndex,
            meal_slot: meal.mealSlot,
            calories: meal.nutrition.calories,
            protein_g: meal.nutrition.proteinG,
            carbohydrate_g: meal.nutrition.carbohydrateG,
            fat_g: meal.nutrition.fatG,
            servings: meal.servings,
            alternative_recipe_ids: meal.alternativeRecipeIds,
            recipes: {
              id: meal.recipeId,
              recipe_translations: recipe
                ? [
                    { locale: 'ka' as const, title: recipe.title.ka },
                    { locale: 'en' as const, title: recipe.title.en },
                  ]
                : [],
            },
          }
        }),
      )
      setLoading(false)
      return
    }
    const planResult = await supabase
      .from('weekly_plans')
      .select(
        'id, week_start_date, summary_ka, summary_en, estimated_cost_gel, average_daily_calories, updated_at, validation_warnings',
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
    const [mealsResult, recipesResult] = await Promise.all([
      supabase
        .from('planned_meals')
        .select(
          'id, day_index, meal_slot, servings, calories, protein_g, carbohydrate_g, fat_g, recipes!inner(id, recipe_translations(locale, title))',
        )
        .eq('weekly_plan_id', planResult.data.id)
        .order('day_index')
        .order('slot_position'),
      supabase
        .from('recipes')
        .select('id, recipe_translations(locale, title)')
        .eq('status', 'published')
        .order('created_at'),
    ])
    setMeals((mealsResult.data ?? []) as unknown as MealRow[])
    setRecipeOptions(
      (recipesResult.data ?? []).map((recipe) => {
        const translations = recipe.recipe_translations as Array<{ locale: Locale; title: string }>
        return {
          id: String(recipe.id),
          title:
            translations.find((translation) => translation.locale === locale)?.title ??
            translations[0]?.title ??
            String(recipe.id),
        }
      }),
    )
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [locale]),
  )

  async function generate() {
    setGenerating(true)
    setMessage('')
    try {
      if (isMockMode()) generatePlanMock()
      else
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

  async function editMeal(input: { replacementRecipeId?: string; servings?: number }) {
    if (!plan || !selectedMeal) return
    setEditing(true)
    setMessage('')
    try {
      if (isMockMode()) {
        if (input.replacementRecipeId) swapMealMock(selectedMeal.id, input.replacementRecipeId)
        if (input.servings !== undefined) setMealServingsMock(selectedMeal.id, input.servings)
      } else {
        await createSufraApi(supabase as unknown as SufraTransport).updateWeeklyPlan({
          planId: plan.id,
          mealId: selectedMeal.id,
          expectedUpdatedAt: plan.updated_at,
          locale,
          ...input,
        })
      }
      setSelectedMeal(null)
      await load()
    } catch {
      setMessage(
        locale === 'ka'
          ? 'ცვლილება ვერ შეინახა. განაახლე გეგმა ან სხვა რეცეპტი სცადე.'
          : 'Could not save the edit. Refresh the plan or try another recipe.',
      )
    }
    setEditing(false)
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
            {plan.validation_warnings.length ? (
              <View style={styles.warning}>
                <Text style={styles.warningText}>
                  {locale === 'ka'
                    ? 'ზოგი ფასი, კვებითი მონაცემი ან მიზანი სავარაუდოა. ცვლილების შემდეგ გადაამოწმე კვირის ჯამები.'
                    : 'Some pricing, nutrition data, or targets are estimates. Review the weekly totals after an edit.'}
                </Text>
              </View>
            ) : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}
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
                      <View style={styles.mealActions}>
                        <Text style={styles.macro}>
                          {Math.round(Number(meal.calories))} kcal{`\n`}
                          {Math.round(Number(meal.protein_g))}P ·{' '}
                          {Math.round(Number(meal.carbohydrate_g))}C ·{' '}
                          {Math.round(Number(meal.fat_g))}F
                        </Text>
                        <Pressable
                          onPress={(event) => {
                            event.stopPropagation()
                            setMessage('')
                            setSelectedMeal(meal)
                          }}
                          style={styles.swap}
                        >
                          <Text style={styles.swapText}>{locale === 'ka' ? 'შეცვლა' : 'Edit'}</Text>
                        </Pressable>
                      </View>
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
      <Modal
        animationType="slide"
        onRequestClose={() => setSelectedMeal(null)}
        transparent
        visible={selectedMeal !== null}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>
                  {locale === 'ka' ? 'კერძის შეცვლა' : 'EDIT MEAL'}
                </Text>
                <Text style={styles.modalTitle}>
                  {selectedMeal ? recipeTitle(selectedMeal, locale) : ''}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedMeal(null)} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>×</Text>
              </Pressable>
            </View>

            {selectedMeal ? (
              <>
                <Text style={styles.modalLabel}>{locale === 'ka' ? 'ულუფები' : 'Servings'}</Text>
                <View style={styles.servingRow}>
                  <Pressable
                    disabled={editing || selectedMeal.servings <= 0.25}
                    onPress={() =>
                      editMeal({ servings: Math.max(0.25, selectedMeal.servings - 0.25) })
                    }
                    style={styles.servingButton}
                  >
                    <Text style={styles.servingButtonText}>−</Text>
                  </Pressable>
                  <Text style={styles.servingValue}>{selectedMeal.servings}</Text>
                  <Pressable
                    disabled={editing || selectedMeal.servings >= 100}
                    onPress={() =>
                      editMeal({ servings: Math.min(100, selectedMeal.servings + 0.25) })
                    }
                    style={styles.servingButton}
                  >
                    <Text style={styles.servingButtonText}>+</Text>
                  </Pressable>
                </View>

                <Text style={styles.modalLabel}>
                  {locale === 'ka' ? 'აირჩიე სხვა რეცეპტი' : 'Choose another recipe'}
                </Text>
                <ScrollView style={styles.recipeList}>
                  {recipeOptions
                    .filter(
                      (recipe) =>
                        recipe.id !== selectedMeal.recipes.id &&
                        (!isMockMode() || selectedMeal.alternative_recipe_ids?.includes(recipe.id)),
                    )
                    .map((recipe) => (
                      <Pressable
                        disabled={editing}
                        key={recipe.id}
                        onPress={() => editMeal({ replacementRecipeId: recipe.id })}
                        style={styles.recipeOption}
                      >
                        <Text style={styles.recipeOptionText}>{recipe.title}</Text>
                        <Text style={styles.recipeOptionArrow}>→</Text>
                      </Pressable>
                    ))}
                </ScrollView>
                {editing ? (
                  <ActivityIndicator color={colors.wine} style={{ marginTop: 12 }} />
                ) : null}
                {message ? <Text style={styles.message}>{message}</Text> : null}
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  warning: {
    backgroundColor: '#fff4d8',
    borderColor: '#ead69e',
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 18,
    padding: 13,
  },
  warningText: { color: '#715314', fontSize: 12, lineHeight: 18 },
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
  mealActions: { alignItems: 'flex-end' },
  mealSlot: {
    color: colors.leaf,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  mealTitle: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 20, marginTop: 3 },
  macro: { color: colors.muted, fontSize: 11, lineHeight: 17, textAlign: 'right' },
  swap: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 7,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  swapText: { color: colors.leaf, fontSize: 10, fontWeight: '900' },
  regenerate: { marginTop: 8 },
  modalBackdrop: {
    backgroundColor: 'rgba(34, 24, 20, 0.42)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '82%',
    padding: 22,
    paddingBottom: 36,
  },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 20 },
  modalTitle: { color: colors.ink, fontFamily: 'Georgia', fontSize: 23, fontWeight: '800' },
  modalClose: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  modalCloseText: { color: colors.ink, fontSize: 24, lineHeight: 25 },
  modalLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 9,
    marginTop: 12,
    textTransform: 'uppercase',
  },
  servingRow: { alignItems: 'center', flexDirection: 'row', gap: 16, marginBottom: 12 },
  servingButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    height: 42,
    justifyContent: 'center',
    width: 52,
  },
  servingButtonText: { color: colors.leaf, fontSize: 22, fontWeight: '800' },
  servingValue: { color: colors.ink, fontFamily: 'Georgia', fontSize: 22, fontWeight: '800' },
  recipeList: { maxHeight: 280 },
  recipeOption: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    padding: 14,
  },
  recipeOptionText: { color: colors.ink, flex: 1, fontSize: 14, fontWeight: '800' },
  recipeOptionArrow: { color: colors.leaf, fontSize: 17, fontWeight: '900' },
})
