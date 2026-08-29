import {
  classifyPriceFreshness,
  formatGel,
  getWeekStartDate,
  priceObservationAgeDays,
  summarizePriceCoverage,
  type Locale,
  type MeasurementUnit,
  type PriceFreshness,
} from '@sufra/shared'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot, setGroceryCheckedMock } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

interface Item {
  id: string
  purchase_quantity: number
  purchase_unit: MeasurementUnit
  estimated_cost_gel: number | null
  is_checked: boolean
  pantry_deduction_quantity?: number
  ingredients: { ingredient_translations: Array<{ locale: Locale; name: string }> }
  aisles: { aisle_translations: Array<{ locale: Locale; name: string }> } | null
  store_pricing: {
    observed_at: string
    valid_to: string | null
    source: 'manual' | 'retailer' | 'government' | 'partner'
    source_url: string | null
    is_promotion: boolean
    regular_price_gel: number | null
  } | null
}

const freshnessColors: Record<PriceFreshness, { background: string; foreground: string }> = {
  fresh: { background: '#e5f5e9', foreground: '#1e6c3d' },
  aging: { background: '#fff4d8', foreground: '#715314' },
  stale: { background: '#fff0df', foreground: '#8a4d12' },
  expired: { background: '#fde8e5', foreground: colors.danger },
  unavailable: { background: colors.paperDeep, foreground: colors.muted },
}

function localizedName(rows: Array<{ locale: Locale; name: string }>, locale: Locale): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '—'
}

function freshnessLabel(item: Item, locale: Locale): string {
  const status = classifyPriceFreshness({
    observedAt: item.store_pricing?.observed_at ?? null,
    validTo: item.store_pricing?.valid_to ?? null,
  })
  const age = priceObservationAgeDays(item.store_pricing?.observed_at ?? null)
  if (status === 'unavailable') return locale === 'ka' ? 'ფასი ვერ მოიძებნა' : 'No matched price'
  if (status === 'expired') return locale === 'ka' ? 'შეთავაზება დასრულდა' : 'Offer expired'
  if (status === 'fresh')
    return locale === 'ka' ? `განახლდა ${age} დღის წინ` : `Updated ${age}d ago`
  if (status === 'aging')
    return locale === 'ka' ? `გადაამოწმე · ${age} დღე` : `Check price · ${age}d`
  return locale === 'ka' ? `ძველი ფასი · ${age} დღე` : `Stale price · ${age}d`
}

function sourceLabel(source: NonNullable<Item['store_pricing']>['source'] | null, locale: Locale) {
  const labels: Record<Locale, Record<string, string>> = {
    ka: { government: 'eKalata', retailer: 'მაღაზია', partner: 'პარტნიორი', manual: 'ხელით' },
    en: { government: 'eKalata', retailer: 'Retailer', partner: 'Partner', manual: 'Manual' },
  }
  return source ? (labels[locale][source] ?? source) : ''
}

