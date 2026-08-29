import { describe, expect, it } from 'vitest'

import type { IngredientConversion } from '../domain/types'
import { consolidateGroceryList, groceryListEstimatedTotal } from './grocery-consolidation'

const rice: IngredientConversion = {
  ingredientId: 4,
  ingredientCode: 'rice',
  baseUnit: 'g',
  gramsPerBaseUnit: null,
  densityGPerMl: null,
}

describe('consolidateGroceryList', () => {
  it('combines requirements, subtracts pantry, and chooses the cheapest package coverage', () => {
    const items = consolidateGroceryList(
      [
        { ingredient: rice, aisleId: 6, quantity: 300, unit: 'g' },
        { ingredient: rice, aisleId: 6, quantity: 0.5, unit: 'kg', servingsScale: 2 },
      ],
      [{ ingredientId: 4, quantityGrams: 300 }],
      [
        {
          pricingId: 10,
          ingredientId: 4,
          packageQuantity: 1,
          packageUnit: 'kg',
          equivalentGrams: 1_000,
          priceGel: 5,
        },
        {
          pricingId: 11,
          ingredientId: 4,
          packageQuantity: 500,
          packageUnit: 'g',
          equivalentGrams: 500,
          priceGel: 2.8,
        },
      ],
    )

    expect(items).toEqual([
      expect.objectContaining({
        ingredientId: 4,
        requiredQuantity: 1_300,
        pantryDeductionQuantity: 300,
        selectedStorePricingId: 10,
        packageCount: 1,
        purchaseQuantity: 1,
        purchaseUnit: 'kg',
        estimatedCostGel: 5,
      }),
    ])
    expect(groceryListEstimatedTotal(items)).toBe(5)
  })

  it('marks totals incomplete when no price covers an item', () => {
    const items = consolidateGroceryList(
      [{ ingredient: rice, aisleId: 6, quantity: 100, unit: 'g' }],
      [],
      [],
    )
    expect(items[0]?.estimatedCostGel).toBeNull()
    expect(groceryListEstimatedTotal(items)).toBeNull()
  })
})
