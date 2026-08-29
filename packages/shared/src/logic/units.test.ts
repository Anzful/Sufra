import { describe, expect, it } from 'vitest'

import type { IngredientConversion } from '../domain/types'
import { DomainError } from '../domain/errors'
import { toGrams } from './units'

const milk: IngredientConversion = {
  ingredientId: 1,
  ingredientCode: 'milk',
  baseUnit: 'ml',
  gramsPerBaseUnit: null,
  densityGPerMl: 1.03,
}

describe('toGrams', () => {
  it('converts metric mass', () => {
    expect(toGrams(1.5, 'kg', milk)).toBe(1_500)
  })

  it('uses ingredient density for volume', () => {
    expect(toGrams(250, 'ml', milk)).toBe(257.5)
    expect(toGrams(1, 'cup', milk)).toBeCloseTo(247.2)
  })

  it('rejects volume conversion without density', () => {
    expect(() => toGrams(1, 'cup', { ...milk, densityGPerMl: null })).toThrow(DomainError)
  })
})
