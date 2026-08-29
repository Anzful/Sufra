import { translate } from '@sufra/shared'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { AuthForm } from '@/components/auth-form'
import { Brand } from '@/components/brand'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { requireLocale } from '@/lib/locale'
import { isMockMode } from '@/lib/data-mode'
import { readMockState } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale)
  if (isMockMode()) {
    if ((await readMockState()).session) redirect(`/${locale}/plan`)
  } else {
    const supabase = await createClient()
    const claims = await supabase.auth.getClaims()
    if (claims.data?.claims?.sub) redirect(`/${locale}`)
  }

  return (
    <main className="min-h-screen px-5 py-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Brand locale={locale} />
        <LocaleSwitcher locale={locale} />
      </header>
      <section className="mx-auto grid max-w-6xl items-center gap-12 pt-16 lg:grid-cols-2 lg:pt-24">
        <div className="max-w-xl">
          <p className="text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
            {locale === 'ka' ? 'შენი კვირა აქ იწყება' : 'Your week starts here'}
          </p>
          <h1 className="display-face mt-4 text-5xl leading-tight">
            {locale === 'ka'
              ? 'სუფრასთან ყველასთვის არის ადგილი.'
              : 'There is always room at the table.'}
          </h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted)]">
            {locale === 'ka'
              ? 'შედი არსებულ ანგარიშში ან შექმენი ახალი — პირველ გეგმამდე მხოლოდ რამდენიმე კითხვა დაგრჩება.'
              : 'Sign in or create an account. A few thoughtful questions are all that stand between you and your first plan.'}
          </p>
        </div>
        <div className="surface rounded-[2rem] p-7 sm:p-9">
          <h2 className="display-face text-3xl">{translate(locale, 'signIn')}</h2>
          <p className="mb-6 mt-2 text-sm text-[var(--muted)]">
            {translate(locale, 'brandTagline')}
          </p>
          <AuthForm locale={locale} />
          <Link
            className="mt-6 block text-center text-sm font-semibold text-[var(--wine)]"
            href={`/${locale}`}
          >
            ← {locale === 'ka' ? 'მთავარზე დაბრუნება' : 'Back home'}
          </Link>
        </div>
      </section>
    </main>
  )
}
