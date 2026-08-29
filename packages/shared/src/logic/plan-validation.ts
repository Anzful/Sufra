import type { MacroTotals, PlanValidationInput, PlanValidationResult } from '../domain/types.ts'
import { ZERO_MACROS, sumNutrition } from './nutrition.ts'
import { roundQuantity } from './units.ts'

function relativeDifference(actual: number, target: number): number {
  if (target === 0) return actual === 0 ? 0 : Number.POSITIVE_INFINITY
  return Math.abs(actual - target) / target
}

function averageNutritionByDay(meals: PlanValidationInput['meals']): MacroTotals {
  const daily = Array.from({ length: 7 }, () => ({ ...ZERO_MACROS }))
  for (const meal of meals) {
    const current = daily[meal.dayIndex]
    if (!current) continue
    daily[meal.dayIndex] = sumNutrition([current, meal.nutrition])
  }
  const weekly = sumNutrition(daily)
  return {
    calories: roundQuantity(weekly.calories / 7, 2),
    proteinG: roundQuantity(weekly.proteinG / 7, 2),
    carbohydrateG: roundQuantity(weekly.carbohydrateG / 7, 2),
    fatG: roundQuantity(weekly.fatG / 7, 2),
    fiberG: roundQuantity(weekly.fiberG / 7, 2),
    sodiumMg: roundQuantity(weekly.sodiumMg / 7, 2),
  }
}

export function validateHydratedPlan(input: PlanValidationInput): PlanValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const calorieTolerance = input.calorieTolerance ?? 0.1
  const macroTolerance = input.macroTolerance ?? 0.15

  const dayIndexes = new Set(input.meals.map((meal) => meal.dayIndex))
  if (dayIndexes.size !== 7 || [...dayIndexes].some((index) => index < 0 || index > 6)) {
    errors.push('PLAN_MUST_CONTAIN_SEVEN_DAYS')
  }

  const average = averageNutritionByDay(input.meals)
  if (relativeDifference(average.calories, input.target.calories) > calorieTolerance) {
    errors.push('CALORIE_TARGET_OUT_OF_TOLERANCE')
  }

  const macroTargets: Array<[keyof MacroTotals, number | null, string]> = [
    ['proteinG', input.target.proteinG, 'PROTEIN_TARGET_OUT_OF_TOLERANCE'],
    ['carbohydrateG', input.target.carbohydrateG, 'CARBOHYDRATE_TARGET_OUT_OF_TOLERANCE'],
    ['fatG', input.target.fatG, 'FAT_TARGET_OUT_OF_TOLERANCE'],
  ]
  for (const [key, target, code] of macroTargets) {
    if (target !== null && relativeDifference(average[key], target) > macroTolerance) {
      warnings.push(code)
    }
  }

  if (input.estimatedWeeklyCostGel === null) {
    warnings.push('PRICE_COVERAGE_INCOMPLETE')
  } else {
    const weeklyBudget =
      input.budgetPeriod === 'daily' ? input.requestedBudgetGel * 7 : input.requestedBudgetGel
    if (input.estimatedWeeklyCostGel > weeklyBudget) {
      errors.push('BUDGET_EXCEEDED')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    averageDailyNutrition: average,
  }
}
