import { translate } from '@sufra/shared'
import { redirect } from 'next/navigation'

import { AppHeader } from '@/components/app-header'
import { requireLocale } from '@/lib/locale'
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

export default async function OnboardingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const locale = requireLocale((await params).locale)
  const supabase = await createClient()
  const claims = await supabase.auth.getClaims()
  const userId = claims.data?.claims?.sub
  if (!userId) redirect(`/${locale}/sign-in`)

  const [
    profileResult,
    storesResult,
    appliancesResult,
    allergensResult,
    dietsResult,
    selectedAppliancesResult,
    selectedAllergensResult,
    selectedDietsResult,
  ] = await Promise.all([
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
      .from('allergens')
      .select('id, slug, translations:allergen_translations(locale, name)')
      .eq('is_active', true)
      .order('id'),
    supabase
      .from('dietary_patterns')
      .select('id, slug, translations:dietary_pattern_translations(locale, name)')
      .eq('is_active', true)
      .order('id'),
    supabase.from('profile_appliances').select('appliance_id').eq('user_id', userId),
    supabase.from('profile_allergens').select('allergen_id').eq('user_id', userId),
    supabase.from('profile_dietary_patterns').select('dietary_pattern_id').eq('user_id', userId),
  ])

  const loadError = [
    profileResult,
    storesResult,
    appliancesResult,
    allergensResult,
    dietsResult,
    selectedAppliancesResult,
    selectedAllergensResult,
    selectedDietsResult,
  ].find((result) => result.error)?.error
  if (loadError) throw new Error(loadError.message)

  const profile = profileResult.data
  const stores = (storesResult.data ?? []) as unknown as Choice[]
  const appliances = (appliancesResult.data ?? []) as unknown as Choice[]
  const allergens = (allergensResult.data ?? []) as unknown as Choice[]
  const diets = (dietsResult.data ?? []) as unknown as Choice[]
  const selectedAppliances = new Set(
    (selectedAppliancesResult.data ?? []).map((item) => item.appliance_id),
  )
  const selectedAllergens = new Set(
    (selectedAllergensResult.data ?? []).map((item) => item.allergen_id),
  )
  const selectedDiets = new Set(
    (selectedDietsResult.data ?? []).map((item) => item.dietary_pattern_id),
  )
  const hasError = Boolean((await searchParams).error)
  const copy =
    locale === 'ka'
      ? {
          lead: 'ეს პასუხები განსაზღვრავს რა მოხვდება გეგმაში. ალერგენები მკაცრი შეზღუდვაა; ფასი და მაკროები ყოველი გეგმის შექმნისას მოწმდება.',
          household: 'ოჯახი და ყოველდღიური რიტმი',
          storeBudget: 'მაღაზია და ბიუჯეტი',
          nutrition: 'კვების მიზნები',
          food: 'კვების სტილი და უსაფრთხოება',
          appliances: 'სამზარეულოს ტექნიკა',
          save: 'შენახვა და გეგმის შექმნაზე გადასვლა',
          error: 'ზოგი პასუხი ვერ შევინახეთ. გადაამოწმე რიცხვები და ხელახლა სცადე.',
        }
      : {
          lead: 'These answers decide what can enter your plan. Allergens are hard constraints; pricing and nutrition are checked every time a plan is generated.',
          household: 'Household and daily rhythm',
          storeBudget: 'Store and budget',
          nutrition: 'Nutrition targets',
          food: 'Eating style and safety',
          appliances: 'Kitchen equipment',
          save: 'Save and continue to planning',
          error: 'Some answers could not be saved. Check the numeric values and try again.',
        }

  return (
    <main className="min-h-screen pb-20">
      <AppHeader locale={locale} />
      <div className="mx-auto max-w-5xl px-5 pt-8 lg:px-8">
        <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
          01 · Profile
        </p>
        <h1 className="display-face mt-3 text-4xl sm:text-5xl">
          {translate(locale, 'onboarding')}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">{copy.lead}</p>

        {hasError ? (
          <p
            className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-800"
            role="alert"
          >
            {copy.error}
          </p>
        ) : null}

        <form action={saveOnboardingAction} className="mt-8 space-y-6">
          <input name="locale" type="hidden" value={locale} />
          <fieldset className="surface grid gap-5 rounded-3xl p-6 md:grid-cols-3">
            <legend className="display-face px-2 text-2xl">{copy.household}</legend>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'სახელი' : 'Name'}
              <input
                className="field mt-1.5"
                name="displayName"
                defaultValue={profile?.display_name ?? ''}
                maxLength={80}
              />
            </label>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'ქალაქი' : 'City'}
              <input
                className="field mt-1.5"
                name="city"
                defaultValue={profile?.city ?? 'Tbilisi'}
                required
              />
            </label>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'რამდენი ადამიანი' : 'People in household'}
              <input
                className="field mt-1.5"
                name="householdSize"
                type="number"
                min={1}
                max={20}
                defaultValue={profile?.household_size ?? 1}
                required
              />
            </label>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'კვება დღეში' : 'Meals per day'}
              <input
                className="field mt-1.5"
                name="mealsPerDay"
                type="number"
                min={1}
                max={8}
                defaultValue={profile?.meals_per_day ?? 3}
                required
              />
            </label>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'მომზადების მაქს. დრო (წთ)' : 'Maximum cook time (min)'}
              <input
                className="field mt-1.5"
                name="maxCookMinutes"
                type="number"
                min={5}
                max={1440}
                defaultValue={profile?.max_cook_minutes ?? 45}
              />
            </label>
            <div className="space-y-3 pt-2 text-sm font-semibold">
              <label className="flex gap-3">
                <input
                  name="includeLeftovers"
                  type="checkbox"
                  defaultChecked={profile?.include_leftovers ?? true}
                />{' '}
                {locale === 'ka' ? 'ნარჩენების გამოყენება' : 'Use leftovers'}
              </label>
              <label className="flex gap-3">
                <input
                  name="allowBatchCooking"
                  type="checkbox"
                  defaultChecked={profile?.allow_batch_cooking ?? true}
                />{' '}
                {locale === 'ka' ? 'ერთად რამდენიმე პორციის მომზადება' : 'Allow batch cooking'}
              </label>
            </div>
          </fieldset>

          <fieldset className="surface grid gap-5 rounded-3xl p-6 md:grid-cols-3">
            <legend className="display-face px-2 text-2xl">{copy.storeBudget}</legend>
            <label className="text-sm font-semibold md:col-span-2">
              {locale === 'ka' ? 'საყვარელი სუპერმარკეტი' : 'Preferred supermarket'}
              <select
                className="field mt-1.5"
                name="preferredStoreId"
                defaultValue={profile?.preferred_store_id ?? ''}
                required
              >
                <option disabled value="">
                  —
                </option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {labelFor(store, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'პერიოდი' : 'Period'}
              <select
                className="field mt-1.5"
                name="budgetPeriod"
                defaultValue={profile?.budget_period ?? 'weekly'}
              >
                <option value="weekly">{locale === 'ka' ? 'კვირეული' : 'Weekly'}</option>
                <option value="daily">{locale === 'ka' ? 'დღიური' : 'Daily'}</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              {locale === 'ka' ? 'ბიუჯეტის ზედა ზღვარი (₾)' : 'Budget ceiling (GEL)'}
              <input
                className="field mt-1.5"
                name="budgetAmountGel"
                type="number"
                min="1"
                step="0.01"
                defaultValue={numeric(profile?.budget_amount_gel, 150)}
                required
              />
            </label>
          </fieldset>

          <fieldset className="surface grid gap-5 rounded-3xl p-6 sm:grid-cols-2 lg:grid-cols-5">
            <legend className="display-face px-2 text-2xl">{copy.nutrition}</legend>
            {[
              [
                'dailyCalorieTarget',
                locale === 'ka' ? 'კკალ / დღე' : 'kcal / day',
                profile?.daily_calorie_target ?? 2000,
                800,
                10000,
              ],
              [
                'proteinTargetG',
                locale === 'ka' ? 'ცილა (გ)' : 'Protein (g)',
                profile?.protein_target_g ?? 120,
                1,
                1000,
              ],
              [
                'carbohydrateTargetG',
                locale === 'ka' ? 'ნახშირწყალი (გ)' : 'Carbs (g)',
                profile?.carbohydrate_target_g ?? 220,
                1,
                1500,
              ],
              [
                'fatTargetG',
                locale === 'ka' ? 'ცხიმი (გ)' : 'Fat (g)',
                profile?.fat_target_g ?? 65,
                1,
                1000,
              ],
              [
                'fiberTargetG',
                locale === 'ka' ? 'ბოჭკო (გ)' : 'Fibre (g)',
                profile?.fiber_target_g ?? 30,
                1,
                250,
              ],
            ].map(([name, label, value, min, max]) => (
              <label className="text-sm font-semibold" key={String(name)}>
                {label}
                <input
                  className="field mt-1.5"
                  name={String(name)}
                  type="number"
                  min={Number(min)}
                  max={Number(max)}
                  step={name === 'dailyCalorieTarget' ? 1 : 0.1}
                  defaultValue={numeric(value, 0)}
                />
              </label>
            ))}
            <p className="text-xs leading-5 text-[var(--muted)] sm:col-span-2 lg:col-span-5">
              {locale === 'ka'
                ? 'ეს მიზნები სამედიცინო რჩევა არ არის. ჯანმრთელობის მდგომარეობისას მიმართე კვალიფიციურ სპეციალისტს.'
                : 'These targets are not medical advice. For medical dietary needs, consult a qualified professional.'}
            </p>
          </fieldset>

          <fieldset className="surface rounded-3xl p-6">
            <legend className="display-face px-2 text-2xl">{copy.food}</legend>
            <p className="mb-3 mt-1 text-sm font-bold">
              {locale === 'ka' ? 'კვების სტილი' : 'Dietary pattern'}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {diets.map((diet) => (
                <label
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/50 px-4 py-3 text-sm font-semibold"
                  key={diet.id}
                >
                  <input
                    name="dietaryPatternIds"
                    type="checkbox"
                    value={diet.id}
                    defaultChecked={selectedDiets.has(diet.id)}
                  />{' '}
                  {labelFor(diet, locale)}
                </label>
              ))}
            </div>
            <p className="mb-3 mt-6 text-sm font-bold">
              {locale === 'ka' ? 'ალერგენები — სრულად გამოირიცხოს' : 'Allergens — always exclude'}
            </p>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {allergens.map((allergen) => (
                <label
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/50 px-4 py-3 text-sm font-semibold"
                  key={allergen.id}
                >
                  <input
                    name="allergenIds"
                    type="checkbox"
                    value={allergen.id}
                    defaultChecked={selectedAllergens.has(allergen.id)}
                  />{' '}
                  {labelFor(allergen, locale)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="surface rounded-3xl p-6">
            <legend className="display-face px-2 text-2xl">{copy.appliances}</legend>
            <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {appliances.map((appliance) => (
                <label
                  className="flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-white/50 px-4 py-3 text-sm font-semibold"
                  key={appliance.id}
                >
                  <input
                    name="applianceIds"
                    type="checkbox"
                    value={appliance.id}
                    defaultChecked={selectedAppliances.has(appliance.id)}
                  />{' '}
                  {labelFor(appliance, locale)}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex justify-end pt-2">
            <button className="primary-button px-7" type="submit">
              {copy.save} →
            </button>
          </div>
        </form>
      </div>
    </main>
  )
}
