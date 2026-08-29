import type { ProfileInput } from '../schemas/profile.ts'
import type { MealMoodSlug } from '../schemas/profile.ts'
import type { Locale, MealSlot, MeasurementUnit } from '../schemas/common.ts'
import type { LocalizedText, MacroTotals } from '../domain/types.ts'

export interface MockChoice {
  id: number
  slug: string
  translations: Array<{ locale: Locale; name: string }>
}

export interface MockRecipeIngredient {
  id: string
  name: LocalizedText
  quantity: number
  unit: MeasurementUnit
  optional?: boolean
  preparationNote?: LocalizedText
}

export interface MockRecipeStep {
  stepNumber: number
  instruction: LocalizedText
  durationMinutes?: number
  temperatureCelsius?: number
}

export interface MockRecipe {
  id: string
  title: LocalizedText
  description: LocalizedText
  tips: LocalizedText
  baseServings: number
  prepMinutes: number
  cookMinutes: number
  nutritionPerServing: MacroTotals
  applianceSlugs: string[]
  dietaryPatternSlugs: string[]
  mealMoodSlugs: MealMoodSlug[]
  ingredients: MockRecipeIngredient[]
  steps: MockRecipeStep[]
}

export interface MockPlannedMeal {
  id: string
  dayIndex: number
  mealSlot: MealSlot
  slotPosition: number
  servings: number
  recipeId: string
  nutrition: MacroTotals
  estimatedCostGel: number
  alternativeRecipeIds: string[]
}

export interface MockWeeklyPlan {
  id: string
  weekStartDate: string
  summary: LocalizedText
  estimatedCostGel: number
  averageDailyNutrition: MacroTotals
  meals: MockPlannedMeal[]
  warnings: string[]
}

export interface MockGroceryItem {
  id: string
  ingredientId: string
  name: LocalizedText
  aisle: LocalizedText
  purchaseQuantity: number
  purchaseUnit: MeasurementUnit
  requiredQuantityGrams: number
  pantryDeductionGrams: number
  estimatedCostGel: number
  priceObservation: {
    observedAt: string
    validTo: string | null
    source: 'manual' | 'retailer' | 'government' | 'partner'
    sourceUrl: string | null
    isPromotion: boolean
    regularPriceGel: number | null
    productName: LocalizedText
  }
  checked: boolean
}

export interface MockIngredientChoice {
  id: string
  name: LocalizedText
}

export interface MockPantryEntry {
  id: string
  ingredientId: string
  quantityGrams: number
  expiresOn: string | null
}

export interface MockPantryItem extends MockPantryEntry {
  name: LocalizedText
}

export interface MockGroceryList {
  id: string
  estimatedTotalGel: number
  store: LocalizedText
  items: MockGroceryItem[]
}

export interface MockSession {
  user: { id: string; email: string }
}

/** The small user-editable overlay persisted by web cookies or device storage. */
export interface MockPersistedState {
  session: MockSession | null
  onboardingComplete: boolean
  profile: ProfileInput
  planReady: boolean
  planRevision: number
  checkedGroceryItemIds: string[]
  pantryItems: MockPantryEntry[]
  mealRecipeOverrides: Record<string, string>
  mealServingOverrides: Record<string, number>
}

export interface MockSufraSnapshot {
  session: MockSession | null
  onboardingComplete: boolean
  profile: ProfileInput
  stores: MockChoice[]
  appliances: MockChoice[]
  allergens: MockChoice[]
  dietaryPatterns: MockChoice[]
  ingredients: MockIngredientChoice[]
  pantryItems: MockPantryItem[]
  recipes: MockRecipe[]
  plan: MockWeeklyPlan | null
  groceryList: MockGroceryList | null
}
