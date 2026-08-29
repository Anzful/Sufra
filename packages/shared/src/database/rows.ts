import type { BudgetPeriod, Locale, MealSlot, MeasurementUnit } from '../schemas/common.ts'

export interface ProfileRow {
  user_id: string
  display_name: string | null
  locale: Locale
  timezone: string
  city: string
  preferred_store_id: number | null
  household_size: number
  budget_period: BudgetPeriod
  budget_amount_gel: number | null
  daily_calorie_target: number | null
  protein_target_g: number | null
  carbohydrate_target_g: number | null
  fat_target_g: number | null
  fiber_target_g: number | null
  meals_per_day: number
  max_cook_minutes: number | null
  include_leftovers: boolean
  allow_batch_cooking: boolean
  onboarding_completed_at: string | null
}

export interface WeeklyPlanRow {
  id: string
  user_id: string
  week_start_date: string
  status: 'generating' | 'ready' | 'failed' | 'archived'
  locale: Locale
  estimated_cost_gel: number | null
  average_daily_calories: number | null
  is_current: boolean
}

export interface PlannedMealRow {
  id: string
  weekly_plan_id: string
  day_index: number
  meal_slot: MealSlot
  slot_position: number
  recipe_id: string
  servings: number
  calories: number
  protein_g: number
  carbohydrate_g: number
  fat_g: number
  estimated_cost_gel: number | null
}

export interface GroceryListItemRow {
  id: string
  grocery_list_id: string
  ingredient_id: number
  aisle_id: number | null
  required_quantity: number
  required_unit: MeasurementUnit
  purchase_quantity: number
  purchase_unit: MeasurementUnit
  estimated_cost_gel: number | null
  is_checked: boolean
  user_note: string | null
}
