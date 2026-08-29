import {
  classifyPriceFreshness,
  priceObservationAgeDays,
  summarizePriceCoverage,
  type Locale,
  type PriceFreshness,
} from '@sufra/shared'

export interface PriceMetadata {
  observedAt: string | null
  validTo: string | null
  source: 'manual' | 'retailer' | 'government' | 'partner' | null
  sourceUrl: string | null
  isPromotion: boolean
  regularPriceGel: number | null
}

const statusClasses: Record<PriceFreshness, string> = {
  fresh: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  aging: 'border-amber-200 bg-amber-50 text-amber-800',
  stale: 'border-orange-200 bg-orange-50 text-orange-800',
  expired: 'border-red-200 bg-red-50 text-red-800',
  unavailable: 'border-slate-200 bg-slate-50 text-slate-600',
}

function sourceLabel(source: PriceMetadata['source'], locale: Locale): string {
  const labels = {
    ka: {
      government: 'eKalata',
      retailer: 'მაღაზია',
      partner: 'პარტნიორი',
      manual: 'ხელით',
      unknown: 'წყარო უცნობია',
    },
    en: {
      government: 'eKalata',
      retailer: 'Retailer',
      partner: 'Partner',
      manual: 'Manual',
      unknown: 'Unknown source',
    },
  } as const
  return labels[locale][source ?? 'unknown']
}

function freshnessLabel(status: PriceFreshness, observedAt: string | null, locale: Locale): string {
  const age = priceObservationAgeDays(observedAt)
  if (status === 'unavailable') return locale === 'ka' ? 'ფასი ვერ მოიძებნა' : 'No matched price'
  if (status === 'expired') return locale === 'ka' ? 'შეთავაზება დასრულდა' : 'Offer expired'
  const dayLabel = locale === 'ka' ? `${age ?? 0} დღის წინ` : `${age ?? 0}d ago`
  if (status === 'fresh') return locale === 'ka' ? `განახლდა ${dayLabel}` : `Updated ${dayLabel}`
  if (status === 'aging')
    return locale === 'ka' ? `გადაამოწმე · ${dayLabel}` : `Check price · ${dayLabel}`
  return locale === 'ka' ? `ძველი ფასი · ${dayLabel}` : `Stale price · ${dayLabel}`
}

export function PriceFreshnessBadge({
  metadata,
  locale,
}: {
  metadata: PriceMetadata | null
  locale: Locale
}) {
  const status = classifyPriceFreshness({
    observedAt: metadata?.observedAt ?? null,
    validTo: metadata?.validTo ?? null,
  })
  return (
    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[0.64rem]">
      <span className={`rounded-full border px-2 py-0.5 font-bold ${statusClasses[status]}`}>
        {freshnessLabel(status, metadata?.observedAt ?? null, locale)}
      </span>
      {metadata?.isPromotion ? (
        <span className="rounded-full bg-[var(--wine)] px-2 py-0.5 font-black text-white">
          {locale === 'ka' ? 'აქცია' : 'Promo'}
        </span>
      ) : null}
      {metadata ? (
        metadata.sourceUrl ? (
          <a
            className="font-bold text-[var(--leaf)] underline-offset-2 hover:underline"
            href={metadata.sourceUrl}
            rel="noreferrer"
            target="_blank"
          >
            {sourceLabel(metadata.source, locale)} ↗
          </a>
        ) : (
          <span className="font-bold text-[var(--muted)]">
            {sourceLabel(metadata.source, locale)}
          </span>
        )
      ) : null}
    </div>
  )
}

export function PriceCoverage({
  items,
  locale,
}: {
  items: Array<{
    purchaseQuantity: number
    estimatedCostGel: number | null
    metadata: PriceMetadata | null
  }>
  locale: Locale
}) {
  const summary = summarizePriceCoverage(
    items.map((item) => ({
      purchaseQuantity: item.purchaseQuantity,
      estimatedCostGel: item.estimatedCostGel,
      observedAt: item.metadata?.observedAt ?? null,
      validTo: item.metadata?.validTo ?? null,
    })),
  )
  const cautionCount = summary.agingItemCount + summary.staleItemCount + summary.expiredItemCount

  return (
    <div className="mt-5 grid gap-3 rounded-2xl border border-[var(--line)] bg-white/60 p-4 sm:grid-cols-3">
      <div>
        <p className="text-[0.64rem] font-black tracking-widest text-[var(--muted)] uppercase">
          {locale === 'ka' ? 'ფასების დაფარვა' : 'Price coverage'}
        </p>
        <p className="mt-1 text-lg font-black text-[var(--ink)]">
          {summary.pricedItemCount}/{summary.requiredItemCount} · {summary.coveragePercent}%
        </p>
      </div>
      <div>
        <p className="text-[0.64rem] font-black tracking-widest text-[var(--muted)] uppercase">
          {locale === 'ka' ? 'ახალი ფასები' : 'Current prices'}
        </p>
        <p className="mt-1 text-lg font-black text-emerald-800">{summary.freshItemCount}</p>
      </div>
      <div>
        <p className="text-[0.64rem] font-black tracking-widest text-[var(--muted)] uppercase">
          {locale === 'ka' ? 'საჭიროებს შემოწმებას' : 'Needs checking'}
        </p>
        <p className="mt-1 text-lg font-black text-amber-800">
          {cautionCount + summary.unavailableItemCount}
        </p>
      </div>
    </div>
  )
}
