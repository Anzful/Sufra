import type { Locale } from '@sufra/shared'
import { redirect } from 'next/navigation'

import { AppHeader } from '@/components/app-header'
import { isMockMode } from '@/lib/data-mode'
import { requireLocale } from '@/lib/locale'
import { readMockSnapshot } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'

import { removePantryItemAction, savePantryItemAction } from './actions'

interface NormalizedIngredient {
  id: string
  name: string
}

interface NormalizedPantryItem {
  id: string
  ingredientId: string
  name: string
  quantityGrams: number
  expiresOn: string | null
}

interface TranslationRow {
  locale: Locale
  name: string
}

function localized(rows: TranslationRow[], locale: Locale): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '·'
}

export default async function PantryPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale)
  const mockMode = isMockMode()
  let ingredients: NormalizedIngredient[] = []
  let pantryItems: NormalizedPantryItem[] = []

  if (mockMode) {
    const snapshot = await readMockSnapshot()
    if (!snapshot.session) redirect(`/${locale}/sign-in`)
    ingredients = snapshot.ingredients.map((ingredient) => ({
      id: ingredient.id,
      name: ingredient.name[locale],
    }))
    pantryItems = snapshot.pantryItems.map((item) => ({
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.name[locale],
      quantityGrams: item.quantityGrams,
      expiresOn: item.expiresOn,
    }))
  } else {
    const supabase = await createClient()
    const claims = await supabase.auth.getClaims()
    const userId = claims.data?.claims?.sub
    if (!userId) redirect(`/${locale}/sign-in`)
    const [ingredientsResult, pantryResult] = await Promise.all([
      supabase
        .from('ingredients')
        .select('id, ingredient_translations(locale, name)')
        .eq('is_active', true)
        .order('canonical_code'),
      supabase
        .from('pantry_items')
        .select(
          'id, ingredient_id, quantity, quantity_grams, expires_on, ingredients!inner(ingredient_translations(locale, name))',
        )
        .eq('user_id', userId)
        .order('created_at'),
    ])
    if (ingredientsResult.error) throw new Error(ingredientsResult.error.message)
    if (pantryResult.error) throw new Error(pantryResult.error.message)

    ingredients = (ingredientsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: localized(row.ingredient_translations as TranslationRow[], locale),
    }))
    pantryItems = (pantryResult.data ?? []).map((row) => {
      const ingredient = row.ingredients as unknown as { ingredient_translations: TranslationRow[] }
      return {
        id: row.id,
        ingredientId: String(row.ingredient_id),
        name: localized(ingredient.ingredient_translations, locale),
        quantityGrams: Number(row.quantity_grams ?? row.quantity),
        expiresOn: row.expires_on,
      }
    })
  }

  return (
    <main className="min-h-screen pb-24">
      <AppHeader locale={locale} />
      <section className="mx-auto max-w-5xl px-5 pt-8 lg:px-8">
        <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
          04 · {locale === 'ka' ? 'სამზარეულოს მარაგი' : 'Kitchen pantry'}
        </p>
        <h1 className="display-face mt-3 text-4xl sm:text-5xl">
          {locale === 'ka' ? 'რა გვაქვს სახლში?' : 'What is already at home?'}
        </h1>
        <p className="mt-4 max-w-3xl leading-7 text-[var(--muted)]">
          {mockMode
            ? locale === 'ka'
              ? 'Sufra ამ მარაგს საყიდლების სიიდან ავტომატურად გამოკლებს. იგივე პროდუქტის დამატება მის რაოდენობას განაახლებს.'
              : 'Sufra subtracts this stock from the grocery list automatically. Adding the same ingredient again updates its quantity.'
            : locale === 'ka'
              ? 'Sufra ამ მარაგს შემდეგი გეგმისა და საყიდლების სიის გამოთვლისას გამოიყენებს.'
              : 'Sufra will use this stock the next time it calculates a plan and grocery list.'}
        </p>

        <form
          action={savePantryItemAction.bind(null, locale)}
          className="surface mt-8 grid gap-4 rounded-3xl p-5 md:grid-cols-[1.5fr_0.7fr_0.8fr_auto] md:items-end"
        >
          <label className="grid gap-2 text-sm font-bold">
            {locale === 'ka' ? 'პროდუქტი' : 'Ingredient'}
            <select
              className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-3 font-normal"
              name="ingredientId"
              required
            >
              {ingredients.map((ingredient) => (
                <option key={ingredient.id} value={ingredient.id}>
                  {ingredient.name}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold">
            {locale === 'ka' ? 'რაოდენობა (გ)' : 'Quantity (g)'}
            <input
              className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-3 font-normal"
              max="100000"
              min="1"
              name="quantityGrams"
              required
              step="0.1"
              type="number"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold">
            {locale === 'ka' ? 'ვარგისია (არასავალდებულო)' : 'Expires (optional)'}
            <input
              className="min-h-12 rounded-xl border border-[var(--line)] bg-white px-3 font-normal"
              name="expiresOn"
              type="date"
            />
          </label>
          <button className="primary-button min-h-12" type="submit">
            {locale === 'ka' ? 'შენახვა' : 'Save'}
          </button>
        </form>

        <div className="surface mt-6 rounded-3xl px-5">
          {pantryItems.map((item) => (
            <div
              className="flex items-center gap-4 border-b border-[var(--line)] py-4 last:border-0"
              key={item.id}
            >
              <div className="min-w-0 flex-1">
                <p className="font-bold">{item.name}</p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {item.quantityGrams.toLocaleString(locale === 'ka' ? 'ka-GE' : 'en-GB')} g
                  {item.expiresOn
                    ? ` · ${locale === 'ka' ? 'ვარგისია' : 'expires'} ${item.expiresOn}`
                    : ''}
                </p>
              </div>
              <form action={removePantryItemAction.bind(null, locale, item.id)}>
                <button className="quiet-button text-sm" type="submit">
                  {locale === 'ka' ? 'წაშლა' : 'Remove'}
                </button>
              </form>
            </div>
          ))}
          {!pantryItems.length ? (
            <p className="py-10 text-center text-[var(--muted)]">
              {locale === 'ka' ? 'მარაგი ჯერ ცარიელია.' : 'Your pantry is empty.'}
            </p>
          ) : null}
        </div>
      </section>
    </main>
  )
}
