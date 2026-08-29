import {
  formatDate,
  formatGel,
  formatMealSlot,
  getWeekStartDate,
  translate,
  type Locale,
  type MealSlot,
  type MeasurementUnit,
} from '@sufra/shared'
import { redirect } from 'next/navigation'

import { AppHeader } from '@/components/app-header'
import { GeneratePlanButton } from '@/components/generate-plan-button'
import { GroceryCheckbox } from '@/components/grocery-checkbox'
import { MealEditor } from '@/components/meal-editor'
import { MockPlanPage } from '@/components/mock-plan-page'
import { isMockMode } from '@/lib/data-mode'
import { requireLocale } from '@/lib/locale'
import { readMockSnapshot } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'

interface Translation {
  locale: Locale
  title?: string
  description?: string | null
  instruction?: string
  name?: string
}

interface RecipeStep {
  step_number: number
  recipe_step_translations: Translation[]
}

interface Recipe {
  id: string
  prep_minutes: number
  cook_minutes: number
  recipe_translations: Translation[]
  recipe_steps: RecipeStep[]
}

interface RecipeOption {
  id: string
  recipe_translations: Translation[]
}

interface PlannedMeal {
  id: string
  day_index: number
  meal_slot: MealSlot
  slot_position: number
  servings: number
  calories: number
  protein_g: number
  carbohydrate_g: number
  fat_g: number
  recipes: Recipe
}

interface GroceryItem {
  id: string
  required_quantity: number
  pantry_deduction_quantity: number
  purchase_quantity: number
  purchase_unit: MeasurementUnit
  estimated_cost_gel: number | null
  is_checked: boolean
  sort_order: number
  ingredients: { ingredient_translations: Translation[] }
  aisles: { aisle_translations: Translation[] } | null
}

function localized<T extends Translation>(rows: T[], locale: Locale): T | undefined {
  return rows.find((row) => row.locale === locale) ?? rows.find((row) => row.locale === 'en')
}

