import { z } from 'zod'

export const localeSchema = z.enum(['ka', 'en'])
export const budgetPeriodSchema = z.enum(['daily', 'weekly'])
export const mealSlotSchema = z.enum(['breakfast', 'lunch', 'dinner', 'snack'])
export const measurementUnitSchema = z.enum([
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'cup',
  'piece',
  'pack',
])
export const ingredientPreferenceSchema = z.enum(['love', 'like', 'neutral', 'dislike', 'avoid'])

export type Locale = z.infer<typeof localeSchema>
export type BudgetPeriod = z.infer<typeof budgetPeriodSchema>
export type MealSlot = z.infer<typeof mealSlotSchema>
export type MeasurementUnit = z.infer<typeof measurementUnitSchema>
export type IngredientPreference = z.infer<typeof ingredientPreferenceSchema>
