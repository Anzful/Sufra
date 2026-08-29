import { translate, type Locale } from '@sufra/shared'
import Link from 'next/link'

import { signOutAction } from '@/app/auth-actions'

import { Brand } from './brand'
import { LocaleSwitcher } from './locale-switcher'

export function AppHeader({ locale }: { locale: Locale }) {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
      <Brand locale={locale} />
      <nav className="flex items-center gap-2" aria-label="Primary navigation">
        <Link
          className="hidden rounded-full px-4 py-2 text-sm font-semibold sm:block"
          href={`/${locale}/plan`}
        >
          {translate(locale, 'weeklyPlan')}
        </Link>
        <Link
          className="hidden rounded-full px-4 py-2 text-sm font-semibold sm:block"
          href={`/${locale}/onboarding`}
        >
          {translate(locale, 'settings')}
        </Link>
        <LocaleSwitcher locale={locale} />
        <form action={signOutAction}>
          <input name="locale" type="hidden" value={locale} />
          <button className="quiet-button text-sm" type="submit">
            {translate(locale, 'signOut')}
          </button>
        </form>
      </nav>
    </header>
  )
}
