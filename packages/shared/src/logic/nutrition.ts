import type { IngredientNutrition, MacroTotals } from '../domain/types.ts'

export const ZERO_MACROS: MacroTotals = Object.freeze({
  calories: 0,
  proteinG: 0,
  carbohydrateG: 0,
  fatG: 0,
  fiberG: 0,
  sodiumMg: 0,
})

export function nutritionForGrams(ingredient: IngredientNutrition, grams: number): MacroTotals {
  const factor = grams / 100
  return {
    calories: ingredient.caloriesPer100g * factor,
    proteinG: ingredient.proteinGPer100g * factor,
    carbohydrateG: ingredient.carbohydrateGPer100g * factor,
    fatG: ingredient.fatGPer100g * factor,
    fiberG: ingredient.fiberGPer100g * factor,
    sodiumMg: ingredient.sodiumMgPer100g * factor,
  }
}

export function sumNutrition(values: readonly MacroTotals[]): MacroTotals {
  return values.reduce<MacroTotals>(
    (total, current) => ({
      calories: total.calories + current.calories,
      proteinG: total.proteinG + current.proteinG,
      carbohydrateG: total.carbohydrateG + current.carbohydrateG,
      fatG: total.fatG + current.fatG,
      fiberG: total.fiberG + current.fiberG,
      sodiumMg: total.sodiumMg + current.sodiumMg,
    }),
    { ...ZERO_MACROS },
  )
}

export function scaleNutrition(value: MacroTotals, factor: number): MacroTotals {
  return {
    calories: value.calories * factor,
    proteinG: value.proteinG * factor,
    carbohydrateG: value.carbohydrateG * factor,
    fatG: value.fatG * factor,
    fiberG: value.fiberG * factor,
    sodiumMg: value.sodiumMg * factor,
  }
}
