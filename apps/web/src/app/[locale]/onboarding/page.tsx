import { mealMoodSlugSchema, translate, type MealMoodSlug } from '@sufra/shared'
import { redirect } from 'next/navigation'

import { AppHeader } from '@/components/app-header'
import { OnboardingWizard, type OnboardingInitialProfile } from '@/components/onboarding-wizard'
import { isMockMode } from '@/lib/data-mode'
import { requireLocale } from '@/lib/locale'
import { readMockSnapshot } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'

import { saveOnboardingAction } from './actions'

interface Translation {
  locale: 'ka' | 'en'
  name: string
}

interface Choice {
  id: number
  slug: string
  translations: Translation[]
}

interface ProfileView {
  display_name: string | null
  city: string | null
  preferred_store_id: number | null
  household_size: number
  budget_amount_gel: number | string | null
  meal_mood_slug?: string | null
  daily_calorie_target: number | null
  protein_target_g: number | string | null
  carbohydrate_target_g: number | string | null
  fat_target_g: number | string | null
  fiber_target_g: number | string | null
  max_cook_minutes: number | null
}

function labelFor(choice: Choice, locale: 'ka' | 'en'): string {
  return (
    choice.translations.find((translation) => translation.locale === locale)?.name ??
    choice.translations.find((translation) => translation.locale === 'en')?.name ??
    choice.slug
  )
}

