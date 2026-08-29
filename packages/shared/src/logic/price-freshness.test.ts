import { describe, expect, it } from 'vitest'

import {
  classifyPriceFreshness,
  priceObservationAgeDays,
  summarizePriceCoverage,
} from './price-freshness.ts'

const now = new Date('2026-08-30T12:00:00Z')

describe('price freshness', () => {
  it('classifies current, aging, stale, expired, and missing observations', () => {
    expect(classifyPriceFreshness({ observedAt: '2026-08-27T12:00:00Z' }, now)).toBe('fresh')
    expect(classifyPriceFreshness({ observedAt: '2026-08-15T12:00:00Z' }, now)).toBe('aging')
    expect(classifyPriceFreshness({ observedAt: '2026-07-01T12:00:00Z' }, now)).toBe('stale')
    expect(
      classifyPriceFreshness(
        { observedAt: '2026-08-29T12:00:00Z', validTo: '2026-08-29T23:59:59Z' },
        now,
      ),
    ).toBe('expired')
    expect(classifyPriceFreshness({ observedAt: null }, now)).toBe('unavailable')
    expect(priceObservationAgeDays('2026-08-15T12:00:00Z', now)).toBe(15)
  })

  it('summarizes only items that still need to be purchased', () => {
    const summary = summarizePriceCoverage(
      [
        {
          purchaseQuantity: 1,
          estimatedCostGel: 3.5,
          observedAt: '2026-08-29T12:00:00Z',
        },
        {
          purchaseQuantity: 2,
          estimatedCostGel: null,
          observedAt: null,
        },
        {
          purchaseQuantity: 0,
          estimatedCostGel: 0,
          observedAt: null,
        },
      ],
      now,
    )

    expect(summary.requiredItemCount).toBe(2)
    expect(summary.pricedItemCount).toBe(1)
    expect(summary.freshItemCount).toBe(1)
    expect(summary.unavailableItemCount).toBe(1)
    expect(summary.coveragePercent).toBe(50)
  })
})
