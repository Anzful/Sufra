'use client'

import type { Locale } from '@sufra/shared'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { FormEvent } from 'react'

import { updateLiveMealAction } from '@/app/[locale]/plan/actions'

interface RecipeOption {
  id: string
  title: string
}

export function MealEditor({
  planId,
  mealId,
  expectedUpdatedAt,
  servings,
  alternatives,
  locale,
}: {
  planId: string
  mealId: string
  expectedUpdatedAt: string
  servings: number
  alternatives: RecipeOption[]
  locale: Locale
}) {
  const router = useRouter()
  const [replacementRecipeId, setReplacementRecipeId] = useState(alternatives[0]?.id ?? '')
  const [message, setMessage] = useState('')
  const [pending, startTransition] = useTransition()

  function run(input: { replacementRecipeId?: string; servings?: number }) {
    setMessage('')
    startTransition(async () => {
      const result = await updateLiveMealAction({
        planId,
        mealId,
        expectedUpdatedAt,
        locale,
        ...input,
      })
      if (result.ok) router.refresh()
      else {
        setMessage(
          locale === 'ka'
            ? 'ცვლილება ვერ შეინახა. განაახლე გვერდი ან სხვა რეცეპტი სცადე.'
            : 'Could not save the edit. Refresh the page or try another recipe.',
        )
      }
    })
  }

  function updateServings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = Number(new FormData(event.currentTarget).get('servings'))
    run({ servings: value })
  }

  return (
    <div className="mt-3 space-y-3 border-t border-[var(--line)] pt-3">
      <form className="flex items-end gap-2" onSubmit={updateServings}>
        <label className="min-w-0 flex-1 text-[0.68rem] font-bold text-[var(--muted)]">
          {locale === 'ka' ? 'ულუფები' : 'Servings'}
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-2 py-1.5 text-xs text-[var(--ink)]"
            defaultValue={servings}
            max="100"
            min="0.25"
            name="servings"
            required
            step="0.25"
            type="number"
          />
        </label>
        <button
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-1.5 text-xs font-black text-[var(--leaf)] disabled:opacity-50"
          disabled={pending}
          type="submit"
        >
          {locale === 'ka' ? 'შენახვა' : 'Save'}
        </button>
      </form>

      {alternatives.length ? (
        <div>
          <label className="text-[0.68rem] font-bold text-[var(--muted)]">
            {locale === 'ka' ? 'სხვა რეცეპტი' : 'Another recipe'}
            <select
              className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-2 py-1.5 text-xs text-[var(--ink)]"
              onChange={(event) => setReplacementRecipeId(event.target.value)}
              value={replacementRecipeId}
            >
              {alternatives.map((recipe) => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.title}
                </option>
              ))}
            </select>
          </label>
          <button
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-xs font-black text-[var(--leaf)] disabled:opacity-50"
            disabled={pending || !replacementRecipeId}
            onClick={() => run({ replacementRecipeId })}
            type="button"
          >
            {pending
              ? locale === 'ka'
                ? 'ითვლება…'
                : 'Recalculating…'
              : locale === 'ka'
                ? 'რეცეპტის შეცვლა'
                : 'Swap and recalculate'}
          </button>
        </div>
      ) : null}

      {message ? <p className="text-[0.68rem] leading-4 text-red-700">{message}</p> : null}
    </div>
  )
}
