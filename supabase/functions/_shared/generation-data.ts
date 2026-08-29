import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.4'

import type {
  CandidateRecipe,
  GenerationContext,
  IngredientRequirement,
  PantryAmount,
  StorePackage,
} from '../../../packages/shared/src/domain/types.ts'
import { filterCandidateRecipes } from '../../../packages/shared/src/logic/candidate-filter.ts'
import type { MeasurementUnit } from '../../../packages/shared/src/schemas/common.ts'

interface TranslationRow {
  locale: 'ka' | 'en'
  title?: string
  description?: string | null
}

interface LoadedRecipeIngredient {
  ingredient_id: number
  quantity: number
  unit: MeasurementUnit
  quantity_grams: number
  ingredients: {
    id: number
    canonical_code: string
    default_aisle_id: number | null
    base_unit: 'g' | 'ml' | 'piece'
    grams_per_base_unit: number | null
    density_g_per_ml: number | null
    nutrition_verified_at: string | null
    ingredient_allergens: Array<{ allergens: { slug: string } | null }>
  } | null
}

export interface LoadedRecipe {
  id: string
  dietary_tags: string[]
  mood_tags: GenerationContext['mealMoodSlug'][]
  base_servings: number
  prep_minutes: number
  cook_minutes: number
  calories_per_serving: number
  protein_g_per_serving: number
  carbohydrate_g_per_serving: number
  fat_g_per_serving: number
  fiber_g_per_serving: number
  recipe_translations: TranslationRow[]
  recipe_appliances: Array<{ appliances: { slug: string } | null }>
  recipe_ingredients: LoadedRecipeIngredient[]
}

export interface GenerationData {
  context: GenerationContext
  candidates: CandidateRecipe[]
  recipesById: Map<string, LoadedRecipe>
  pantry: PantryAmount[]
  storePackages: StorePackage[]
  preferredStoreId: number
  unverifiedIngredientIds: Set<number>
}

function relatedSlug(rows: Array<Record<string, unknown>>, relation: string): string[] {
  return rows
    .map((row) => (row[relation] as { slug?: unknown } | null)?.slug)
    .filter((value): value is string => typeof value === 'string')
}

function localizedRecipe(recipe: LoadedRecipe, locale: 'ka' | 'en') {
  return recipe.recipe_translations.find((translation) => translation.locale === locale)
}

