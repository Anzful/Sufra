import { describe, expect, it } from 'vitest'

import type { HydratedMeal } from '../domain/types'
import { validateHydratedPlan } from './plan-validation'

const meals: HydratedMeal[] = Array.from({ length: 7 }, (_, dayIndex) => ({
  dayIndex,
  mealSlot: 'dinner',
  slotPosition: 1,
  recipeId: crypto.randomUUID(),
  servings: 1,
  nutrition: {
    calories: 2_000,
    proteinG: 120,
    carbohydrateG: 220,
    fatG: 70,
    fiberG: 30,
    sodiumMg: 1_500,
  },
  estimatedCostGel: 10,
}))

describe('validateHydratedPlan', () => {
  it('accepts a complete plan inside hard tolerances', () => {
    const result = validateHydratedPlan({
      meals,
      target: { calories: 2_000, proteinG: 120, carbohydrateG: 220, fatG: 70 },
      requestedBudgetGel: 100,
      budgetPeriod: 'weekly',
      estimatedWeeklyCostGel: 70,
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual([])
  })

  it('rejects an over-budget plan', () => {
    const result = validateHydratedPlan({
      meals,
      target: { calories: 2_000, proteinG: null, carbohydrateG: null, fatG: null },
      requestedBudgetGel: 50,
      budgetPeriod: 'weekly',
      estimatedWeeklyCostGel: 70,
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('BUDGET_EXCEEDED')
  })
})
