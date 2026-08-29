import { describe, expect, it } from 'vitest'

import { planEditRequestSchema } from './meal-plan.ts'

const edit = {
  planId: '20000000-0000-4000-8000-000000000001',
  mealId: '21000000-0000-4000-8000-000000000001',
  expectedUpdatedAt: '2026-08-30T08:00:00+04:00',
  locale: 'ka' as const,
}

describe('planEditRequestSchema', () => {
  it('accepts recipe swaps and serving changes', () => {
    expect(
      planEditRequestSchema.parse({
        ...edit,
        replacementRecipeId: '10000000-0000-4000-8000-000000000001',
      }),
    ).toBeDefined()
    expect(planEditRequestSchema.parse({ ...edit, servings: 3.5 }).servings).toBe(3.5)
  })

  it('requires an operation and bounds serving quantities', () => {
    expect(planEditRequestSchema.safeParse(edit).success).toBe(false)
    expect(planEditRequestSchema.safeParse({ ...edit, servings: 0 }).success).toBe(false)
    expect(planEditRequestSchema.safeParse({ ...edit, servings: 101 }).success).toBe(false)
  })
})
