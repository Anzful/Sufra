import type { Locale } from '@sufra/shared/schemas'

import { requireLocale } from '@/lib/locale'

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{ children: React.ReactNode; params: Promise<{ locale: string }> }>) {
  requireLocale((await params).locale)
  return children
}

export function generateStaticParams(): Array<{ locale: Locale }> {
  return [{ locale: 'ka' }, { locale: 'en' }]
}
