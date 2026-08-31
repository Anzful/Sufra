import {
  formatDate,
  formatGel,
  formatMealSlot,
  translate,
  type Locale,
  type MeasurementUnit,
  type MockSufraSnapshot,
} from '@sufra/shared'
import Link from 'next/link'

import { setMockMealServingsAction, swapMockMealAction } from '@/app/mock-actions'

import { AppHeader } from './app-header'
import { GeneratePlanButton } from './generate-plan-button'
import { GroceryCheckbox } from './grocery-checkbox'
import { PriceCoverage, PriceFreshnessBadge } from './price-transparency'

function dateForDay(weekStartDate: string, dayIndex: number): string {
  const date = new Date(`${weekStartDate}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + dayIndex)
  return date.toISOString()
}

function quantityLabel(quantity: number, unit: MeasurementUnit, locale: Locale): string {
  const value = new Intl.NumberFormat(locale === 'ka' ? 'ka-GE' : 'en-GB', {
    maximumFractionDigits: 2,
  }).format(quantity)
  const labels: Record<Locale, Record<MeasurementUnit, string>> = {
    ka: {
      g: 'გ',
      kg: 'კგ',
      ml: 'მლ',
      l: 'ლ',
      tsp: 'ჩ/კ',
      tbsp: 'ს/კ',
      cup: 'ჭიქა',
      piece: 'ც',
      pack: 'შეკვრა',
    },
    en: {
      g: 'g',
      kg: 'kg',
      ml: 'ml',
      l: 'l',
      tsp: 'tsp',
      tbsp: 'tbsp',
      cup: 'cup',
      piece: 'pcs',
      pack: 'pack',
    },
  }
  return `${value} ${labels[locale][unit]}`
}

export function MockPlanPage({
  locale,
  snapshot,
}: {
  locale: Locale
  snapshot: MockSufraSnapshot
}) {
  const { plan, groceryList, profile } = snapshot
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
              ? 'დემო გენერატორი შენს პროფილს გამოიყენებს და სრულ შვიდდღიან გეგმას, რეცეპტებსა და საყიდლების სიას შექმნის.'
              : 'The demo generator will use your profile to create a complete seven-day plan, recipes, and grocery list.'}
          </p>
          <div className="surface mt-9 rounded-3xl p-7">
            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[var(--paper-deep)] p-4">
                <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                  {translate(locale, 'budget')}
                </p>
                <p className="display-face mt-1 text-3xl">
                  {formatGel(profile.budgetAmountGel, locale)}
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--paper-deep)] p-4">
                <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                  {translate(locale, 'calories')}
                </p>
                <p className="display-face mt-1 text-3xl">{profile.dailyCalorieTarget} / day</p>
              </div>
            </div>
            <GeneratePlanButton locale={locale} />
          </div>
        </section>
      </main>
    )
  }

  const recipes = new Map(snapshot.recipes.map((recipe) => [recipe.id, recipe]))
  const groupedGroceries = new Map<string, NonNullable<typeof groceryList>['items']>()
  for (const item of groceryList?.items ?? []) {
    const aisle = item.aisle[locale]
    groupedGroceries.set(aisle, [...(groupedGroceries.get(aisle) ?? []), item])
  }

  return (
    <main className="min-h-screen pb-24">
      <AppHeader locale={locale} />
      <div className="mx-auto max-w-7xl px-5 pt-8 lg:px-8">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
                02 · {translate(locale, 'weeklyPlan')}
              </p>
              <span className="rounded-full bg-[var(--paper-deep)] px-3 py-1 text-[0.65rem] font-black tracking-wider text-[var(--leaf)] uppercase">
                {locale === 'ka' ? 'ინტერაქტიული დემო' : 'Interactive demo'}
              </span>
            </div>
            <h1 className="display-face mt-3 text-4xl sm:text-5xl">
              {profile.displayName
                ? locale === 'ka'
                  ? `${profile.displayName}-ს კვირა`
                  : `${profile.displayName}’s week`
                : locale === 'ka'
                  ? 'ამ კვირის სუფრა'
                  : 'This week’s table'}
            </h1>
            <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">{plan.summary[locale]}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl bg-[var(--paper-deep)] px-5 py-3 text-right">
              <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                {translate(locale, 'estimated')}
              </p>
              <p className="display-face text-2xl">{formatGel(plan.estimatedCostGel, locale)}</p>
            </div>
            <GeneratePlanButton locale={locale} />
          </div>
        </div>

        <div className="mt-7 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {locale === 'ka'
            ? 'დემო მონაცემები: კვებითი მაჩვენებლები და ქართული მაღაზიის ფასები მხოლოდ პროდუქტის გასატესტადაა.'
            : 'Demo data: nutrition values and Georgian store prices are illustrative and intended for product testing.'}
        </div>

        {plan.warnings.includes('BUDGET_EXCEEDED') ? (
          <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-950">
            {locale === 'ka'
              ? `არჩეული კვებითი მოთხოვნებით, მოწყობილობებითა და ${formatGel(profile.budgetAmountGel, locale)}-იან ზღვარში ხელმისაწვდომი დემო რეცეპტები ვერ ეტევა. ნაჩვენებია ბიუჯეტზე ორიენტირებული შესაბამისი გეგმა. შეცვალე ბიუჯეტი ან მოთხოვნები.`
              : `No eligible combination of the available demo recipes fits the ${formatGel(profile.budgetAmountGel, locale)} ceiling with these dietary and kitchen-equipment choices. This is a budget-conscious matching plan; adjust the budget or preferences to try again.`}
          </div>
        ) : null}

        <section className="mt-10 grid gap-4 lg:grid-cols-7">
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <article className="surface rounded-3xl p-4" key={dayIndex}>
              <p className="text-xs font-black tracking-widest text-[var(--wine)] uppercase">
                {formatDate(dateForDay(plan.weekStartDate, dayIndex), locale)}
              </p>
              <div className="mt-4 space-y-3">
                {plan.meals
                  .filter((meal) => meal.dayIndex === dayIndex)
                  .map((meal) => {
                    const recipe = recipes.get(meal.recipeId)
                    if (!recipe) return null
                    return (
                      <div className="rounded-2xl bg-white/65 p-3" key={meal.id}>
                        <Link
                          className="block transition hover:-translate-y-0.5"
                          href={`/${locale}/recipes/${recipe.id}`}
                        >
                          <span className="text-[0.66rem] font-black tracking-wider text-[var(--leaf)] uppercase">
                            {formatMealSlot(meal.mealSlot, locale)}
                          </span>
                          <h2 className="mt-1 text-sm font-bold leading-5">
                            {recipe.title[locale]}
                          </h2>
                          <p className="mt-2 text-xs leading-5 text-[var(--muted)]">
                            {Math.round(meal.nutrition.calories)} kcal ·{' '}
                            {Math.round(meal.nutrition.proteinG)}g P ·{' '}
                            {Math.round(meal.nutrition.carbohydrateG)}g C ·{' '}
                            {Math.round(meal.nutrition.fatG)}g F
                          </p>
                          <p className="mt-2 text-[0.68rem] font-bold text-[var(--wine)]">
                            {recipe.prepMinutes + recipe.cookMinutes} min ·{' '}
                            {locale === 'ka' ? 'რეცეპტის ნახვა →' : 'View recipe →'}
                          </p>
                        </Link>
                        {meal.alternativeRecipeIds.length ? (
                          <details className="mt-3 border-t border-[var(--line)] pt-2">
                            <summary className="cursor-pointer text-[0.68rem] font-black tracking-wide text-[var(--leaf)] uppercase">
                              {locale === 'ka' ? 'კერძის შეცვლა' : 'Swap meal'}
                            </summary>
                            <div className="mt-2 space-y-2">
                              {meal.alternativeRecipeIds.map((recipeId) => {
                                const alternative = recipes.get(recipeId)
                                if (!alternative) return null
                                return (
                                  <form
                                    action={swapMockMealAction.bind(
                                      null,
                                      meal.id,
                                      recipeId,
                                      locale,
                                    )}
                                    key={recipeId}
                                  >
                                    <button
                                      className="w-full rounded-xl border border-[var(--line)] bg-white px-2 py-2 text-left text-xs font-semibold transition hover:border-[var(--leaf)]"
                                      type="submit"
                                    >
                                      {alternative.title[locale]}
                                    </button>
                                  </form>
                                )
                              })}
                            </div>
                          </details>
                        ) : null}
                        <form
                          action={setMockMealServingsAction.bind(null, meal.id, locale)}
                          className="mt-3 flex items-end gap-2 border-t border-[var(--line)] pt-2"
                        >
                          <label className="min-w-0 flex-1 text-[0.68rem] font-bold text-[var(--muted)]">
                            {locale === 'ka' ? 'ულუფები' : 'Servings'}
                            <input
                              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-2 py-1.5 text-xs text-[var(--ink)]"
                              defaultValue={meal.servings}
                              max="100"
                              min="0.25"
                              name="servings"
                              required
                              step="0.25"
                              type="number"
                            />
                          </label>
                          <button
                            className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--leaf)]"
                            type="submit"
                          >
                            {locale === 'ka' ? 'შენახვა' : 'Save'}
                          </button>
                        </form>
                      </div>
                    )
                  })}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-8 lg:grid-cols-[0.68fr_0.32fr]">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
              03 · {translate(locale, 'groceryList')}
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <h2 className="display-face text-4xl">{translate(locale, 'groceryList')}</h2>
              <p className="text-sm font-bold text-[var(--leaf)]">
                {groceryList?.store[locale]} ·{' '}
                {formatGel(groceryList?.estimatedTotalGel ?? 0, locale)}
              </p>
            </div>
            <PriceCoverage
              items={(groceryList?.items ?? []).map((item) => ({
                purchaseQuantity: item.purchaseQuantity,
                estimatedCostGel: item.estimatedCostGel,
                metadata: item.priceObservation,
              }))}
              locale={locale}
            />
            <div className="surface mt-6 rounded-3xl px-5 py-2">
              {[...groupedGroceries.entries()].map(([aisle, items]) => (
                <div className="border-b border-[var(--line)] py-3 last:border-0" key={aisle}>
                  <p className="mb-1 text-[0.68rem] font-black tracking-widest text-[var(--wine)] uppercase">
                    {aisle}
                  </p>
                  {items.map((item) => (
                    <div className="flex items-center gap-4 py-3" key={item.id}>
                      <GroceryCheckbox id={item.id} initialChecked={item.checked} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`font-semibold ${item.checked ? 'text-[var(--muted)] line-through' : ''}`}
                        >
                          {item.name[locale]}
                        </p>
                        {item.pantryDeductionGrams > 0 ? (
                          <p className="text-xs text-[var(--muted)]">
                            {locale === 'ka' ? 'მარაგიდან გამოკლებულია' : 'Deducted from pantry'}{' '}
                            {item.pantryDeductionGrams}g
                          </p>
                        ) : null}
                        <PriceFreshnessBadge locale={locale} metadata={item.priceObservation} />
                      </div>
                      <span className="text-sm font-bold">
                        {quantityLabel(item.purchaseQuantity, item.purchaseUnit, locale)}
                      </span>
                      <span className="w-16 text-right text-sm text-[var(--muted)]">
                        {formatGel(item.estimatedCostGel, locale)}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <aside className="surface h-fit rounded-3xl p-6">
            <p className="text-xs font-black tracking-widest text-[var(--muted)] uppercase">
              {locale === 'ka' ? 'კვირის საშუალო' : 'Daily average'}
            </p>
            <p className="display-face mt-2 text-4xl">
              {Math.round(plan.averageDailyNutrition.calories)}
            </p>
            <p className="text-sm text-[var(--muted)]">kcal / {locale === 'ka' ? 'დღე' : 'day'}</p>
            <dl className="mt-6 space-y-3 text-sm">
              {[
                [locale === 'ka' ? 'ცილა' : 'Protein', plan.averageDailyNutrition.proteinG],
                [
                  locale === 'ka' ? 'ნახშირწყალი' : 'Carbs',
                  plan.averageDailyNutrition.carbohydrateG,
                ],
                [locale === 'ka' ? 'ცხიმი' : 'Fat', plan.averageDailyNutrition.fatG],
                [locale === 'ka' ? 'ბოჭკო' : 'Fibre', plan.averageDailyNutrition.fiberG],
              ].map(([label, value]) => (
                <div className="flex justify-between" key={String(label)}>
                  <dt>{label}</dt>
                  <dd className="font-bold">{Math.round(Number(value))} g</dd>
                </div>
              ))}
            </dl>
            <Link
              className="quiet-button mt-6 block text-center text-sm"
              href={`/${locale}/onboarding`}
            >
              {locale === 'ka' ? 'მიზნების შეცვლა' : 'Edit targets'}
            </Link>
          </aside>
        </section>
      </div>
    </main>
  )
}
