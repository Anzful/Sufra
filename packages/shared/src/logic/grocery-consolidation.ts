import type {
  ConsolidatedGroceryItem,
  IngredientRequirement,
  PantryAmount,
  StorePackage,
} from '../domain/types.ts'
import { roundQuantity, toGrams } from './units.ts'

function choosePackage(requiredGrams: number, packages: readonly StorePackage[]) {
  return packages
    .filter((candidate) => candidate.equivalentGrams && candidate.equivalentGrams > 0)
    .map((candidate) => {
      const packageCount = Math.ceil(requiredGrams / candidate.equivalentGrams!)
      return {
        candidate,
        packageCount,
        cost: packageCount * candidate.priceGel,
        wasteGrams: packageCount * candidate.equivalentGrams! - requiredGrams,
      }
    })
    .sort((a, b) => a.cost - b.cost || a.wasteGrams - b.wasteGrams)[0]
}

export function consolidateGroceryList(
  requirements: readonly IngredientRequirement[],
  pantry: readonly PantryAmount[],
  storePackages: readonly StorePackage[],
): ConsolidatedGroceryItem[] {
  const pantryByIngredient = new Map(pantry.map((item) => [item.ingredientId, item.quantityGrams]))
  const packagesByIngredient = new Map<number, StorePackage[]>()
  for (const storePackage of storePackages) {
    const current = packagesByIngredient.get(storePackage.ingredientId) ?? []
    current.push(storePackage)
    packagesByIngredient.set(storePackage.ingredientId, current)
  }

  const totals = new Map<
    number,
    {
      requiredGrams: number
      aisleId: number | null
      ingredient: IngredientRequirement['ingredient']
    }
  >()

  for (const requirement of requirements) {
    const grams =
      toGrams(requirement.quantity, requirement.unit, requirement.ingredient) *
      (requirement.servingsScale ?? 1)
    const current = totals.get(requirement.ingredient.ingredientId)
    totals.set(requirement.ingredient.ingredientId, {
      requiredGrams: (current?.requiredGrams ?? 0) + grams,
      aisleId: current?.aisleId ?? requirement.aisleId,
      ingredient: requirement.ingredient,
    })
  }

  return [...totals.entries()]
    .map(([ingredientId, total]) => {
      const pantryAvailable = pantryByIngredient.get(ingredientId) ?? 0
      const pantryDeduction = Math.min(total.requiredGrams, pantryAvailable)
      const purchaseGrams = Math.max(0, total.requiredGrams - pantryDeduction)
      const selection = choosePackage(purchaseGrams, packagesByIngredient.get(ingredientId) ?? [])

      if (selection && purchaseGrams > 0) {
        return {
          ingredientId,
          aisleId: total.aisleId,
          selectedStorePricingId: selection.candidate.pricingId,
          requiredQuantity: roundQuantity(total.requiredGrams),
          requiredUnit: 'g' as const,
          pantryDeductionQuantity: roundQuantity(pantryDeduction),
          purchaseQuantity: roundQuantity(
            selection.packageCount * selection.candidate.packageQuantity,
          ),
          purchaseUnit: selection.candidate.packageUnit,
          estimatedCostGel: roundQuantity(selection.cost, 2),
          packageCount: selection.packageCount,
        }
      }

      return {
        ingredientId,
        aisleId: total.aisleId,
        selectedStorePricingId: null,
        requiredQuantity: roundQuantity(total.requiredGrams),
        requiredUnit: 'g' as const,
        pantryDeductionQuantity: roundQuantity(pantryDeduction),
        purchaseQuantity: roundQuantity(purchaseGrams),
        purchaseUnit: 'g' as const,
        estimatedCostGel: purchaseGrams === 0 ? 0 : null,
        packageCount: null,
      }
    })
    .sort((a, b) => (a.aisleId ?? Number.MAX_SAFE_INTEGER) - (b.aisleId ?? Number.MAX_SAFE_INTEGER))
}

export function groceryListEstimatedTotal(
  items: readonly ConsolidatedGroceryItem[],
): number | null {
  if (items.some((item) => item.estimatedCostGel === null)) return null
  return roundQuantity(
    items.reduce((total, item) => total + (item.estimatedCostGel ?? 0), 0),
    2,
  )
}
