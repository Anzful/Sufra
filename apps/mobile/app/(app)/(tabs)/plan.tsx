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
import { radius, space } from '@sufra/shared/design'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Title } from '@/components/title'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import {
  generatePlanMock,
  getMockSnapshot,
  setMealServingsMock,
  swapMealMock,
} from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { fontFamilyFor, shadow, typeStyle } from '@/lib/theme'
import { useLocale } from '@/providers/locale-provider'

const dashboardArtwork = require('../../../assets/images/carousel-old-tbilisi.jpg')
const breakfastArtwork = require('../../../assets/images/carousel-market.jpg')
const lunchArtwork = require('../../../assets/images/carousel-supra.jpg')
const dinnerArtwork = require('../../../assets/images/carousel-supra.jpg')

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

type ChartMetric = 'calories' | 'protein'

function recipeTitle(meal: MealRow, locale: Locale): string {
  return (
    meal.recipes.recipe_translations.find((row) => row.locale === locale)?.title ??
    meal.recipes.recipe_translations[0]?.title ??
    '·'
  )
}

function dateForDay(weekStart: string, dayIndex: number): string {
  const date = new Date(`${weekStart}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toISOString()
}

function chartValue(meal: MealRow, metric: ChartMetric): number {
  return metric === 'calories' ? Number(meal.calories) : Number(meal.protein_g)
}

function mealAccent(slot: MealSlot): string {
  if (slot === 'breakfast') return colors.emerald
  if (slot === 'lunch') return colors.gold
  return colors.inkSoft
}

function mealBackground(slot: MealSlot): string {
  if (slot === 'breakfast') return colors.mintSoft
  if (slot === 'lunch') return colors.limeSoft
  return colors.aquaSoft
}

function mealArtwork(slot: MealSlot) {
  if (slot === 'breakfast') return breakfastArtwork
  if (slot === 'lunch') return lunchArtwork
  return dinnerArtwork
}

function shortDayLabel(value: string, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === 'ka' ? 'ka-GE' : 'en-US', {
    weekday: 'narrow',
    timeZone: 'UTC',
  }).format(new Date(value))
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
  const [selectedDay, setSelectedDay] = useState(0)
  const [chartMetric, setChartMetric] = useState<ChartMetric>('calories')

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

  const weekDays = plan
    ? Array.from({ length: 7 }, (_, dayIndex) => {
        const date = dateForDay(plan.week_start_date, dayIndex)
        const dayMeals = meals.filter((meal) => meal.day_index === dayIndex)
        return {
          date,
          dayIndex,
          meals: dayMeals,
          value: dayMeals.reduce((total, meal) => total + chartValue(meal, chartMetric), 0),
        }
      })
    : []
  const selectedDayData = weekDays[selectedDay] ?? weekDays[0]
  const chartMax = Math.max(1, ...weekDays.map((day) => day.value))
  const chartAverage = weekDays.length
    ? Math.round(weekDays.reduce((total, day) => total + day.value, 0) / weekDays.length)
    : 0

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.wine} />
        }
      >
        <View style={styles.masthead}>
          <View style={styles.brandLockup}>
            <View style={styles.brandMark}>
              <Ionicons color={colors.emeraldDark} name="restaurant-outline" size={21} />
            </View>
            <Text style={styles.brand}>სუფრა</Text>
          </View>
          <Pressable
            accessibilityLabel={locale === 'ka' ? 'Switch to English' : 'ქართულზე გადართვა'}
            accessibilityRole="button"
            onPress={() => setLocale(locale === 'ka' ? 'en' : 'ka')}
            style={({ pressed }) => [styles.language, pressed && styles.pressed]}
          >
            <Text style={styles.languageText}>
              <Text style={locale === 'ka' ? styles.languageActive : styles.languageInactive}>
                ქარ
              </Text>
              <Text style={styles.languageSlash}> / </Text>
              <Text style={locale === 'en' ? styles.languageActive : styles.languageInactive}>
                EN
              </Text>
            </Text>
          </Pressable>
        </View>

        {!plan ? (
          <View style={styles.emptyCard}>
            <Text style={[styles.emptyKicker, locale === 'ka' && styles.georgianLabel]}>
              {locale === 'ka' ? 'ახალი კვირა' : 'NEW WEEK'}
            </Text>
            <Title animated style={styles.emptyTitle} tone="inverted">
              {locale === 'ka' ? 'ამ კვირის სუფრა ჯერ ცარიელია' : 'This week’s table is waiting'}
            </Title>
            <Text style={styles.emptyBody}>
              {locale === 'ka'
                ? 'შენი ბიუჯეტის, მარაგისა და კვებითი მიზნების მიხედვით შევადგენთ სრულ შვიდდღიან გეგმას.'
                : 'Build a complete seven-day plan around your budget, pantry, and nutrition targets.'}
            </Text>
            <Pressable
              accessibilityRole="button"
              disabled={generating}
              onPress={generate}
              style={({ pressed }) => [
                styles.emptyAction,
                pressed && styles.pressed,
                generating && styles.disabled,
              ]}
            >
              {generating ? (
                <ActivityIndicator color={colors.ink} />
              ) : (
                <>
                  <Text style={styles.emptyActionText}>
                    {locale === 'ka' ? 'კვირის გეგმის შექმნა' : 'Build weekly plan'}
                  </Text>
                  <Ionicons color={colors.ink} name="arrow-forward" size={20} />
                </>
              )}
            </Pressable>
            {message ? <Text style={styles.emptyMessage}>{message}</Text> : null}
          </View>
        ) : (
          <>
            <View style={styles.dashboardHero}>
              <ImageBackground
                accessibilityIgnoresInvertColors
                imageStyle={styles.dashboardHeroImage}
                resizeMode="cover"
                source={dashboardArtwork}
                style={styles.dashboardHeroArtwork}
              >
                <LinearGradient
                  colors={['rgba(6,68,52,0.96)', 'rgba(6,68,52,0.7)', 'rgba(6,68,52,0.08)']}
                  end={{ x: 1, y: 0.5 }}
                  locations={[0, 0.47, 1]}
                  start={{ x: 0, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.dashboardHeroCopy}>
                  <Text
                    style={[styles.dashboardHeroEyebrow, locale === 'ka' && styles.georgianLabel]}
                  >
                    {locale === 'ka' ? 'კვირის გეგმა' : 'WEEKLY PLAN'}
                  </Text>
                  <Text style={styles.dashboardHeroDate}>
                    {formatDate(weekDays[0]?.date ?? plan.week_start_date, locale)} ·{' '}
                    {formatDate(weekDays[6]?.date ?? dateForDay(plan.week_start_date, 6), locale)}
                  </Text>
                  <Title animated level="h2" style={styles.dashboardHeroTitle} tone="inverted">
                    {locale === 'ka' ? 'გემრიელი კვირა იწყება აქ' : 'A delicious week starts here'}
                  </Title>
                </View>
                <View style={styles.dashboardHeroIcon}>
                  <Ionicons color={colors.white} name="arrow-forward" size={20} />
                </View>
              </ImageBackground>
            </View>

            <View style={styles.overviewCard}>
              <View style={styles.overviewTop}>
                <View>
                  <Text style={[styles.overviewLabel, locale === 'ka' && styles.georgianLabel]}>
                    {locale === 'ka' ? 'კვირის სავარაუდო ფასი' : 'ESTIMATED WEEK'}
                  </Text>
                  <Text style={styles.overviewPrice}>
                    {plan.estimated_cost_gel === null
                      ? '·'
                      : formatGel(Number(plan.estimated_cost_gel), locale)}
                  </Text>
                </View>
                <View style={styles.overviewArrow}>
                  <Ionicons color={colors.emeraldDark} name="basket-outline" size={21} />
                </View>
              </View>
              <View style={styles.overviewMeta}>
                <Text style={styles.overviewRange}>
                  {locale === 'ka' ? '7 დღე' : '7 days'} · {meals.length}{' '}
                  {locale === 'ka' ? 'კერძი' : 'meals'}
                </Text>
                <Text style={styles.overviewCalories}>
                  {plan.average_daily_calories === null
                    ? '·'
                    : Math.round(Number(plan.average_daily_calories))}{' '}
                  kcal
                </Text>
              </View>
            </View>

            {plan.validation_warnings.length ? (
              <View style={styles.warning}>
                <View style={styles.warningDot} />
                <Text style={styles.warningText}>
                  {plan.validation_warnings.includes('BUDGET_EXCEEDED')
                    ? locale === 'ka'
                      ? 'ამ მოთხოვნებით ხელმისაწვდომი დემო რეცეპტები ბიუჯეტში ვერ ეტევა. ნაჩვენებია ბიუჯეტზე ორიენტირებული შესაბამისი გეგმა; შეცვალე ბიუჯეტი ან მოთხოვნები.'
                      : 'No eligible combination of the available demo recipes fits this budget. This is a budget-conscious matching plan; adjust the budget or preferences.'
                    : locale === 'ka'
                      ? 'ზოგი ფასი, კვებითი მონაცემი ან მიზანი სავარაუდოა. ცვლილების შემდეგ გადაამოწმე კვირის ჯამები.'
                      : 'Some pricing, nutrition data, or targets are estimates. Review the weekly totals after an edit.'}
                </Text>
              </View>
            ) : null}
            {message ? <Text style={styles.message}>{message}</Text> : null}

            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <View>
                  <Text style={[styles.sectionKicker, locale === 'ka' && styles.georgianLabel]}>
                    {locale === 'ka' ? 'კვირის რიტმი' : 'WEEKLY RHYTHM'}
                  </Text>
                  <Text style={styles.chartTitle}>
                    {chartAverage} {chartMetric === 'calories' ? 'kcal' : 'g'}
                  </Text>
                </View>
                <View style={styles.chartToggle}>
                  {(['calories', 'protein'] as const).map((metric) => (
                    <Pressable
                      accessibilityRole="button"
                      key={metric}
                      onPress={() => setChartMetric(metric)}
                      style={[
                        styles.chartToggleButton,
                        chartMetric === metric && styles.chartToggleButtonActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.chartToggleText,
                          chartMetric === metric && styles.chartToggleTextActive,
                          locale === 'ka' && styles.georgianLabel,
                        ]}
                      >
                        {metric === 'calories'
                          ? locale === 'ka'
                            ? 'კკალ'
                            : 'KCAL'
                          : locale === 'ka'
                            ? 'ცილა'
                            : 'PROTEIN'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.chart}>
                {weekDays.map((day) => (
                  <Pressable
                    accessibilityLabel={formatDate(day.date, locale)}
                    accessibilityRole="button"
                    key={day.dayIndex}
                    onPress={() => setSelectedDay(day.dayIndex)}
                    style={styles.chartColumn}
                  >
                    <View
                      style={[
                        styles.chartTrack,
                        selectedDay === day.dayIndex && styles.chartTrackSelected,
                      ]}
                    >
                      {day.meals.map((meal) => (
                        <View
                          key={meal.id}
                          style={[
                            styles.chartSegment,
                            {
                              backgroundColor: mealAccent(meal.meal_slot),
                              height: Math.max(7, (chartValue(meal, chartMetric) / chartMax) * 96),
                            },
                          ]}
                        />
                      ))}
                    </View>
                    <Text
                      style={[
                        styles.chartDay,
                        selectedDay === day.dayIndex && styles.chartDaySelected,
                      ]}
                    >
                      {shortDayLabel(day.date, locale)}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {selectedDayData ? (
              <View style={styles.daySection}>
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={[styles.sectionKicker, locale === 'ka' && styles.georgianLabel]}>
                      {locale === 'ka' ? 'დღის მენიუ' : 'DAY MENU'}
                    </Text>
                    <Title level="h2" style={styles.dayTitle}>
                      {formatDate(selectedDayData.date, locale)}
                    </Title>
                  </View>
                  <Text style={styles.dayCount}>
                    {selectedDayData.meals.length} {locale === 'ka' ? 'კერძი' : 'meals'}
                  </Text>
                </View>

                {selectedDayData.meals.map((meal) => (
                  <LinearGradient
                    colors={[colors.white, mealBackground(meal.meal_slot)]}
                    end={{ x: 1, y: 0.5 }}
                    key={meal.id}
                    start={{ x: 0.42, y: 0.5 }}
                    style={styles.meal}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.push({ pathname: '/recipe/[id]', params: { id: meal.recipes.id } })
                      }
                      style={({ pressed }) => [styles.mealPressable, pressed && styles.pressed]}
                    >
                      <Image
                        accessibilityIgnoresInvertColors
                        resizeMode="cover"
                        source={mealArtwork(meal.meal_slot)}
                        style={styles.mealImage}
                      />
                      <View style={styles.mealCopy}>
                        <Text
                          style={[
                            styles.mealSlot,
                            { color: mealAccent(meal.meal_slot) },
                            locale === 'ka' && styles.georgianLabel,
                          ]}
                        >
                          {formatMealSlot(meal.meal_slot, locale)}
                        </Text>
                        <Text numberOfLines={1} style={styles.mealTitle}>
                          {recipeTitle(meal, locale)}
                        </Text>
                        <View style={styles.mealMeta}>
                          <Ionicons color={colors.muted} name="flame-outline" size={13} />
                          <Text style={styles.macro}>
                            {Math.round(Number(meal.calories))} kcal · {meal.servings}{' '}
                            {locale === 'ka' ? 'ულუფა' : 'servings'}
                          </Text>
                        </View>
                      </View>
                      <Pressable
                        accessibilityLabel={locale === 'ka' ? 'კერძის შეცვლა' : 'Edit meal'}
                        accessibilityRole="button"
                        onPress={(event) => {
                          event.stopPropagation()
                          setMessage('')
                          setSelectedMeal(meal)
                        }}
                        style={({ pressed }) => [styles.swap, pressed && styles.pressed]}
                      >
                        <Ionicons
                          color={colors.emeraldDark}
                          name="swap-horizontal-outline"
                          size={17}
                        />
                      </Pressable>
                    </Pressable>
                  </LinearGradient>
                ))}
              </View>
            ) : null}

            <Pressable
              accessibilityRole="button"
              disabled={generating}
              onPress={generate}
              style={({ pressed }) => [
                styles.regenerate,
                pressed && styles.pressed,
                generating && styles.disabled,
              ]}
            >
              {generating ? (
                <ActivityIndicator color={colors.paper} />
              ) : (
                <>
                  <Text style={styles.regenerateText}>
                    {locale === 'ka' ? 'ახალი ვერსიის შექმნა' : 'Generate a new version'}
                  </Text>
                  <Ionicons color={colors.white} name="refresh-outline" size={20} />
                </>
              )}
            </Pressable>
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
                <Text style={[styles.eyebrow, locale === 'ka' && styles.georgianLabel]}>
                  {locale === 'ka' ? 'კერძის შეცვლა' : 'EDIT MEAL'}
                </Text>
                <Title level="h2" style={styles.modalTitle}>
                  {selectedMeal ? recipeTitle(selectedMeal, locale) : ''}
                </Title>
              </View>
              <Pressable
                accessibilityLabel={locale === 'ka' ? 'დახურვა' : 'Close'}
                accessibilityRole="button"
                onPress={() => setSelectedMeal(null)}
                style={styles.modalClose}
              >
                <Ionicons color={colors.ink} name="close" size={22} />
              </Pressable>
            </View>

            {selectedMeal ? (
              <>
                <Text style={[styles.modalLabel, locale === 'ka' && styles.georgianLabel]}>
                  {locale === 'ka' ? 'ულუფები' : 'Servings'}
                </Text>
                <View style={styles.servingRow}>
                  <Pressable
                    accessibilityLabel={locale === 'ka' ? 'ულუფების შემცირება' : 'Fewer servings'}
                    accessibilityRole="button"
                    disabled={editing || selectedMeal.servings <= 0.25}
                    onPress={() =>
                      editMeal({ servings: Math.max(0.25, selectedMeal.servings - 0.25) })
                    }
                    style={styles.servingButton}
                  >
                    <Ionicons color={colors.leaf} name="remove" size={20} />
                  </Pressable>
                  <Text style={styles.servingValue}>{selectedMeal.servings}</Text>
                  <Pressable
                    accessibilityLabel={locale === 'ka' ? 'ულუფების გაზრდა' : 'More servings'}
                    accessibilityRole="button"
                    disabled={editing || selectedMeal.servings >= 100}
                    onPress={() =>
                      editMeal({ servings: Math.min(100, selectedMeal.servings + 0.25) })
                    }
                    style={styles.servingButton}
                  >
                    <Ionicons color={colors.leaf} name="add" size={20} />
                  </Pressable>
                </View>

                <Text style={[styles.modalLabel, locale === 'ka' && styles.georgianLabel]}>
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
                        <Ionicons color={colors.leaf} name="chevron-forward" size={17} />
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
  content: { paddingBottom: space[7], paddingHorizontal: 20, paddingTop: 17 },
  masthead: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  brandLockup: { alignItems: 'center', flexDirection: 'row', gap: 9 },
  brandMark: {
    alignItems: 'center',
    borderColor: colors.emeraldDark,
    borderRadius: 11,
    borderWidth: 1.5,
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  brand: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('serif', 600),
    fontSize: 21,
    lineHeight: 28,
  },
  eyebrow: {
    color: colors.wine,
    ...typeStyle('label'),
    marginBottom: space[2],
  },
  georgianLabel: { letterSpacing: 0 },
  language: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 12,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  languageText: {
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 10,
  },
  languageActive: { color: colors.emeraldDark },
  languageInactive: { color: colors.mutedLight },
  languageSlash: { color: colors.lineStrong },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  disabled: { opacity: 0.62 },
  emptyCard: {
    backgroundColor: colors.emeraldBlack,
    borderRadius: 24,
    marginTop: space[4],
    padding: space[5],
    ...shadow(2),
  },
  emptyKicker: { color: colors.mint, ...typeStyle('label') },
  emptyTitle: {
    ...typeStyle('displayL'),
    marginTop: space[5],
  },
  emptyBody: {
    color: 'rgba(255,255,255,0.68)',
    ...typeStyle('bodyM'),
    marginTop: space[3],
  },
  emptyAction: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.pill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: space[6],
    minHeight: 56,
    paddingHorizontal: space[5],
  },
  emptyActionText: { color: colors.ink, ...typeStyle('titleM') },
  emptyMessage: { color: colors.dangerSoft, ...typeStyle('caption'), marginTop: space[3] },
  dashboardHero: {
    borderRadius: 20,
    height: 218,
    marginBottom: 14,
    overflow: 'hidden',
    ...shadow(2),
  },
  dashboardHeroImage: { transform: [{ scale: 1.04 }] },
  dashboardHeroArtwork: { flex: 1, justifyContent: 'center', padding: 18 },
  dashboardHeroIcon: {
    alignItems: 'center',
    backgroundColor: 'rgba(8,45,35,0.66)',
    borderColor: 'rgba(255,255,255,0.82)',
    borderRadius: radius.pill,
    borderWidth: 1,
    bottom: 16,
    height: 42,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 42,
  },
  dashboardHeroCopy: { gap: 4, maxWidth: '63%' },
  dashboardHeroEyebrow: {
    color: 'rgba(255,255,255,0.84)',
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 10,
  },
  dashboardHeroDate: {
    color: colors.lime,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 10,
  },
  dashboardHeroTitle: {
    fontSize: 27,
    letterSpacing: -0.45,
    lineHeight: 35,
    marginTop: 14,
  },
  overviewCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    padding: 16,
    ...shadow(1),
  },
  overviewTop: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewLabel: { color: colors.inkSoft, ...typeStyle('label') },
  overviewPrice: {
    color: colors.emeraldDark,
    ...typeStyle('numericXl'),
    fontFamily: fontFamilyFor('serif', 600),
    fontSize: 30,
    marginTop: 3,
  },
  overviewArrow: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 42,
  },
  overviewMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 9,
  },
  overviewRange: {
    color: colors.muted,
    ...typeStyle('caption'),
  },
  overviewCalories: { color: colors.emerald, ...typeStyle('caption') },
  warning: {
    alignItems: 'flex-start',
    backgroundColor: colors.warningSoft,
    borderRadius: 16,
    flexDirection: 'row',
    gap: space[3],
    marginBottom: space[4],
    padding: space[4],
  },
  warningDot: {
    backgroundColor: colors.warning,
    borderRadius: radius.pill,
    height: 7,
    marginTop: 6,
    width: 7,
  },
  warningText: { color: colors.warning, flex: 1, ...typeStyle('caption') },
  message: { color: colors.danger, ...typeStyle('caption'), marginBottom: space[4] },
  chartCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 22,
    paddingHorizontal: 16,
    paddingVertical: 16,
    ...shadow(1),
  },
  chartHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionKicker: { color: colors.muted, ...typeStyle('label') },
  chartTitle: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 24,
    lineHeight: 30,
    marginTop: 2,
  },
  chartToggle: {
    backgroundColor: colors.paperDeep,
    borderRadius: radius.pill,
    flexDirection: 'row',
    padding: 3,
  },
  chartToggleButton: {
    alignItems: 'center',
    borderRadius: radius.pill,
    justifyContent: 'center',
    minHeight: 32,
    paddingHorizontal: 11,
  },
  chartToggleButtonActive: { backgroundColor: colors.ink },
  chartToggleText: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 8,
    letterSpacing: 0.5,
  },
  chartToggleTextActive: { color: colors.white },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'space-between',
    marginTop: 15,
  },
  chartColumn: { alignItems: 'center', flex: 1 },
  chartTrack: {
    backgroundColor: colors.paperDeep,
    borderRadius: 11,
    height: 94,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    padding: 3,
    width: 26,
  },
  chartTrackSelected: { backgroundColor: colors.lineStrong },
  chartSegment: { borderRadius: 7, marginTop: 2, width: '100%' },
  chartDay: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 10,
    marginTop: 7,
  },
  chartDaySelected: { color: colors.ink },
  daySection: { marginBottom: space[5] },
  dayHeader: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[4],
  },
  dayTitle: {
    marginTop: 2,
  },
  dayCount: { color: colors.muted, ...typeStyle('caption'), marginBottom: 3 },
  meal: {
    borderColor: colors.line,
    borderRadius: 17,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  mealPressable: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 82,
    paddingRight: 11,
  },
  mealImage: { height: 82, width: 112 },
  mealCopy: { flex: 1, paddingHorizontal: 12, paddingVertical: 9 },
  mealSlot: {
    ...typeStyle('label'),
  },
  mealTitle: {
    color: colors.ink,
    ...typeStyle('titleM'),
    marginTop: 3,
  },
  mealMeta: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  macro: { color: colors.muted, fontFamily: fontFamilyFor('sans', 400), fontSize: 9 },
  swap: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.76)',
    borderColor: colors.line,
    borderRadius: radius.pill,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  regenerate: {
    alignItems: 'center',
    backgroundColor: colors.ink,
    borderRadius: radius.pill,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 56,
    paddingHorizontal: space[5],
  },
  regenerateText: { color: colors.white, ...typeStyle('titleM') },
  modalBackdrop: {
    backgroundColor: 'rgba(8,45,35,0.48)',
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '82%',
    padding: space[5],
    paddingBottom: space[7],
  },
  modalHeader: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: space[5] },
  modalTitle: {
    flex: 1,
  },
  modalClose: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  modalLabel: {
    color: colors.muted,
    ...typeStyle('label'),
    marginBottom: space[2],
    marginTop: space[3],
  },
  servingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: space[4],
    marginBottom: space[3],
  },
  servingButton: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    height: 42,
    justifyContent: 'center',
    width: 52,
  },
  servingValue: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 22,
  },
  recipeList: { maxHeight: 280 },
  recipeOption: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: space[2],
    padding: space[4],
  },
  recipeOptionText: { color: colors.ink, flex: 1, ...typeStyle('bodyS') },
})
