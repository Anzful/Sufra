import { describe, expect, it } from 'vitest'

import {
  createDefaultMockPersistedState,
  createMockSufraSnapshot,
  mockGeneratePlan,
  mockSetPantryItem,
  mockSignIn,
  mockSwapMeal,
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
    expect(snapshot.plan?.estimatedCostGel).toBeLessThanOrEqual(snapshot.profile.budgetAmountGel)
  })

  it('supports authentication, regeneration, and grocery interaction', () => {
    let state = createDefaultMockPersistedState()
    state = mockSignIn(state, 'demo@sufra.ge')
    state = mockGeneratePlan(state)
    state = mockToggleGrocery(state, 'grocery-chicken')
    const snapshot = createMockSufraSnapshot(state)
    expect(snapshot.session?.user.email).toBe('demo@sufra.ge')
    expect(snapshot.plan?.id).toContain('000000000002')
    expect(snapshot.plan?.estimatedCostGel).toBeLessThanOrEqual(snapshot.profile.budgetAmountGel)
    expect(snapshot.groceryList?.items.find((item) => item.id === 'grocery-chicken')?.checked).toBe(
      true,
    )
  })

  it('recalculates groceries after pantry updates and meal swaps', () => {
    let state = createDefaultMockPersistedState()
    const before = createMockSufraSnapshot(state)
    const potatoBefore = before.groceryList?.items.find((item) => item.ingredientId === 'potato')

    state = mockSetPantryItem(state, 'potato', 2_500)
    const afterPantry = createMockSufraSnapshot(state)
    const potatoAfter = afterPantry.groceryList?.items.find(
      (item) => item.ingredientId === 'potato',
    )
    expect(potatoAfter?.pantryDeductionGrams).toBeGreaterThan(
      potatoBefore?.pantryDeductionGrams ?? 0,
    )
    expect(potatoAfter?.estimatedCostGel).toBeLessThan(potatoBefore?.estimatedCostGel ?? Infinity)

    const meal = afterPantry.plan!.meals[0]!
    const oatsBefore = afterPantry.groceryList?.items.find((item) => item.ingredientId === 'oats')
    state = mockSwapMeal(state, meal.id, meal.alternativeRecipeIds[0]!)
    const afterSwap = createMockSufraSnapshot(state)
    expect(afterSwap.plan?.meals[0]?.recipeId).toBe(meal.alternativeRecipeIds[0])
    expect(
      afterSwap.groceryList?.items.find((item) => item.ingredientId === 'oats')
        ?.requiredQuantityGrams,
    ).not.toBe(oatsBefore?.requiredQuantityGrams)
  })

  it('applies the selected Georgian store to localized pricing estimates', () => {
    const nikoraState = createDefaultMockPersistedState()
    const carrefourState = {
      ...nikoraState,
      profile: { ...nikoraState.profile, preferredStoreId: 1 },
    }
    const nikora = createMockSufraSnapshot(nikoraState)
    const carrefour = createMockSufraSnapshot(carrefourState)
    expect(carrefour.groceryList?.store.en).toBe('Carrefour')
    expect(carrefour.groceryList?.estimatedTotalGel).toBeLessThan(
      nikora.groceryList?.estimatedTotalGel ?? 0,
    )
  })
})
