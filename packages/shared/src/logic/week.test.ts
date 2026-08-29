import { describe, expect, it } from 'vitest'

import { getWeekStartDate } from './week'

describe('getWeekStartDate', () => {
  it('uses Monday as the beginning of the week', () => {
    expect(getWeekStartDate(new Date('2026-08-29T12:00:00Z'))).toBe('2026-08-24')
  })

  it('uses the requested time zone near a date boundary', () => {
    expect(getWeekStartDate(new Date('2026-08-30T21:30:00Z'), 'Asia/Tbilisi')).toBe('2026-08-31')
  })
})