function numeric(value: unknown, fallback: number): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function nullableNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function mood(value: unknown): MealMoodSlug {
  const parsed = mealMoodSlugSchema.safeParse(value)
  return parsed.success ? parsed.data : 'healthy-comfort'
}

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const locale = requireLocale((await params).locale)
  let profile: ProfileView | null
  let stores: Choice[]
  let appliances: Choice[]
  let diets: Choice[]
  let selectedAppliances: number[]
  let selectedAllergens: number[]
  let selectedDiets: number[]

  if (isMockMode()) {
    const snapshot = await readMockSnapshot()
    if (!snapshot.session) redirect(`/${locale}/sign-in`)
    const value = snapshot.profile
    profile = {
      display_name: value.displayName,
      city: value.city,
      preferred_store_id: value.preferredStoreId,
      household_size: value.householdSize,
      budget_amount_gel: value.budgetAmountGel,
      meal_mood_slug: value.mealMoodSlug,
      daily_calorie_target: value.dailyCalorieTarget,
      protein_target_g: value.proteinTargetG,
      carbohydrate_target_g: value.carbohydrateTargetG,
      fat_target_g: value.fatTargetG,
      fiber_target_g: value.fiberTargetG,
      max_cook_minutes: value.maxCookMinutes,
    }
    stores = snapshot.stores
    appliances = snapshot.appliances
    diets = snapshot.dietaryPatterns
    selectedAppliances = value.applianceIds
    selectedAllergens = value.allergenIds
    selectedDiets = value.dietaryPatternIds
  } else {
    const supabase = await createClient()
    const claims = await supabase.auth.getClaims()
    const userId = claims.data?.claims?.sub
    if (!userId) redirect(`/${locale}/sign-in`)
    const results = await Promise.all([
      supabase.from('profiles').select('*').eq('user_id', userId).single(),
      supabase
        .from('stores')
        .select('id, slug, translations:store_translations(locale, name)')
        .eq('is_active', true)
        .order('slug'),
      supabase
        .from('appliances')
        .select('id, slug, translations:appliance_translations(locale, name)')
        .eq('is_active', true)
        .order('id'),
      supabase
        .from('dietary_patterns')
        .select('id, slug, translations:dietary_pattern_translations(locale, name)')
        .in('slug', ['omnivore', 'vegetarian', 'vegan', 'pescatarian'])
        .eq('is_active', true)
        .order('id'),
      supabase.from('profile_appliances').select('appliance_id').eq('user_id', userId),
      supabase.from('profile_allergens').select('allergen_id').eq('user_id', userId),
      supabase.from('profile_dietary_patterns').select('dietary_pattern_id').eq('user_id', userId),
    ])
    const loadError = results.find((result) => result.error)?.error
    if (loadError) throw new Error(loadError.message)
    profile = results[0].data as unknown as ProfileView | null
    stores = (results[1].data ?? []) as unknown as Choice[]
    appliances = (results[2].data ?? []) as unknown as Choice[]
    diets = (results[3].data ?? []) as unknown as Choice[]
    selectedAppliances = (results[4].data ?? []).map((item) => item.appliance_id)
    selectedAllergens = (results[5].data ?? []).map((item) => item.allergen_id)
    selectedDiets = (results[6].data ?? []).map((item) => item.dietary_pattern_id)
  }

  const omnivoreId = diets.find((diet) => diet.slug === 'omnivore')?.id ?? diets[0]?.id ?? 0
  const selectedDietaryPatternId =
    diets.find((diet) => selectedDiets.includes(diet.id))?.id ?? omnivoreId
  const initial: OnboardingInitialProfile = {
    displayName: profile?.display_name ?? '',
    city: profile?.city ?? (locale === 'ka' ? 'თბილისი' : 'Tbilisi'),
    preferredStoreId: profile?.preferred_store_id ?? 0,
    householdSize: profile?.household_size ?? 1,
    budgetAmountGel: numeric(profile?.budget_amount_gel, 150),
    mealMoodSlug: mood(profile?.meal_mood_slug),
    dailyCalorieTarget: profile?.daily_calorie_target ?? 2000,
    proteinTargetG: nullableNumeric(profile?.protein_target_g) ?? 120,
    carbohydrateTargetG: nullableNumeric(profile?.carbohydrate_target_g) ?? 220,
    fatTargetG: nullableNumeric(profile?.fat_target_g) ?? 70,
    fiberTargetG: nullableNumeric(profile?.fiber_target_g) ?? 30,
    maxCookMinutes: profile?.max_cook_minutes ?? 60,
    allergenIds: selectedAllergens,
    dietaryPatternId: selectedDietaryPatternId,
    applianceIds: selectedAppliances,
  }
  const hasError = Boolean((await searchParams).error)

  return (
    <main className="min-h-screen pb-20">
      <AppHeader locale={locale} />
      <div className="mx-auto max-w-5xl px-5 pt-8 lg:px-8">
        <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
          01 · {locale === 'ka' ? 'შენი გეგმა' : 'YOUR PLAN'}
        </p>
        <h1 className="display-face mt-3 text-4xl sm:text-5xl">
          {translate(locale, 'onboarding')}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          {locale === 'ka'
            ? 'უპასუხე ექვს მოკლე კითხვას. სუფრა მაშინვე შექმნის შვიდდღიან გეგმას, სრულ რეცეპტებსა და ერთიან საყიდლების სიას.'
            : 'Answer six quick questions. Sufra will immediately build seven days of meals, complete recipes, and one consolidated grocery list.'}
        </p>

        {hasError ? (
          <p
            className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
            role="alert"
          >
            {locale === 'ka'
              ? 'გეგმა ვერ შეიქმნა. გადაამოწმე პასუხები და ხელახლა სცადე.'
              : 'We could not build the plan. Review your answers and try again.'}
          </p>
        ) : null}

        <OnboardingWizard
          action={saveOnboardingAction}
          appliances={appliances.map((choice) => ({
            id: choice.id,
            slug: choice.slug,
            label: labelFor(choice, locale),
          }))}
          dietaryPatterns={diets.map((choice) => ({
            id: choice.id,
            slug: choice.slug,
            label: labelFor(choice, locale),
          }))}
          initial={initial}
          locale={locale}
          stores={stores.map((choice) => ({
            id: choice.id,
            slug: choice.slug,
            label: labelFor(choice, locale),
          }))}
        />
      </div>
    </main>
  )
}
