function datePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  return { year: value('year'), month: value('month'), day: value('day') }
}

/** Returns the ISO date of the Monday containing `date` in the requested time zone. */
export function getWeekStartDate(date = new Date(), timeZone = 'Asia/Tbilisi'): string {
  const { year, month, day } = datePartsInTimeZone(date, timeZone)
  const calendarDate = new Date(Date.UTC(year, month - 1, day))
  const daysSinceMonday = (calendarDate.getUTCDay() + 6) % 7
  calendarDate.setUTCDate(calendarDate.getUTCDate() - daysSinceMonday)
  return calendarDate.toISOString().slice(0, 10)
}
