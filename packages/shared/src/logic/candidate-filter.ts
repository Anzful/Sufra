import type { CandidateRecipe, GenerationContext } from '../domain/types.ts'

export function filterCandidateRecipes(
  recipes: readonly CandidateRecipe[],
  context: GenerationContext,
): CandidateRecipe[] {
  const appliances = new Set(context.applianceSlugs)
  const allergens = new Set(context.allergenSlugs)
  const avoidedIngredients = new Set(context.avoidedIngredientCodes)
  const requiredDietaryPatterns = context.dietaryPatternSlugs.filter((slug) => slug !== 'omnivore')

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
    if (requiredDietaryPatterns.some((pattern) => !recipe.dietaryPatternSlugs.includes(pattern))) {
      return false
    }
    return true
  })
}
