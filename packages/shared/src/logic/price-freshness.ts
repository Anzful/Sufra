const DAY_MS = 24 * 60 * 60 * 1_000

export type PriceFreshness = 'fresh' | 'aging' | 'stale' | 'expired' | 'unavailable'

export interface PriceObservationInput {
  observedAt: string | null
  validTo?: string | null
}

export interface PriceCoverageItem extends PriceObservationInput {
  estimatedCostGel: number | null
  purchaseQuantity: number
}

export interface PriceCoverageSummary {
  requiredItemCount: number
  pricedItemCount: number
  freshItemCount: number
  agingItemCount: number
  staleItemCount: number
  expiredItemCount: number
  unavailableItemCount: number
  coveragePercent: number
}

function timestamp(value: string | null | undefined): number | null {
  if (!value) return null
  const parsed = Date.parse(value)
  return Number.isFinite(parsed) ? parsed : null
}

/**
 * Classifies volatile supermarket observations for display. Seven days is
 * current, 8–30 days needs caution, and anything older is visibly stale.
 */
export function classifyPriceFreshness(
  observation: PriceObservationInput,
  now: Date = new Date(),
): PriceFreshness {
  const observedAt = timestamp(observation.observedAt)
  if (observedAt === null) return 'unavailable'

  const validTo = timestamp(observation.validTo)
  if (validTo !== null && validTo < now.getTime()) return 'expired'

  const ageDays = Math.max(0, Math.floor((now.getTime() - observedAt) / DAY_MS))
  if (ageDays <= 7) return 'fresh'
  if (ageDays <= 30) return 'aging'
  return 'stale'
}

export function priceObservationAgeDays(
  observedAt: string | null,
  now: Date = new Date(),
): number | null {
  const observed = timestamp(observedAt)
  if (observed === null) return null
  return Math.max(0, Math.floor((now.getTime() - observed) / DAY_MS))
}

export function summarizePriceCoverage(
  items: readonly PriceCoverageItem[],
  now: Date = new Date(),
): PriceCoverageSummary {
  const requiredItems = items.filter((item) => item.purchaseQuantity > 0)
  const statuses = requiredItems.map((item) => classifyPriceFreshness(item, now))
  const pricedItemCount = requiredItems.filter(
    (item) => item.estimatedCostGel !== null && item.observedAt !== null,
  ).length

  const count = (status: PriceFreshness) =>
    statuses.filter((candidate) => candidate === status).length

  return {
    requiredItemCount: requiredItems.length,
    pricedItemCount,
    freshItemCount: count('fresh'),
    agingItemCount: count('aging'),
    staleItemCount: count('stale'),
    expiredItemCount: count('expired'),
    unavailableItemCount: count('unavailable'),
    coveragePercent:
      requiredItems.length === 0 ? 100 : Math.round((pricedItemCount / requiredItems.length) * 100),
  }
}
