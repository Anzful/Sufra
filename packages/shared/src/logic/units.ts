import { DomainError } from '../domain/errors.ts'
import type { IngredientConversion } from '../domain/types.ts'
import type { MeasurementUnit } from '../schemas/common.ts'

const MILLILITERS_PER_UNIT: Partial<Record<MeasurementUnit, number>> = {
  ml: 1,
  l: 1_000,
  tsp: 5,
  tbsp: 15,
  cup: 240,
}

export function toGrams(
  quantity: number,
  unit: MeasurementUnit,
  ingredient: IngredientConversion,
): number {
  if (!Number.isFinite(quantity) || quantity < 0) {
    throw new DomainError('INVALID_QUANTITY', 'Quantity must be a finite, non-negative number.')
  }

  if (unit === 'g') return quantity
  if (unit === 'kg') return quantity * 1_000

  const milliliters = MILLILITERS_PER_UNIT[unit]
  if (milliliters !== undefined) {
    if (!ingredient.densityGPerMl) {
      throw new DomainError(
        'MISSING_DENSITY',
        `Density is required for ${ingredient.ingredientCode}.`,
        {
          ingredientId: ingredient.ingredientId,
          unit,
        },
      )
    }
    return quantity * milliliters * ingredient.densityGPerMl
  }

  if (unit === 'piece' || unit === 'pack') {
    if (!ingredient.gramsPerBaseUnit) {
      throw new DomainError(
        'MISSING_UNIT_WEIGHT',
        `A gram conversion is required for ${ingredient.ingredientCode}.`,
        { ingredientId: ingredient.ingredientId, unit },
      )
    }
    return quantity * ingredient.gramsPerBaseUnit
  }

  throw new DomainError('UNSUPPORTED_UNIT', `Unsupported measurement unit: ${unit}.`)
}

export function roundQuantity(value: number, decimals = 3): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}
