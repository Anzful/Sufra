import type { Locale, MeasurementUnit } from '@sufra/shared'
import Ionicons from '@expo/vector-icons/Ionicons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { fontFamilyFor, shadow, typeStyle } from '@/lib/theme'
import { useLocale } from '@/providers/locale-provider'

interface Translation {
  locale: Locale
  title?: string
  description?: string | null
  tips?: string | null
  name?: string
  instruction?: string
  preparation_note?: string | null
}

interface Recipe {
  id: string
  base_servings: number
  prep_minutes: number
  cook_minutes: number
  calories_per_serving: number
  protein_g_per_serving: number
  carbohydrate_g_per_serving: number
  fat_g_per_serving: number
  recipe_translations: Translation[]
  recipe_ingredients: Array<{
    id: number
    position: number
    quantity: number
    unit: MeasurementUnit
    is_optional: boolean
    ingredients: { ingredient_translations: Translation[] }
    recipe_ingredient_translations: Translation[]
  }>
  recipe_steps: Array<{
    id: number
    step_number: number
    duration_minutes: number | null
    temperature_celsius: number | null
    recipe_step_translations: Translation[]
  }>
}

function localized(rows: Translation[], locale: Locale): Translation | undefined {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === 'en')
}

export default function RecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { locale } = useLocale()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isMockMode()) {
      const value = getMockSnapshot().recipes.find((item) => item.id === id)
      if (!value) {
        setRecipe(null)
        setLoading(false)
        return
      }
      setRecipe({
        id: value.id,
        base_servings: value.baseServings,
        prep_minutes: value.prepMinutes,
        cook_minutes: value.cookMinutes,
        calories_per_serving: value.nutritionPerServing.calories,
        protein_g_per_serving: value.nutritionPerServing.proteinG,
        carbohydrate_g_per_serving: value.nutritionPerServing.carbohydrateG,
        fat_g_per_serving: value.nutritionPerServing.fatG,
        recipe_translations: [
          {
            locale: 'ka',
            title: value.title.ka,
            description: value.description.ka,
            tips: value.tips.ka,
          },
          {
            locale: 'en',
            title: value.title.en,
            description: value.description.en,
            tips: value.tips.en,
          },
        ],
        recipe_ingredients: value.ingredients.map((ingredient, index) => ({
          id: index + 1,
          position: index + 1,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          is_optional: ingredient.optional ?? false,
          ingredients: {
            ingredient_translations: [
              { locale: 'ka', name: ingredient.name.ka },
              { locale: 'en', name: ingredient.name.en },
            ],
          },
          recipe_ingredient_translations: ingredient.preparationNote
            ? [
                { locale: 'ka', preparation_note: ingredient.preparationNote.ka },
                { locale: 'en', preparation_note: ingredient.preparationNote.en },
              ]
            : [],
        })),
        recipe_steps: value.steps.map((step) => ({
          id: step.stepNumber,
          step_number: step.stepNumber,
          duration_minutes: step.durationMinutes ?? null,
          temperature_celsius: step.temperatureCelsius ?? null,
          recipe_step_translations: [
            { locale: 'ka', instruction: step.instruction.ka },
            { locale: 'en', instruction: step.instruction.en },
          ],
        })),
      })
      setLoading(false)
      return
    }
    void supabase
      .from('recipes')
      .select(
        `id, base_servings, prep_minutes, cook_minutes, calories_per_serving,
         protein_g_per_serving, carbohydrate_g_per_serving, fat_g_per_serving,
         recipe_translations(locale, title, description, tips),
         recipe_ingredients(
           id, position, quantity, unit, is_optional,
           ingredients(ingredient_translations(locale, name)),
           recipe_ingredient_translations(locale, preparation_note)
         ),
         recipe_steps(
           id, step_number, duration_minutes, temperature_celsius,
           recipe_step_translations(locale, instruction)
         )`,
      )
      .eq('id', id)
      .single()
      .then((result) => {
        setRecipe((result.data as unknown as Recipe | null) ?? null)
        setLoading(false)
      })
  }, [id])

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    )
  if (!recipe)
    return (
      <View style={styles.loading}>
        <Text>{locale === 'ka' ? 'რეცეპტი ვერ მოიძებნა.' : 'Recipe not found.'}</Text>
      </View>
    )

  const text = localized(recipe.recipe_translations, locale)
  const ingredients = [...recipe.recipe_ingredients].sort((a, b) => a.position - b.position)
  const steps = [...recipe.recipe_steps].sort((a, b) => a.step_number - b.step_number)

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()} style={styles.back}>
          <Ionicons color={colors.emerald} name="arrow-back" size={18} />
          <Text style={styles.backText}>{locale === 'ka' ? 'უკან' : 'Back'}</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{locale === 'ka' ? 'რეცეპტი' : 'RECIPE'}</Text>
        <Title>{text?.title ?? recipe.id}</Title>
        {text?.description ? <Text style={styles.description}>{text.description}</Text> : null}
        <View style={styles.metrics}>
          <Metric label="kcal" value={Math.round(Number(recipe.calories_per_serving))} />
          <Metric label="P" value={`${Math.round(Number(recipe.protein_g_per_serving))}g`} />
          <Metric label="C" value={`${Math.round(Number(recipe.carbohydrate_g_per_serving))}g`} />
          <Metric label="F" value={`${Math.round(Number(recipe.fat_g_per_serving))}g`} />
        </View>
        <Text style={styles.meta}>
          {recipe.prep_minutes + recipe.cook_minutes} min · {recipe.base_servings}{' '}
          {locale === 'ka' ? 'პორცია' : 'servings'}
        </Text>

        <Title level="h2" style={styles.sectionTitle}>
          {locale === 'ka' ? 'ინგრედიენტები' : 'Ingredients'}
        </Title>
        <View style={styles.card}>
          {ingredients.map((ingredient) => {
            const note = localized(
              ingredient.recipe_ingredient_translations,
              locale,
            )?.preparation_note
            return (
              <View key={ingredient.id} style={styles.ingredient}>
                <Text style={styles.ingredientName}>
                  {localized(ingredient.ingredients.ingredient_translations, locale)?.name}
                  {ingredient.is_optional
                    ? ` (${locale === 'ka' ? 'სურვილისამებრ' : 'optional'})`
                    : ''}
                  {note ? `, ${note}` : ''}
                </Text>
                <Text style={styles.amount}>
                  {Number(ingredient.quantity)} {ingredient.unit}
                </Text>
              </View>
            )
          })}
        </View>

        <Title level="h2" style={styles.sectionTitle}>
          {locale === 'ka' ? 'მომზადება' : 'Method'}
        </Title>
        <View style={styles.card}>
          {steps.map((step) => (
            <View key={step.id} style={styles.step}>
              <Text style={styles.stepNumber}>{step.step_number}</Text>
              <View style={styles.stepCopy}>
                <Text style={styles.instruction}>
                  {localized(step.recipe_step_translations, locale)?.instruction}
                </Text>
                {step.duration_minutes || step.temperature_celsius ? (
                  <Text style={styles.stepMeta}>
                    {step.duration_minutes ? `${step.duration_minutes} min` : ''}
                    {step.duration_minutes && step.temperature_celsius ? ' · ' : ''}
                    {step.temperature_celsius ? `${step.temperature_celsius}°C` : ''}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
        {text?.tips ? (
          <View style={styles.tip}>
            <Text style={styles.tipTitle}>{locale === 'ka' ? 'რჩევა' : 'Tip'}</Text>
            <Text style={styles.tipText}>{text.tips}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
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
  content: { padding: 20, paddingBottom: 52 },
  back: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 7,
    marginBottom: 30,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  backText: { color: colors.emerald, fontFamily: fontFamilyFor('sans', 600), fontSize: 12 },
  eyebrow: {
    color: colors.emerald,
    ...typeStyle('label'),
    letterSpacing: 1.1,
    marginBottom: 10,
  },
  description: { color: colors.muted, ...typeStyle('bodyS'), lineHeight: 23, marginTop: 14 },
  metrics: { flexDirection: 'row', gap: 7, marginTop: 24 },
  metric: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderRadius: 18,
    flex: 1,
    paddingVertical: 12,
  },
  metricValue: { color: colors.ink, fontFamily: fontFamilyFor('sans', 600), fontSize: 16 },
  metricLabel: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 9,
    marginTop: 3,
  },
  meta: {
    color: colors.emerald,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 12,
    marginTop: 14,
  },
  sectionTitle: {
    marginBottom: 12,
    marginTop: 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
    ...shadow(1),
  },
  ingredient: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 14,
  },
  ingredientName: { color: colors.ink, flex: 1, fontSize: 14, lineHeight: 20 },
  amount: { color: colors.muted, fontFamily: fontFamilyFor('sans', 600), fontSize: 12 },
  step: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 17,
  },
  stepNumber: {
    color: colors.emerald,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 22,
    width: 26,
  },
  stepCopy: { flex: 1 },
  instruction: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  stepMeta: { color: colors.leaf, fontSize: 11, fontWeight: '800', marginTop: 6 },
  tip: { backgroundColor: colors.limeSoft, borderRadius: 20, marginTop: 24, padding: 18 },
  tipTitle: {
    color: colors.emerald,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 11,
    letterSpacing: 1,
  },
  tipText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
})
