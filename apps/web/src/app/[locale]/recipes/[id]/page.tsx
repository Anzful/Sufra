import { type Locale, type MeasurementUnit } from '@sufra/shared'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'

import { AppHeader } from '@/components/app-header'
import { isMockMode } from '@/lib/data-mode'
import { requireLocale } from '@/lib/locale'
import { readMockSnapshot } from '@/lib/mock-server'

function amount(quantity: number, unit: MeasurementUnit, locale: Locale): string {
  const units: Record<Locale, Record<MeasurementUnit, string>> = {
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
  return `${quantity} ${units[locale][unit]}`
}

export default async function RecipePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}) {
  const values = await params
  const locale = requireLocale(values.locale)
  if (!isMockMode()) redirect(`/${locale}/plan`)
  const snapshot = await readMockSnapshot()
  if (!snapshot.session) redirect(`/${locale}/sign-in`)
  const recipe = snapshot.recipes.find((item) => item.id === values.id)
  if (!recipe) notFound()

  return (
    <main className="min-h-screen pb-24">
      <AppHeader locale={locale} />
      <article className="mx-auto max-w-5xl px-5 pt-8 lg:px-8">
        <Link className="text-sm font-bold text-[var(--wine)]" href={`/${locale}/plan`}>
          ← {locale === 'ka' ? 'კვირის გეგმაზე დაბრუნება' : 'Back to weekly plan'}
        </Link>
        <div className="mt-9 grid gap-8 lg:grid-cols-[1fr_0.45fr]">
          <div>
            <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
              {locale === 'ka' ? 'რეცეპტი' : 'Recipe'}
            </p>
            <h1 className="display-face mt-3 text-5xl leading-tight">{recipe.title[locale]}</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              {recipe.description[locale]}
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
              <span className="rounded-full bg-[var(--paper-deep)] px-3 py-2">
                {recipe.prepMinutes + recipe.cookMinutes} min
              </span>
              <span className="rounded-full bg-[var(--paper-deep)] px-3 py-2">
                {recipe.baseServings} {locale === 'ka' ? 'პორცია' : 'servings'}
              </span>
              {recipe.applianceSlugs.map((slug) => (
                <span className="rounded-full bg-[var(--paper-deep)] px-3 py-2" key={slug}>
                  {snapshot.appliances
                    .find((item) => item.slug === slug)
                    ?.translations.find((item) => item.locale === locale)?.name ?? slug}
                </span>
              ))}
            </div>
          </div>
          <div className="surface grid grid-cols-2 gap-3 rounded-3xl p-5">
            {[
              ['kcal', Math.round(recipe.nutritionPerServing.calories)],
              [
                locale === 'ka' ? 'ცილა' : 'Protein',
                `${Math.round(recipe.nutritionPerServing.proteinG)}g`,
              ],
              [
                locale === 'ka' ? 'ნახშირწყალი' : 'Carbs',
                `${Math.round(recipe.nutritionPerServing.carbohydrateG)}g`,
              ],
              [
                locale === 'ka' ? 'ცხიმი' : 'Fat',
                `${Math.round(recipe.nutritionPerServing.fatG)}g`,
              ],
            ].map(([label, value]) => (
              <div
                className="rounded-2xl bg-[var(--paper-deep)] p-4 text-center"
                key={String(label)}
              >
                <p className="display-face text-2xl">{value}</p>
                <p className="mt-1 text-[0.65rem] font-black tracking-wider text-[var(--muted)] uppercase">
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[0.42fr_0.58fr]">
          <section>
            <h2 className="display-face text-3xl">
              {locale === 'ka' ? 'ინგრედიენტები' : 'Ingredients'}
            </h2>
            <div className="surface mt-5 divide-y divide-[var(--line)] rounded-3xl px-5">
              {recipe.ingredients.map((ingredient) => (
                <div className="flex gap-4 py-4" key={ingredient.id}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {ingredient.name[locale]}
                      {ingredient.optional
                        ? ` (${locale === 'ka' ? 'სურვილისამებრ' : 'optional'})`
                        : ''}
                    </p>
                    {ingredient.preparationNote ? (
                      <p className="mt-1 text-xs text-[var(--muted)]">
                        {ingredient.preparationNote[locale]}
                      </p>
                    ) : null}
                  </div>
                  <p className="text-sm font-bold text-[var(--muted)]">
                    {amount(ingredient.quantity, ingredient.unit, locale)}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section>
            <h2 className="display-face text-3xl">{locale === 'ka' ? 'მომზადება' : 'Method'}</h2>
            <ol className="surface mt-5 rounded-3xl px-6">
              {recipe.steps.map((step) => (
                <li
                  className="flex gap-5 border-b border-[var(--line)] py-5 last:border-0"
                  key={step.stepNumber}
                >
                  <span className="display-face text-3xl text-[var(--wine)]">
                    {step.stepNumber}
                  </span>
                  <div>
                    <p className="leading-7">{step.instruction[locale]}</p>
                    {step.durationMinutes || step.temperatureCelsius ? (
                      <p className="mt-2 text-xs font-bold text-[var(--leaf)]">
                        {step.durationMinutes ? `${step.durationMinutes} min` : ''}
                        {step.durationMinutes && step.temperatureCelsius ? ' · ' : ''}
                        {step.temperatureCelsius ? `${step.temperatureCelsius}°C` : ''}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 rounded-2xl bg-[var(--paper-deep)] p-5">
              <p className="text-xs font-black tracking-widest text-[var(--wine)] uppercase">
                {locale === 'ka' ? 'რჩევა' : 'Tip'}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{recipe.tips[locale]}</p>
            </div>
          </section>
        </div>
      </article>
    </main>
  )
}
