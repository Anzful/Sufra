import type { Locale, MealSlot } from '../schemas/common.ts'

const localeTags: Record<Locale, string> = { ka: 'ka-GE', en: 'en-GB' }

export function formatGel(value: number, locale: Locale): string {
  return new Intl.NumberFormat(localeTags[locale], {
    style: 'currency',
    currency: 'GEL',
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatDate(value: Date | string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTags[locale], {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(typeof value === 'string' ? new Date(value) : value)
}

const mealSlotLabels: Record<Locale, Record<MealSlot, string>> = {
  ka: { breakfast: 'საუზმე', lunch: 'სადილი', dinner: 'ვახშამი', snack: 'წახემსება' },
  en: { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' },
}

export function formatMealSlot(value: MealSlot, locale: Locale): string {
  return mealSlotLabels[locale][value]
}
