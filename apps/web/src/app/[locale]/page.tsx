import { translate } from '@sufra/shared'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { Brand } from '@/components/brand'
import { LocaleSwitcher } from '@/components/locale-switcher'
import { requireLocale } from '@/lib/locale'
import { isMockMode } from '@/lib/data-mode'
import { readMockState } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = requireLocale((await params).locale)
  if (isMockMode()) {
    const state = await readMockState()
    if (state.session) {
      redirect(state.onboardingComplete ? `/${locale}/plan` : `/${locale}/onboarding`)
    }
  } else {
    const supabase = await createClient()
    const claimsResult = await supabase.auth.getClaims()
    if (claimsResult.data?.claims?.sub) {
      const profileResult = await supabase
        .from('profiles')
        .select('onboarding_completed_at')
        .single()
      redirect(
        profileResult.data?.onboarding_completed_at ? `/${locale}/plan` : `/${locale}/onboarding`,
      )
    }
  }

  const copy =
    locale === 'ka'
      ? {
          eyebrow: 'საქართველოში შექმნილი ყოველდღიური დამხმარე',
          title: 'კვირის სუფრა შენს ბიუჯეტზე, მიზნებსა და სამზარეულოზე მორგებული.',
          body: 'მიუთითე მაღაზია, ბიუჯეტი, კვების მიზნები და სახლში არსებული ტექნიკა თუ ინვენტარი. Sufra დაგიგეგმავს შვიდ დღეს, რეცეპტებს და ერთიან საყიდლების სიას.',
          start: 'დაიწყე დაგეგმვა',
          budget: 'ბიუჯეტის კონტროლი',
          budgetBody:
            'ფასები ქართულ სუპერმარკეტებთან არის მიბმული და დაუზუსტებელი პოზიციები ცხადად ინიშნება.',
          nutrition: 'სანდო მაკროები',
          nutritionBody:
            'AI ირჩევს რეცეპტებს; კალორიებსა და მაკროებს სისტემა ინგრედიენტებიდან თავიდან ითვლის.',
          groceries: 'ერთი ჭკვიანი სია',
          groceriesBody:
            'ერთნაირი პროდუქტები ერთიანდება, მარაგი აკლდება და ყველაფერი დახლების მიხედვით ლაგდება.',
        }
      : {
          eyebrow: 'A daily planning companion made for Georgia',
          title: 'A weekly table shaped around your budget, goals, and kitchen.',
          body: 'Choose your store, budget, nutrition goals, and equipment. Sufra plans seven days of meals, recipes, and one consolidated grocery list.',
          start: 'Start planning',
          budget: 'Budget-aware',
          budgetBody:
            'Prices map to Georgian supermarkets, with unknown or stale estimates labeled clearly.',
          nutrition: 'Verified math',
          nutritionBody:
            'AI schedules approved recipes; Sufra recalculates calories and macros from ingredients.',
          groceries: 'One smart list',
          groceriesBody:
            'Duplicate items merge, pantry stock is subtracted, and the result is sorted by aisle.',
        }

  return (
    <main className="min-h-screen overflow-hidden">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8">
        <Brand locale={locale} />
        <div className="flex items-center gap-2">
          <LocaleSwitcher locale={locale} />
          <Link className="primary-button text-sm" href={`/${locale}/sign-in`}>
            {translate(locale, 'signIn')}
          </Link>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-12 px-5 pt-14 pb-20 lg:grid-cols-[1.12fr_0.88fr] lg:px-8 lg:pt-24">
        <div>
          <p className="mb-5 text-xs font-black tracking-[0.22em] text-[var(--wine)] uppercase">
            {copy.eyebrow}
          </p>
          <h1 className="display-face max-w-4xl text-5xl leading-[1.03] sm:text-6xl lg:text-7xl">
            {copy.title}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-[var(--muted)]">{copy.body}</p>
          <Link className="primary-button mt-9 inline-block" href={`/${locale}/sign-in`}>
            {copy.start} →
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-xl">
          <div className="absolute -inset-10 -z-10 rotate-3 rounded-[4rem] bg-[rgba(125,38,61,0.07)]" />
          <div className="surface rounded-[2rem] p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold tracking-widest text-[var(--muted)] uppercase">
                  Sufra · 7 days
                </p>
                <p className="display-face mt-1 text-3xl">ოჯახური კვირა</p>
              </div>
              <span className="rounded-full bg-[rgba(71,98,74,0.12)] px-3 py-1 text-sm font-bold text-[var(--leaf)]">
                ₾ 148
              </span>
            </div>
            {[
              ['ორშ', 'წიწიბურა ქათმით', '520 kcal'],
              ['სამ', 'ლობიო და მჭადი', '610 kcal'],
              ['ოთხ', 'აჯაფსანდალი', '480 kcal'],
              ['ხუთ', 'თევზი ღუმელში', '560 kcal'],
            ].map(([day, meal, kcal], index) => (
              <div className="flex items-center gap-4 border-t border-[var(--line)] py-4" key={day}>
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[var(--paper-deep)] text-xs font-black">
                  {day}
                </span>
                <span className="min-w-0 flex-1 font-semibold">{meal}</span>
                <span className="text-sm text-[var(--muted)]">{kcal}</span>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${index % 2 ? 'bg-[var(--gold)]' : 'bg-[var(--leaf)]'}`}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-4 px-5 pb-20 md:grid-cols-3 lg:px-8">
        {[
          [copy.budget, copy.budgetBody, '₾'],
          [copy.nutrition, copy.nutritionBody, '◎'],
          [copy.groceries, copy.groceriesBody, '✓'],
        ].map(([title, body, icon]) => (
          <article className="surface rounded-3xl p-6" key={title}>
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[var(--paper-deep)] text-lg font-black text-[var(--wine)]">
              {icon}
            </span>
            <h2 className="display-face mt-5 text-2xl">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{body}</p>
          </article>
        ))}
      </section>
    </main>
  )
}