function dateForDay(weekStartDate: string, dayIndex: number): string {
  const date = new Date(`${weekStartDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toISOString()
}

function quantityLabel(quantity: number, unit: MeasurementUnit, locale: Locale): string {
  const rounded = new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-GB', {
    maximumFractionDigits: 2,
  }).format(quantity)
  const units: Record<Locale, Record<MeasurementUnit, string>> = {
    ka: {
      g: 'გ',
      kg: 'კგ',
      ml: 'მლ',
      l: 'ლ',
      piece: 'ც',
      tsp: 'ჩ/კ',
      tbsp: 'ს/კ',
      cup: 'ჭიქა',
      pack: 'შეკვრა',
    },
    en: {
      g: 'g',
      kg: 'kg',
      ml: 'ml',
      l: 'l',
      piece: 'pcs',
      tsp: 'tsp',
      tbsp: 'tbsp',
      cup: 'cup',
      pack: 'pack',
    },
  }
  return `${rounded} ${units[locale][unit]}`
}

export default async function PlanPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale)
  if (isMockMode()) {
    const snapshot = await readMockSnapshot()
    if (!snapshot.session) redirect(`/${locale}/sign-in`)
    if (!snapshot.onboardingComplete) redirect(`/${locale}/onboarding`)
    return <MockPlanPage locale={locale} snapshot={snapshot} />
  }
  const supabase = await createClient()
  const claims = await supabase.auth.getClaims()
  const userId = claims.data?.claims?.sub
  if (!userId) redirect(`/${locale}/sign-in`)

  const [profileResult, planResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('display_name, onboarding_completed_at, budget_amount_gel, daily_calorie_target')
      .eq('user_id', userId)
      .single(),
    supabase
      .from('weekly_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', getWeekStartDate())
      .eq('is_current', true)
      .maybeSingle(),
  ])
  if (profileResult.error) throw new Error(profileResult.error.message)
  if (!profileResult.data?.onboarding_completed_at) redirect(`/${locale}/onboarding`)
  if (planResult.error) throw new Error(planResult.error.message)

  const plan = planResult.data
  if (!plan) {
    return (
      <main className="min-h-screen">
        <AppHeader locale={locale} />
        <section className="mx-auto max-w-5xl px-5 pt-16 pb-24 lg:px-8">
          <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
            02 · Plan
          </p>
          <h1 className="display-face mt-3 max-w-3xl text-5xl leading-tight">
            {locale === 'ka' ? 'ამ კვირის სუფრა ჯერ ცარიელია.' : 'This week’s table is waiting.'}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            {locale === 'ka'
              ? 'Sufra შეარჩევს მხოლოდ შენთვის უსაფრთხო რეცეპტებს, შემდეგ თავად გადაამოწმებს კალორიებს, მაკროებსა და სავარაუდო ღირებულებას.'
              : 'Sufra will schedule only recipes that pass your safety rules, then independently verify nutrition, macros, and estimated cost.'}
          </p>
          <div className="surface mt-9 rounded-3xl p-7">
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--paper-deep)] p-4">
                <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                  {translate(locale, 'budget')}
                </p>
                <p className="display-face mt-1 text-3xl">
                  {formatGel(Number(profileResult.data.budget_amount_gel), locale)}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--paper-deep)] p-4">
                <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                  {translate(locale, 'calories')}
                </p>
                <p className="display-face mt-1 text-3xl">
                  {profileResult.data.daily_calorie_target} / day
                </p>
              </div>
            </div>
            <GeneratePlanButton locale={locale} />
          </div>
        </section>
      </main>
    )
  }

  const [mealsResult, groceryListResult, jobResult, recipeOptionsResult] = await Promise.all([
    supabase
      .from('planned_meals')
      .select(
        `id, day_index, meal_slot, slot_position, servings, calories, protein_g,
         carbohydrate_g, fat_g,
         recipes!inner(
           id, prep_minutes, cook_minutes,
           recipe_translations(locale, title, description),
           recipe_steps(step_number, recipe_step_translations(locale, instruction))
         )`,
      )
      .eq('weekly_plan_id', plan.id)
      .order('day_index')
      .order('slot_position'),
    supabase
      .from('grocery_lists')
      .select('id, estimated_total_gel')
      .eq('weekly_plan_id', plan.id)
      .maybeSingle(),
    supabase
      .from('plan_generation_jobs')
      .select('output_snapshot')
      .eq('weekly_plan_id', plan.id)
      .eq('status', 'succeeded')
      .maybeSingle(),
    supabase
      .from('recipes')
      .select('id, recipe_translations(locale, title)')
      .eq('status', 'published')
      .order('created_at'),
  ])
  if (mealsResult.error) throw new Error(mealsResult.error.message)
  if (groceryListResult.error) throw new Error(groceryListResult.error.message)
  if (recipeOptionsResult.error) throw new Error(recipeOptionsResult.error.message)

  const groceryItemsResult = groceryListResult.data
    ? await supabase
        .from('grocery_list_items')
        .select(
          `id, required_quantity, pantry_deduction_quantity, purchase_quantity,
           purchase_unit, estimated_cost_gel, is_checked, sort_order,
           ingredients!inner(ingredient_translations(locale, name)),
           aisles(aisle_translations(locale, name))`,
        )
        .eq('grocery_list_id', groceryListResult.data.id)
        .order('sort_order')
    : { data: [], error: null }
  if (groceryItemsResult.error) throw new Error(groceryItemsResult.error.message)

  const meals = (mealsResult.data ?? []) as unknown as PlannedMeal[]
  const groceries = (groceryItemsResult.data ?? []) as unknown as GroceryItem[]
  const recipeOptions = (recipeOptionsResult.data ?? []) as unknown as RecipeOption[]
  const outputSnapshot = jobResult.data?.output_snapshot as { warnings?: unknown } | null
  const generationWarnings = Array.isArray(outputSnapshot?.warnings)
    ? outputSnapshot.warnings.filter((warning): warning is string => typeof warning === 'string')
    : []
  const editWarnings = Array.isArray(plan.validation_warnings)
    ? plan.validation_warnings.filter(
        (warning: unknown): warning is string => typeof warning === 'string',
      )
    : []
  const warnings = [...new Set([...generationWarnings, ...editWarnings])]
  const summary = locale === 'ka' ? plan.summary_ka : plan.summary_en

  return (
    <main className="min-h-screen pb-24">
      <AppHeader locale={locale} />
      <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
              02 · {translate(locale, 'weeklyPlan')}
            </p>
            <h1 className="display-face mt-3 text-4xl sm:text-5xl">
              {profileResult.data.display_name
                ? locale === 'ka'
                  ? `${profileResult.data.display_name}-ს კვირა`
                  : `${profileResult.data.display_name}’s week`
                : locale === 'ka'
                  ? 'ამ კვირის სუფრა'
                  : 'This week’s table'}
            </h1>
            {summary ? (
              <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">{summary}</p>
            ) : null}
          </div>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[var(--paper-deep)] px-5 py-3 text-right">
              <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                {translate(locale, 'estimated')}
              </p>
              <p className="display-face text-2xl">
                {plan.estimated_cost_gel === null
                  ? '—'
                  : formatGel(Number(plan.estimated_cost_gel), locale)}
              </p>
            </div>
            <GeneratePlanButton locale={locale} />
          </div>
        </div>

        {warnings.length ? (
          <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {locale === 'ka'
              ? 'ზოგი კვებითი ან ფასის მონაცემი ჯერ დაუდასტურებელია; თანხა და მაკროები სავარაუდოა.'
              : 'Some nutrition or price records are not yet verified; totals and macros are estimates.'}
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, dayIndex) => {
            const dayMeals = meals.filter((meal) => meal.day_index === dayIndex)
            return (
              <article className="surface rounded-3xl p-4 lg:col-span-1" key={dayIndex}>
                <p className="text-xs font-black tracking-widest text-[var(--wine)] uppercase">
                  {formatDate(dateForDay(plan.week_start_date, dayIndex), locale)}
                </p>
                <div className="mt-4 space-y-3">
                  {dayMeals.map((meal) => {
                    const recipeText = localized(meal.recipes.recipe_translations, locale)
                    const steps = [...meal.recipes.recipe_steps].sort(
                      (a, b) => a.step_number - b.step_number,
                    )
                    return (
                      <details className="group rounded-2xl bg-white/65 p-3" key={meal.id}>
                        <summary className="cursor-pointer list-none">
                          <span className="text-[0.66rem] font-black tracking-wider text-[var(--leaf)] uppercase">
                            {formatMealSlot(meal.meal_slot, locale)}
                          </span>
                          <h2 className="mt-1 text-sm font-bold leading-5">
                            {recipeText?.title ?? meal.recipes.id}
                          </h2>
                          <p className="mt-2 text-xs text-[var(--muted)]">
                            {Math.round(Number(meal.calories))} kcal ·{' '}
                            {Math.round(Number(meal.protein_g))}g P ·{' '}
                            {Math.round(Number(meal.carbohydrate_g))}g C ·{' '}
                            {Math.round(Number(meal.fat_g))}g F
                          </p>
                        </summary>
                        <div className="mt-3 border-t border-[var(--line)] pt-3 text-xs leading-5 text-[var(--muted)]">
                          {recipeText?.description ? <p>{recipeText.description}</p> : null}
                          <p className="mt-2 font-semibold">
                            {meal.recipes.prep_minutes + meal.recipes.cook_minutes} min ·{' '}
                            {Number(meal.servings)} servings
                          </p>
                          <ol className="mt-3 list-decimal space-y-2 pl-4">
                            {steps.map((step) => (
                              <li key={step.step_number}>
                                {localized(step.recipe_step_translations, locale)?.instruction}
                              </li>
                            ))}
                          </ol>
                          <MealEditor
                            alternatives={recipeOptions
                              .filter((recipe) => recipe.id !== meal.recipes.id)
                              .map((recipe) => ({
                                id: recipe.id,
                                title:
                                  localized(recipe.recipe_translations, locale)?.title ?? recipe.id,
                              }))}
                            expectedUpdatedAt={plan.updated_at}
                            locale={locale}
                            mealId={meal.id}
                            planId={plan.id}
                            servings={Number(meal.servings)}
                          />
                        </div>
                      </details>
                    )
                  })}
                </div>
              </article>
            )
          })}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.68fr_0.32fr]">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
              03 · {translate(locale, 'groceryList')}
            </p>
            <h2 className="display-face mt-2 text-4xl">{translate(locale, 'groceryList')}</h2>
            <div className="surface mt-6 divide-y divide-[var(--line)] rounded-3xl px-5">
              {groceries.map((item) => {
                const name =
                  localized(item.ingredients.ingredient_translations, locale)?.name ?? '—'
                const aisle = item.aisles
                  ? localized(item.aisles.aisle_translations, locale)?.name
                  : null
                return (
                  <div className="flex items-center gap-4 py-4" key={item.id}>
                    <GroceryCheckbox id={item.id} initialChecked={item.is_checked} />
                    <div className="min-w-0 flex-1">
                      <p
                        className={`font-semibold ${item.is_checked ? 'text-[var(--muted)] line-through' : ''}`}
                      >
                        {name}
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {aisle ?? (locale === 'ka' ? 'სხვა' : 'Other')}
                        {Number(item.pantry_deduction_quantity) > 0
                          ? ` · ${locale === 'ka' ? 'მარაგიდან' : 'from pantry'} ${Math.round(Number(item.pantry_deduction_quantity))}g`
                          : ''}
                      </p>
                    </div>
                    <span className="text-sm font-bold">
                      {quantityLabel(Number(item.purchase_quantity), item.purchase_unit, locale)}
                    </span>
                    <span className="w-16 text-right text-sm text-[var(--muted)]">
                      {item.estimated_cost_gel === null
                        ? '—'
                        : formatGel(Number(item.estimated_cost_gel), locale)}
                    </span>
                  </div>
                )
              })}
              {groceries.length === 0 ? (
                <p className="py-6 text-sm text-[var(--muted)]">
                  {locale === 'ka' ? 'სია ცარიელია.' : 'The list is empty.'}
                </p>
              ) : null}
            </div>
          </div>
          <aside className="surface h-fit rounded-3xl p-6">
            <p className="text-xs font-black tracking-widest text-[var(--muted)] uppercase">
              {locale === 'ka' ? 'კვირის საშუალო' : 'Daily average'}
            </p>
            <p className="display-face mt-2 text-4xl">
              {Math.round(Number(plan.average_daily_calories))}
            </p>
            <p className="text-sm text-[var(--muted)]">kcal / {locale === 'ka' ? 'დღე' : 'day'}</p>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt>{locale === 'ka' ? 'ცილა' : 'Protein'}</dt>
                <dd className="font-bold">{Math.round(Number(plan.average_daily_protein_g))} g</dd>
              </div>
              <div className="flex justify-between">
                <dt>{locale === 'ka' ? 'ნახშირწყალი' : 'Carbs'}</dt>
                <dd className="font-bold">
                  {Math.round(Number(plan.average_daily_carbohydrate_g))} g
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>{locale === 'ka' ? 'ცხიმი' : 'Fat'}</dt>
                <dd className="font-bold">{Math.round(Number(plan.average_daily_fat_g))} g</dd>
              </div>
              <div className="flex justify-between border-t border-[var(--line)] pt-3">
                <dt>{locale === 'ka' ? 'საყიდლები' : 'Groceries'}</dt>
                <dd className="font-bold">
                  {groceryListResult.data?.estimated_total_gel === null ||
                  groceryListResult.data?.estimated_total_gel === undefined
                    ? '—'
                    : formatGel(Number(groceryListResult.data.estimated_total_gel), locale)}
                </dd>
              </div>
            </dl>
          </aside>
        </section>
      </div>
    </main>
  )
}