export default function GroceryScreen() {
  const { locale } = useLocale()
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    if (isMockMode()) {
      const list = getMockSnapshot().groceryList
      setTotal(list?.estimatedTotalGel ?? null)
      setItems(
        (list?.items ?? []).map((item) => ({
          id: item.id,
          purchase_quantity: item.purchaseQuantity,
          purchase_unit: item.purchaseUnit,
          estimated_cost_gel: item.estimatedCostGel,
          is_checked: item.checked,
          pantry_deduction_quantity: item.pantryDeductionGrams,
          ingredients: {
            ingredient_translations: [
              { locale: 'ka' as const, name: item.name.ka },
              { locale: 'en' as const, name: item.name.en },
            ],
          },
          aisles: {
            aisle_translations: [
              { locale: 'ka' as const, name: item.aisle.ka },
              { locale: 'en' as const, name: item.aisle.en },
            ],
          },
          store_pricing: {
            observed_at: item.priceObservation.observedAt,
            valid_to: item.priceObservation.validTo,
            source: item.priceObservation.source,
            source_url: item.priceObservation.sourceUrl,
            is_promotion: item.priceObservation.isPromotion,
            regular_price_gel: item.priceObservation.regularPriceGel,
          },
        })),
      )
      setLoading(false)
      return
    }
    const plan = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('week_start_date', getWeekStartDate())
      .eq('is_current', true)
      .maybeSingle()
    if (!plan.data) {
      setItems([])
      setLoading(false)
      return
    }
    const list = await supabase
      .from('grocery_lists')
      .select('id, estimated_total_gel')
      .eq('weekly_plan_id', plan.data.id)
      .maybeSingle()
    if (!list.data) {
      setItems([])
      setLoading(false)
      return
    }
    setTotal(list.data.estimated_total_gel === null ? null : Number(list.data.estimated_total_gel))
    const result = await supabase
      .from('grocery_list_items')
      .select(
        `id, purchase_quantity, purchase_unit, estimated_cost_gel, is_checked,
         pantry_deduction_quantity,
         ingredients!inner(ingredient_translations(locale, name)),
         aisles(aisle_translations(locale, name)),
         store_pricing!grocery_list_items_selected_store_pricing_id_fkey(
           observed_at, valid_to, source, source_url, is_promotion, regular_price_gel
         )`,
      )
      .eq('grocery_list_id', list.data.id)
      .order('sort_order')
    setItems((result.data ?? []) as unknown as Item[])
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [locale]),
  )

  async function toggle(item: Item) {
    const next = !item.is_checked
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, is_checked: next } : candidate,
      ),
    )
    const error = isMockMode()
      ? (setGroceryCheckedMock(item.id, next), null)
      : (await supabase.from('grocery_list_items').update({ is_checked: next }).eq('id', item.id))
          .error
    if (error)
      setItems((current) =>
        current.map((candidate) =>
          candidate.id === item.id ? { ...candidate, is_checked: !next } : candidate,
        ),
      )
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.wine} />
      </View>
    )

  const coverage = summarizePriceCoverage(
    items.map((item) => ({
      purchaseQuantity: Number(item.purchase_quantity),
      estimatedCostGel: item.estimated_cost_gel === null ? null : Number(item.estimated_cost_gel),
      observedAt: item.store_pricing?.observed_at ?? null,
      validTo: item.store_pricing?.valid_to ?? null,
    })),
  )

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.wine} />
        }
      >
        <Text style={styles.eyebrow}>03 · {locale === 'ka' ? 'საყიდლები' : 'GROCERIES'}</Text>
        <View style={styles.titleRow}>
          <Title>{locale === 'ka' ? 'საყიდლების სია' : 'Grocery list'}</Title>
          <Text style={styles.total}>{total === null ? '—' : formatGel(total, locale)}</Text>
        </View>
        <Text style={styles.body}>
          {locale === 'ka'
            ? 'პროდუქტები გაერთიანებულია და სამზარეულოს მარაგი უკვე გამოკლებულია.'
            : 'Items are consolidated and your pantry stock has already been subtracted.'}
        </Text>
        <View style={styles.coverage}>
          <View style={styles.coverageMetric}>
            <Text style={styles.coverageLabel}>{locale === 'ka' ? 'დაფარვა' : 'COVERAGE'}</Text>
            <Text style={styles.coverageValue}>
              {coverage.pricedItemCount}/{coverage.requiredItemCount} · {coverage.coveragePercent}%
            </Text>
          </View>
          <View style={styles.coverageMetric}>
            <Text style={styles.coverageLabel}>{locale === 'ka' ? 'ახალი' : 'CURRENT'}</Text>
            <Text style={[styles.coverageValue, { color: colors.leaf }]}>
              {coverage.freshItemCount}
            </Text>
          </View>
          <View style={styles.coverageMetric}>
            <Text style={styles.coverageLabel}>{locale === 'ka' ? 'შესამოწმებელი' : 'CHECK'}</Text>
            <Text style={[styles.coverageValue, { color: '#8a5a12' }]}>
              {coverage.agingItemCount +
                coverage.staleItemCount +
                coverage.expiredItemCount +
                coverage.unavailableItemCount}
            </Text>
          </View>
        </View>
        <View style={styles.list}>
          {items.map((item) => {
            const aisle = item.aisles
              ? localizedName(item.aisles.aisle_translations, locale)
              : locale === 'ka'
                ? 'სხვა'
                : 'Other'
            const freshness = classifyPriceFreshness({
              observedAt: item.store_pricing?.observed_at ?? null,
              validTo: item.store_pricing?.valid_to ?? null,
            })
            return (
              <Pressable key={item.id} onPress={() => toggle(item)} style={styles.item}>
                <View style={[styles.check, item.is_checked && styles.checked]}>
                  {item.is_checked ? <Text style={styles.tick}>✓</Text> : null}
                </View>
                <View style={styles.itemCopy}>
                  <Text style={[styles.name, item.is_checked && styles.done]}>
                    {localizedName(item.ingredients.ingredient_translations, locale)}
                  </Text>
                  <Text style={styles.aisle}>{aisle}</Text>
                  {item.pantry_deduction_quantity ? (
                    <Text style={styles.pantry}>
                      {locale === 'ka' ? 'მარაგიდან' : 'From pantry'}:{' '}
                      {item.pantry_deduction_quantity}g
                    </Text>
                  ) : null}
                  <View style={styles.priceMetaRow}>
                    <View
                      style={[
                        styles.freshnessBadge,
                        { backgroundColor: freshnessColors[freshness].background },
                      ]}
                    >
                      <Text
                        style={[
                          styles.freshnessText,
                          { color: freshnessColors[freshness].foreground },
                        ]}
                      >
                        {freshnessLabel(item, locale)}
                      </Text>
                    </View>
                    {item.store_pricing?.is_promotion ? (
                      <View style={styles.promoBadge}>
                        <Text style={styles.promoText}>{locale === 'ka' ? 'აქცია' : 'PROMO'}</Text>
                      </View>
                    ) : null}
                    {item.store_pricing ? (
                      <Text style={styles.source}>
                        {sourceLabel(item.store_pricing.source, locale)}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View>
                  <Text style={styles.quantity}>
                    {Number(item.purchase_quantity).toFixed(
                      Number(item.purchase_quantity) % 1 ? 1 : 0,
                    )}{' '}
                    {item.purchase_unit}
                  </Text>
                  <Text style={styles.price}>
                    {item.estimated_cost_gel === null
                      ? '—'
                      : formatGel(Number(item.estimated_cost_gel), locale)}
                  </Text>
                  {item.store_pricing?.is_promotion &&
                  item.store_pricing.regular_price_gel !== null ? (
                    <Text style={styles.regularPrice}>
                      {formatGel(Number(item.store_pricing.regular_price_gel), locale)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            )
          })}
          {!items.length ? (
            <Text style={styles.empty}>
              {locale === 'ka'
                ? 'ამ კვირისთვის სია ჯერ არ არის.'
                : 'There is no list for this week yet.'}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.paper, flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flex: 1,
    justifyContent: 'center',
  },
  content: { padding: 20, paddingBottom: 42 },
  eyebrow: {
    color: colors.wine,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: 10,
    marginTop: 18,
  },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  total: { color: colors.leaf, fontFamily: 'Georgia', fontSize: 20, fontWeight: '800' },
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  coverage: {
    backgroundColor: colors.paperDeep,
    borderRadius: 18,
    flexDirection: 'row',
    marginTop: 18,
    padding: 13,
  },
  coverageMetric: { flex: 1 },
  coverageLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  coverageValue: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: 4 },
  list: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 24,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  item: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 15,
  },
  check: {
    alignItems: 'center',
    borderColor: colors.muted,
    borderRadius: 7,
    borderWidth: 1.5,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  checked: { backgroundColor: colors.wine, borderColor: colors.wine },
  tick: { color: 'white', fontSize: 14, fontWeight: '900' },
  itemCopy: { flex: 1 },
  name: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  done: { color: colors.muted, textDecorationLine: 'line-through' },
  aisle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  pantry: { color: colors.leaf, fontSize: 10, marginTop: 2 },
  priceMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 6,
  },
  freshnessBadge: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
  freshnessText: { fontSize: 9, fontWeight: '800' },
  promoBadge: {
    backgroundColor: colors.wine,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  promoText: { color: colors.white, fontSize: 8, fontWeight: '900' },
  source: { color: colors.leaf, fontSize: 9, fontWeight: '800' },
  quantity: { color: colors.ink, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  price: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'right' },
  regularPrice: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 2,
    textAlign: 'right',
    textDecorationLine: 'line-through',
  },
  empty: { color: colors.muted, paddingVertical: 24, textAlign: 'center' },
})
