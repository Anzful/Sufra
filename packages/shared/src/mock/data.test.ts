import { describe, expect, it } from 'vitest'

import {
  createDefaultMockPersistedState,
  createMockSufraSnapshot,
  mockGeneratePlan,
  mockSignIn,
  mockToggleGrocery,
} from './data.ts'

describe('mock Sufra dataset', () => {
  it('contains a complete 7-day, 3-meal plan with resolvable recipes', () => {
    const snapshot = createMockSufraSnapshot(createDefaultMockPersistedState())
    expect(snapshot.plan?.meals).toHaveLength(21)
    expect(new Set(snapshot.plan?.meals.map((meal) => meal.dayIndex))).toEqual(
      new Set([0, 1, 2, 3, 4, 5, 6]),
    )
    const recipeIds = new Set(snapshot.recipes.map((recipe) => recipe.id))
    expect(snapshot.plan?.meals.every((meal) => recipeIds.has(meal.recipeId))).toBe(true)
  })

  it('supports authentication, regeneration, and grocery interaction', () => {
    let state = createDefaultMockPersistedState()
    state = mockSignIn(state, 'demo@sufra.ge')
    state = mockGeneratePlan(state)
    state = mockToggleGrocery(state, 'grocery-01')
    const snapshot = createMockSufraSnapshot(state)
    expect(snapshot.session?.user.email).toBe('demo@sufra.ge')
    expect(snapshot.plan?.id).toContain('000000000002')
    expect(snapshot.groceryList?.items.find((item) => item.id === 'grocery-01')?.checked).toBe(true)
  })
})
