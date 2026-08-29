import type { CandidateRecipe, GenerationContext } from '../domain/types.ts'

const dietCompatibility: Record<string, readonly string[]> = {
  omnivore: [],
  vegetarian: ['vegetarian', 'vegan'],
  vegan: ['vegan'],
  pescatarian: ['pescatarian', 'vegetarian', 'vegan'],
}

export function recipeMatchesDiet(
  recipeDietaryPatterns: readonly string[],
  selectedDietaryPatterns: readonly string[],
): boolean {
  const selected = selectedDietaryPatterns[0] ?? 'omnivore'
  const compatibleTags = dietCompatibility[selected]
  if (!compatibleTags) return recipeDietaryPatterns.includes(selected)
  if (compatibleTags.length === 0) return true
  return compatibleTags.some((tag) => recipeDietaryPatterns.includes(tag))
}

export function filterCandidateRecipes(
  recipes: readonly CandidateRecipe[],
  context: GenerationContext,
): CandidateRecipe[] {
  const appliances = new Set(context.applianceSlugs)
  const allergens = new Set(context.allergenSlugs)
  const avoidedIngredients = new Set(context.avoidedIngredientCodes)

  return recipes.filter((recipe) => {
    if (
      recipe.prepMinutes + recipe.cookMinutes >
      (context.maxCookMinutes ?? Number.MAX_SAFE_INTEGER)
    ) {
      return false
    }
    if (recipe.requiredApplianceSlugs.some((appliance) => !appliances.has(appliance))) return false
    if (recipe.allergenSlugs.some((allergen) => allergens.has(allergen))) return false
    if (recipe.ingredientCodes.some((ingredient) => avoidedIngredients.has(ingredient)))
      return false
    if (!recipeMatchesDiet(recipe.dietaryPatternSlugs, context.dietaryPatternSlugs)) return false
    return true
  })
}
