import type { Locale } from '@sufra/shared'
import { createContext, useContext, useMemo, useState } from 'react'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

const LocaleContext = createContext<LocaleState | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ka')
  const value = useMemo(() => ({ locale, setLocale }), [locale])
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleState {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale must be called inside LocaleProvider.')
  return value
}
