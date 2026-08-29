import type { Locale, MeasurementUnit } from '@sufra/shared'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { supabase } from '@/lib/supabase'
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
        <ActivityIndicator color={colors.wine} />
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
        <Text onPress={() => router.back()} style={styles.back}>
          ‹ {locale === 'ka' ? 'უკან' : 'Back'}
        </Text>
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

        <Text style={styles.sectionTitle}>{locale === 'ka' ? 'ინგრედიენტები' : 'Ingredients'}</Text>
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

        <Text style={styles.sectionTitle}>{locale === 'ka' ? 'მომზადება' : 'Method'}</Text>
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
    color: colors.wine,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 30,
    paddingVertical: 8,
  },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
  },
  description: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 14 },
  metrics: { flexDirection: 'row', gap: 7, marginTop: 24 },
  metric: {
    alignItems: 'center',
    backgroundColor: colors.paperDeep,
    borderRadius: 16,
    flex: 1,
    paddingVertical: 12,
  },
  metricValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', marginTop: 3 },
  meta: { color: colors.leaf, fontSize: 13, fontWeight: '800', marginTop: 14 },
  sectionTitle: {
    color: colors.ink,
    fontFamily: 'Georgia',
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 12,
    marginTop: 32,
  },
  card: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    paddingHorizontal: 16,
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
  amount: { color: colors.muted, fontSize: 13, fontWeight: '800' },
  step: {
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 13,
    paddingVertical: 17,
  },
  stepNumber: {
    color: colors.wine,
    fontFamily: 'Georgia',
    fontSize: 22,
    fontWeight: '800',
    width: 26,
  },
  stepCopy: { flex: 1 },
  instruction: { color: colors.ink, fontSize: 14, lineHeight: 21 },
  stepMeta: { color: colors.leaf, fontSize: 11, fontWeight: '800', marginTop: 6 },
  tip: { backgroundColor: colors.paperDeep, borderRadius: 20, marginTop: 24, padding: 18 },
  tipTitle: { color: colors.wine, fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  tipText: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: 7 },
})
