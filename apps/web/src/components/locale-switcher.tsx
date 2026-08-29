'use client'

import type { Locale } from '@sufra/shared/schemas'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export function LocaleSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname()
  useEffect(() => {
    document.cookie = `sufra-locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`
  }, [locale])
  const otherLocale = locale === 'ka' ? 'en' : 'ka'
  const target = pathname.replace(/^\/(ka|en)(?=\/|$)/, `/${otherLocale}`)
  return (
    <Link className="quiet-button text-sm" href={target || `/${otherLocale}`}>
      {otherLocale === 'ka' ? 'ქართული' : 'English'}
    </Link>
  )
}
