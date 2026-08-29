import type { Locale } from '@sufra/shared/schemas'
import { notFound } from 'next/navigation'

export const locales = ['ka', 'en'] as const

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale)
}

export function requireLocale(value: string): Locale {
  if (!isLocale(value)) notFound()
  return value
}
