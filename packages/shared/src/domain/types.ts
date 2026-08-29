import type { BudgetPeriod, Locale, MealSlot, MeasurementUnit } from '../schemas/common.ts'
import type { MealMoodSlug } from '../schemas/profile.ts'

export interface MacroTotals {
  calories: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  fiberG: number
  sodiumMg: number
}

export interface IngredientConversion {
  ingredientId: number
  ingredientCode: string
  baseUnit: 'g' | 'ml' | 'piece'
  gramsPerBaseUnit: number | null
  densityGPerMl: number | null
}

export interface IngredientNutrition extends IngredientConversion {
  caloriesPer100g: number
  proteinGPer100g: number
  carbohydrateGPer100g: number
  fatGPer100g: number
  fiberGPer100g: number
  sodiumMgPer100g: number
  nutritionVerified: boolean
}

export interface IngredientRequirement {
  ingredient: IngredientConversion
  aisleId: number | null
  quantity: number
  unit: MeasurementUnit
  servingsScale?: number
}

export interface PantryAmount {
  ingredientId: number
  quantityGrams: number
}

export interface StorePackage {
  pricingId: number
  ingredientId: number
  packageQuantity: number
  packageUnit: MeasurementUnit
  equivalentGrams: number | null
  priceGel: number
}

export interface ConsolidatedGroceryItem {
  ingredientId: number
  aisleId: number | null
  selectedStorePricingId: number | null
  requiredQuantity: number
  requiredUnit: 'g'
  pantryDeductionQuantity: number
  purchaseQuantity: number
  purchaseUnit: MeasurementUnit
  estimatedCostGel: number | null
  packageCount: number | null
}

export interface NutritionTarget {
  calories: number
  proteinG: number | null
  carbohydrateG: number | null
  fatG: number | null
}

export interface HydratedMeal {
  dayIndex: number
  mealSlot: MealSlot
  slotPosition: number
  recipeId: string
  servings: number
  nutrition: MacroTotals
  estimatedCostGel: number | null
}

export interface PlanValidationInput {
  meals: HydratedMeal[]
  target: NutritionTarget
  requestedBudgetGel: number
  budgetPeriod: BudgetPeriod
  estimatedWeeklyCostGel: number | null
  calorieTolerance?: number
  macroTolerance?: number
}

export interface PlanValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  averageDailyNutrition: MacroTotals
}

export interface LocalizedText {
  ka: string
  en: string
}

export interface GenerationContext {
  locale: Locale
  weekStartDate: string
  householdSize: number
  mealsPerDay: number
  maxCookMinutes: number | null
  includeLeftovers: boolean
  allowBatchCooking: boolean
  requestedBudgetGel: number
  budgetPeriod: BudgetPeriod
  mealMoodSlug: MealMoodSlug
  nutritionTarget: NutritionTarget
  applianceSlugs: string[]
  allergenSlugs: string[]
  dietaryPatternSlugs: string[]
  lovedIngredientCodes: string[]
  dislikedIngredientCodes: string[]
  avoidedIngredientCodes: string[]
}

export interface CandidateRecipe {
  id: string
  title: LocalizedText
  description: LocalizedText
  servings: number
  prepMinutes: number
  cookMinutes: number
  nutritionPerServing: MacroTotals
  requiredApplianceSlugs: string[]
  ingredientCodes: string[]
  allergenSlugs: string[]
  dietaryPatternSlugs: string[]
  mealMoodSlugs: MealMoodSlug[]
}