export async function loadGenerationData(
  admin: SupabaseClient,
  userId: string,
  weekStartDate: string,
  locale: 'ka' | 'en',
): Promise<GenerationData> {
  const [
    profileResult,
    applianceResult,
    allergenResult,
    dietaryResult,
    preferenceResult,
    pantryResult,
    recipeResult,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('user_id', userId).single(),
    admin.from('profile_appliances').select('appliances!inner(slug)').eq('user_id', userId),
    admin.from('profile_allergens').select('allergens!inner(slug)').eq('user_id', userId),
    admin
      .from('profile_dietary_patterns')
      .select('dietary_patterns!inner(slug)')
      .eq('user_id', userId),
    admin
      .from('profile_ingredient_preferences')
      .select('preference, ingredients!inner(canonical_code)')
      .eq('user_id', userId),
    admin.from('pantry_items').select('ingredient_id, quantity_grams').eq('user_id', userId),
    admin
      .from('recipes')
      .select(
        `id, dietary_tags, mood_tags, base_servings, prep_minutes, cook_minutes,
         calories_per_serving, protein_g_per_serving, carbohydrate_g_per_serving,
         fat_g_per_serving, fiber_g_per_serving,
         recipe_translations(locale, title, description),
         recipe_appliances(appliances(slug)),
         recipe_ingredients(
           ingredient_id, quantity, unit, quantity_grams,
           ingredients(
             id, canonical_code, default_aisle_id, base_unit, grams_per_base_unit,
             density_g_per_ml, nutrition_verified_at,
             ingredient_allergens(allergens(slug))
           )
         )`,
      )
      .eq('status', 'published'),
  ])

  for (const result of [
    profileResult,
    applianceResult,
    allergenResult,
    dietaryResult,
    preferenceResult,
    pantryResult,
    recipeResult,
  ]) {
    if (result.error) throw new Error(result.error.message)
  }

  const profile = profileResult.data
  if (!profile?.onboarding_completed_at) {
    throw new Error('ONBOARDING_INCOMPLETE')
  }
  if (!profile.preferred_store_id || !profile.budget_amount_gel || !profile.daily_calorie_target) {
    throw new Error('PROFILE_TARGETS_INCOMPLETE')
  }

  const preferenceRows = (preferenceResult.data ?? []) as unknown as Array<{
    preference: string
    ingredients: { canonical_code: string } | null
  }>
  const preferenceCodes = (preference: string) =>
    preferenceRows
      .filter((row) => row.preference === preference)
      .map((row) => row.ingredients?.canonical_code)
      .filter((value): value is string => Boolean(value))

  const context: GenerationContext = {
    locale,
    weekStartDate,
    householdSize: profile.household_size,
    mealsPerDay: profile.meals_per_day,
    maxCookMinutes: profile.max_cook_minutes,
    includeLeftovers: profile.include_leftovers,
    allowBatchCooking: profile.allow_batch_cooking,
    requestedBudgetGel: Number(profile.budget_amount_gel),
    budgetPeriod: profile.budget_period,
    mealMoodSlug: profile.meal_mood_slug ?? 'healthy-comfort',
    nutritionTarget: {
      calories: profile.daily_calorie_target,
      proteinG: profile.protein_target_g === null ? null : Number(profile.protein_target_g),
      carbohydrateG:
        profile.carbohydrate_target_g === null ? null : Number(profile.carbohydrate_target_g),
      fatG: profile.fat_target_g === null ? null : Number(profile.fat_target_g),
    },
    applianceSlugs: relatedSlug(
      (applianceResult.data ?? []) as unknown as Array<Record<string, unknown>>,
      'appliances',
    ),
    allergenSlugs: relatedSlug(
      (allergenResult.data ?? []) as unknown as Array<Record<string, unknown>>,
      'allergens',
    ),
    dietaryPatternSlugs: relatedSlug(
      (dietaryResult.data ?? []) as unknown as Array<Record<string, unknown>>,
      'dietary_patterns',
    ),
    lovedIngredientCodes: preferenceCodes('love'),
    dislikedIngredientCodes: preferenceCodes('dislike'),
    avoidedIngredientCodes: preferenceCodes('avoid'),
  }

  const recipes = (recipeResult.data ?? []) as unknown as LoadedRecipe[]
  const recipeCandidates: CandidateRecipe[] = recipes.map((recipe) => {
    const ka = localizedRecipe(recipe, 'ka')
    const en = localizedRecipe(recipe, 'en')
    const allergenSlugs = new Set<string>()
    for (const recipeIngredient of recipe.recipe_ingredients) {
      for (const allergen of recipeIngredient.ingredients?.ingredient_allergens ?? []) {
        if (allergen.allergens?.slug) allergenSlugs.add(allergen.allergens.slug)
      }
    }
    return {
      id: recipe.id,
      title: { ka: ka?.title ?? en?.title ?? recipe.id, en: en?.title ?? ka?.title ?? recipe.id },
      description: {
        ka: ka?.description ?? en?.description ?? '',
        en: en?.description ?? ka?.description ?? '',
      },
      servings: Number(recipe.base_servings),
      prepMinutes: recipe.prep_minutes,
      cookMinutes: recipe.cook_minutes,
      nutritionPerServing: {
        calories: Number(recipe.calories_per_serving),
        proteinG: Number(recipe.protein_g_per_serving),
        carbohydrateG: Number(recipe.carbohydrate_g_per_serving),
        fatG: Number(recipe.fat_g_per_serving),
        fiberG: Number(recipe.fiber_g_per_serving),
        sodiumMg: 0,
      },
      requiredApplianceSlugs: recipe.recipe_appliances
        .map((item) => item.appliances?.slug)
        .filter((value): value is string => Boolean(value)),
      ingredientCodes: recipe.recipe_ingredients
        .map((item) => item.ingredients?.canonical_code)
        .filter((value): value is string => Boolean(value)),
      allergenSlugs: [...allergenSlugs],
      dietaryPatternSlugs: recipe.dietary_tags,
      mealMoodSlugs: recipe.mood_tags,
    }
  })

  const candidates = filterCandidateRecipes(recipeCandidates, context).sort((left, right) => {
    const leftMatches = left.mealMoodSlugs.includes(context.mealMoodSlug) ? 0 : 1
    const rightMatches = right.mealMoodSlugs.includes(context.mealMoodSlug) ? 0 : 1
    return leftMatches - rightMatches
  })
  if (candidates.length === 0) throw new Error('NO_SAFE_RECIPE_CANDIDATES')

  const storePricingResult = await admin
    .from('store_pricing')
    .select(
      'id, ingredient_id, package_quantity, package_unit, equivalent_grams, price_gel, valid_to',
    )
    .eq('store_id', profile.preferred_store_id)
  if (storePricingResult.error) throw new Error(storePricingResult.error.message)

  const now = Date.now()
  const currentStorePrices = (storePricingResult.data ?? []).filter(
    (item) => item.valid_to === null || new Date(item.valid_to).getTime() >= now,
  )

  const unverifiedIngredientIds = new Set<number>()
  for (const recipe of recipes) {
    for (const ingredient of recipe.recipe_ingredients) {
      if (ingredient.ingredients && !ingredient.ingredients.nutrition_verified_at) {
        unverifiedIngredientIds.add(ingredient.ingredient_id)
      }
    }
  }

  return {
    context,
    candidates,
    recipesById: new Map(recipes.map((recipe) => [recipe.id, recipe])),
    pantry: (pantryResult.data ?? [])
      .filter((item) => item.quantity_grams !== null)
      .map((item) => ({
        ingredientId: item.ingredient_id,
        quantityGrams: Number(item.quantity_grams),
      })),
    storePackages: currentStorePrices.map((item) => ({
      pricingId: item.id,
      ingredientId: item.ingredient_id,
      packageQuantity: Number(item.package_quantity),
      packageUnit: item.package_unit as MeasurementUnit,
      equivalentGrams: item.equivalent_grams === null ? null : Number(item.equivalent_grams),
      priceGel: Number(item.price_gel),
    })),
    preferredStoreId: profile.preferred_store_id,
    unverifiedIngredientIds,
  }
}

export function ingredientRequirementsForRecipe(
  recipe: LoadedRecipe,
  servings: number,
): IngredientRequirement[] {
  return recipe.recipe_ingredients.flatMap((item) => {
    if (!item.ingredients) return []
    return [
      {
        ingredient: {
          ingredientId: item.ingredients.id,
          ingredientCode: item.ingredients.canonical_code,
          baseUnit: item.ingredients.base_unit,
          gramsPerBaseUnit:
            item.ingredients.grams_per_base_unit === null
              ? null
              : Number(item.ingredients.grams_per_base_unit),
          densityGPerMl:
            item.ingredients.density_g_per_ml === null
              ? null
              : Number(item.ingredients.density_g_per_ml),
        },
        aisleId: item.ingredients.default_aisle_id,
        quantity: Number(item.quantity),
        unit: item.unit,
        servingsScale: servings / Number(recipe.base_servings),
      },
    ]
  })
}
