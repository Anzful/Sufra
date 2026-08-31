import { describe, expect, it } from 'vitest'

import { summarizePriceCoverage } from '../logic/price-freshness.ts'

import {
  createDefaultMockPersistedState,
  createMockSufraSnapshot,
  mockGeneratePlan,
  mockSetMealServings,
  mockSetPantryItem,
  mockSignIn,
  mockSignUp,
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

  it('keeps the supplied display name when a mock account is created', () => {
    const state = mockSignUp(createDefaultMockPersistedState(), 'nino@example.com', 'Nino Beridze')

    expect(state.session?.user.email).toBe('nino@example.com')
    expect(state.profile.displayName).toBe('Nino Beridze')
    expect(state.onboardingComplete).toBe(false)
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

  it('recalculates nutrition and groceries after a serving change', () => {
    let state = createDefaultMockPersistedState()
    const before = createMockSufraSnapshot(state)
    const meal = before.plan!.meals[0]!
    const caloriesBefore = meal.nutrition.calories
    const recipe = before.recipes.find((candidate) => candidate.id === meal.recipeId)!
    const ingredientId = recipe.ingredients[0]!.id
    const requiredBefore = before.groceryList!.items.find(
      (item) => item.ingredientId === ingredientId,
    )!.requiredQuantityGrams

    state = mockSetMealServings(state, meal.id, meal.servings * 2)
    const after = createMockSufraSnapshot(state)

    expect(after.plan!.meals[0]!.servings).toBe(meal.servings * 2)
    expect(after.plan!.meals[0]!.nutrition.calories).toBe(caloriesBefore * 2)
    expect(
      after.groceryList!.items.find((item) => item.ingredientId === ingredientId)!
        .requiredQuantityGrams,
    ).toBeGreaterThan(requiredBefore)
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

  it('uses every guided answer when building the mock week', () => {
    const base = createDefaultMockPersistedState()
    const state = {
      ...base,
      profile: {
        ...base.profile,
        preferredStoreId: 1,
        householdSize: 5,
        budgetAmountGel: 220,
        mealMoodSlug: 'protein-packed' as const,
        dietaryPatternIds: [3],
        applianceIds: [7],
      },
    }
    const snapshot = createMockSufraSnapshot(state)
    const plannedRecipes = snapshot.plan!.meals.map((meal) =>
      snapshot.recipes.find((recipe) => recipe.id === meal.recipeId),
    )

    expect(snapshot.groceryList?.store.en).toBe('Carrefour')
    expect(snapshot.plan?.meals.every((meal) => meal.servings === 5)).toBe(true)
    expect(plannedRecipes.every((recipe) => recipe?.dietaryPatternSlugs.includes('vegan'))).toBe(
      true,
    )
    expect(
      plannedRecipes.every((recipe) =>
        recipe?.applianceSlugs.every((slug) => slug === 'microwave'),
      ),
    ).toBe(true)
    expect(plannedRecipes.every((recipe) => recipe?.mealMoodSlugs.includes('protein-packed'))).toBe(
      true,
    )
    expect(snapshot.plan?.summary.en).toContain('protein packed')
    expect(snapshot.plan?.summary.en).toContain('220')
    expect(snapshot.plan?.warnings).toContain('BUDGET_EXCEEDED')
  })

  it('prioritises lower-cost recipes when the per-person budget is tight', () => {
    const base = createDefaultMockPersistedState()
    const lowBudget = createMockSufraSnapshot({
      ...base,
      profile: { ...base.profile, budgetAmountGel: 100 },
    })
    const relaxedBudget = createMockSufraSnapshot({
      ...base,
      profile: { ...base.profile, budgetAmountGel: 500 },
    })

    expect(lowBudget.groceryList!.estimatedTotalGel).toBeLessThanOrEqual(
      relaxedBudget.groceryList!.estimatedTotalGel,
    )
  })

  it('includes current, cautionary, stale, expired, and promotional mock prices', () => {
    const list = createMockSufraSnapshot(createDefaultMockPersistedState()).groceryList!
    const summary = summarizePriceCoverage(
      list.items.map((item) => ({
        purchaseQuantity: item.purchaseQuantity,
        estimatedCostGel: item.estimatedCostGel,
        observedAt: item.priceObservation.observedAt,
        validTo: item.priceObservation.validTo,
      })),
    )

    expect(summary.coveragePercent).toBe(100)
    expect(summary.freshItemCount).toBeGreaterThan(0)
    expect(summary.agingItemCount).toBeGreaterThan(0)
    expect(summary.staleItemCount).toBeGreaterThan(0)
    expect(summary.expiredItemCount).toBeGreaterThan(0)
    expect(list.items.some((item) => item.priceObservation.isPromotion)).toBe(true)
  })
})
