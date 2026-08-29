import type { AiWeeklyPlan } from '../../../packages/shared/src/schemas/meal-plan.ts'
import type {
  HydratedMeal,
  IngredientRequirement,
} from '../../../packages/shared/src/domain/types.ts'
import {
  consolidateGroceryList,
  groceryListEstimatedTotal,
} from '../../../packages/shared/src/logic/grocery-consolidation.ts'
import { scaleNutrition } from '../../../packages/shared/src/logic/nutrition.ts'
import { validateHydratedPlan } from '../../../packages/shared/src/logic/plan-validation.ts'
import type { GenerationData } from './generation-data.ts'
import { ingredientRequirementsForRecipe } from './generation-data.ts'

export interface PersistedPlanPayload {
  weekStartDate: string
  locale: 'ka' | 'en'
  summaryKa: string
  summaryEn: string
  preferredStoreId: number
  requestedBudgetGel: number
  estimatedCostGel: number | null
  target: GenerationData['context']['nutritionTarget']
  average: ReturnType<typeof validateHydratedPlan>['averageDailyNutrition']
  generationVersion: string
  meals: Array<HydratedMeal & { nutrition: HydratedMeal['nutrition'] }>
  grocery: {
    estimatedTotalGel: number | null
    items: Array<ReturnType<typeof consolidateGroceryList>[number] & { sortOrder: number }>
  }
  warnings: string[]
}

export function hydrateAndValidatePlan(
  plan: AiWeeklyPlan,
  data: GenerationData,
): {
  payload: PersistedPlanPayload | null
  errors: string[]
  warnings: string[]
} {
  const meals: HydratedMeal[] = []
  const requirements: IngredientRequirement[] = []
  const usedIngredientIds = new Set<number>()

  for (const day of plan.days) {
    if (day.meals.length !== data.context.mealsPerDay) {
      return {
        payload: null,
        errors: ['MEALS_PER_DAY_MISMATCH'],
        warnings: [],
      }
    }
    for (const selection of day.meals) {
      const recipe = data.recipesById.get(selection.recipeId)
      if (!recipe || !data.candidates.some((candidate) => candidate.id === selection.recipeId)) {
        return {
          payload: null,
          errors: ['UNAVAILABLE_RECIPE_SELECTED'],
          warnings: [],
        }
      }

      const candidate = data.candidates.find((item) => item.id === selection.recipeId)!
      const perPersonScale = selection.servings / data.context.householdSize
      meals.push({
        dayIndex: day.dayIndex,
        mealSlot: selection.mealSlot,
        slotPosition: selection.slotPosition,
        recipeId: selection.recipeId,
        servings: selection.servings,
        nutrition: scaleNutrition(candidate.nutritionPerServing, perPersonScale),
        estimatedCostGel: null,
      })
      const recipeRequirements = ingredientRequirementsForRecipe(recipe, selection.servings)
      recipeRequirements.forEach((requirement) =>
        usedIngredientIds.add(requirement.ingredient.ingredientId),
      )
      requirements.push(...recipeRequirements)
    }
  }

  const groceryItems = consolidateGroceryList(requirements, data.pantry, data.storePackages)
  const estimatedTotal = groceryListEstimatedTotal(groceryItems)
  const validation = validateHydratedPlan({
    meals,
    target: data.context.nutritionTarget,
    requestedBudgetGel: data.context.requestedBudgetGel,
    budgetPeriod: data.context.budgetPeriod,
    estimatedWeeklyCostGel: estimatedTotal,
  })
  const warnings = [...validation.warnings]
  if (
    [...usedIngredientIds].some((ingredientId) => data.unverifiedIngredientIds.has(ingredientId))
  ) {
    warnings.push('NUTRITION_DATA_UNVERIFIED')
  }

  return {
    errors: validation.errors,
    warnings: [...new Set(warnings)],
    payload: {
      weekStartDate: data.context.weekStartDate,
      locale: data.context.locale,
      summaryKa: plan.summaryKa,
      summaryEn: plan.summaryEn,
      preferredStoreId: data.preferredStoreId,
      requestedBudgetGel: data.context.requestedBudgetGel,
      estimatedCostGel: estimatedTotal,
      target: data.context.nutritionTarget,
      average: validation.averageDailyNutrition,
      generationVersion: 'v1',
      meals,
      grocery: {
        estimatedTotalGel: estimatedTotal,
        items: groceryItems.map((item, index) => ({ ...item, sortOrder: index })),
      },
      warnings: [...new Set(warnings)],
    },
  }
}
