import {
  classifyPriceFreshness,
  formatDate,
  formatGel,
  getWeekStartDate,
  summarizePriceCoverage,
  type Locale,
  type MeasurementUnit,
  type PriceFreshness,
} from '@sufra/shared'
import Ionicons from '@expo/vector-icons/Ionicons'
import { LinearGradient } from 'expo-linear-gradient'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Checkbox } from '@/components/checkbox'
import { SearchBar } from '@/components/search-bar'
import { Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot, setGroceryCheckedMock } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { fontFamilyFor, shadow, typeStyle } from '@/lib/theme'
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
  fresh: { background: colors.mintSoft, foreground: colors.emerald },
  aging: { background: colors.warningSoft, foreground: colors.warning },
  stale: { background: colors.limeSoft, foreground: colors.warning },
  expired: { background: colors.dangerSoft, foreground: colors.danger },
  unavailable: { background: colors.paperDeep, foreground: colors.muted },
}

function localizedName(rows: Array<{ locale: Locale; name: string }>, locale: Locale): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '·'
}

function freshnessLabel(item: Item, locale: Locale): string {
  const status = classifyPriceFreshness({
    observedAt: item.store_pricing?.observed_at ?? null,
    validTo: item.store_pricing?.valid_to ?? null,
  })
  if (status === 'unavailable') return locale === 'ka' ? 'ფასი არაა' : 'No price'
  if (status === 'expired') return locale === 'ka' ? 'ვადაგასული' : 'Expired'
  if (status === 'fresh') return locale === 'ka' ? 'ახალი' : 'Current'
  if (status === 'aging') return locale === 'ka' ? 'შეამოწმე' : 'Check'
  return locale === 'ka' ? 'ძველი' : 'Stale'
}

function addDays(dateValue: string, days: number): string {
  const date = new Date(`${dateValue}T12:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString()
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
  const [query, setQuery] = useState('')
  const [showOnlyPending, setShowOnlyPending] = useState(false)

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

  async function shareList() {
    const lines = items.map((item) => {
      const name = localizedName(item.ingredients.ingredient_translations, locale)
      const quantity = `${Number(item.purchase_quantity)} ${item.purchase_unit}`
      return `${item.is_checked ? '✓' : '□'} ${name}, ${quantity}`
    })
    await Share.share({
      message: `${locale === 'ka' ? 'სუფრა, საყიდლების სია' : 'Sufra grocery list'}\n\n${lines.join('\n')}`,
    })
  }

  if (loading)
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.emerald} />
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
  const normalizedQuery = query.trim().toLocaleLowerCase(locale === 'ka' ? 'ka-GE' : 'en-US')
  const searchedItems = normalizedQuery
    ? items.filter((item) => {
        const searchable = [
          ...item.ingredients.ingredient_translations.map((translation) => translation.name),
          ...(item.aisles?.aisle_translations.map((translation) => translation.name) ?? []),
          sourceLabel(item.store_pricing?.source ?? null, locale),
          item.purchase_unit,
        ]
          .join(' ')
          .toLocaleLowerCase(locale === 'ka' ? 'ka-GE' : 'en-US')
        return searchable.includes(normalizedQuery)
      })
    : items
  const filteredItems = showOnlyPending
    ? searchedItems.filter((item) => !item.is_checked)
    : searchedItems
  const groupedItems = Array.from(
    filteredItems.reduce((groups, item) => {
      const aisle = item.aisles
        ? localizedName(item.aisles.aisle_translations, locale)
        : locale === 'ka'
          ? 'სხვა'
          : 'Other'
      const group = groups.get(aisle)
      if (group) group.push(item)
      else groups.set(aisle, [item])
      return groups
    }, new Map<string, Item[]>()),
  )
  const checkedCount = items.filter((item) => item.is_checked).length
  const remainingCount = items.length - checkedCount
  const progress = items.length ? checkedCount / items.length : 0
  const weekStart = getWeekStartDate()

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.emerald} />
        }
      >
        <View style={styles.header}>
          <View>
            <Title style={styles.title}>{locale === 'ka' ? 'საყიდლები' : 'Groceries'}</Title>
            <Text style={styles.dateRange}>
              {formatDate(weekStart, locale)} · {formatDate(addDays(weekStart, 6), locale)}
            </Text>
          </View>
          <Pressable
            accessibilityLabel={locale === 'ka' ? 'სიის გაზიარება' : 'Share list'}
            accessibilityRole="button"
            onPress={() => void shareList()}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.emeraldDark} name="share-social-outline" size={20} />
          </Pressable>
        </View>

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>{locale === 'ka' ? 'კვირის ჯამი' : 'WEEK TOTAL'}</Text>
            <Text style={styles.total}>{total === null ? '·' : formatGel(total, locale)}</Text>
          </View>
          <Text style={styles.productCount}>
            {items.length} {locale === 'ka' ? 'პროდუქტი' : 'items'}
          </Text>
        </View>

        <SearchBar
          cancelLabel={locale === 'ka' ? 'გაუქმება' : 'Cancel'}
          clearLabel={locale === 'ka' ? 'ძიების გასუფთავება' : 'Clear search'}
          filterActive={showOnlyPending}
          filterLabel={locale === 'ka' ? 'დარჩენილი პროდუქტები' : 'Show pending items'}
          onChangeText={setQuery}
          onFilterPress={() => setShowOnlyPending((current) => !current)}
          placeholder={locale === 'ka' ? 'მოძებნე პროდუქტი' : 'Search groceries'}
          style={styles.search}
          value={query}
        />

        <LinearGradient colors={[colors.mintSoft, colors.aquaSoft]} style={styles.progressCard}>
          <View style={styles.progressCopy}>
            <Text style={styles.progressValue}>
              {checkedCount} / {items.length} {locale === 'ka' ? 'შეგროვილია' : 'collected'}
            </Text>
            <Text style={styles.progressRemaining}>
              {locale === 'ka' ? `დარჩა ${remainingCount}` : `${remainingCount} left`}
            </Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` }]} />
          </View>
          <Text style={styles.coverageNote}>
            {locale === 'ka'
              ? `${coverage.coveragePercent}% ფასით დაფარული`
              : `${coverage.coveragePercent}% price coverage`}
          </Text>
        </LinearGradient>

        <View style={styles.groups}>
          {groupedItems.map(([aisle, groupItems]) => (
            <View key={aisle} style={styles.listGroup}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{aisle}</Text>
                <View style={styles.groupCount}>
                  <Text style={styles.groupCountText}>{groupItems.length}</Text>
                </View>
              </View>
              {groupItems.map((item, index) => {
                const freshness = classifyPriceFreshness({
                  observedAt: item.store_pricing?.observed_at ?? null,
                  validTo: item.store_pricing?.valid_to ?? null,
                })
                return (
                  <Pressable
                    accessibilityLabel={localizedName(
                      item.ingredients.ingredient_translations,
                      locale,
                    )}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: item.is_checked }}
                    key={item.id}
                    onPress={() => toggle(item)}
                    style={({ pressed }) => [
                      styles.item,
                      index === groupItems.length - 1 && styles.itemLast,
                      pressed && styles.itemPressed,
                    ]}
                  >
                    <Checkbox checked={item.is_checked} size={25} />
                    <View style={styles.itemCopy}>
                      <Text style={[styles.name, item.is_checked && styles.done]}>
                        {localizedName(item.ingredients.ingredient_translations, locale)}
                      </Text>
                      <Text style={styles.quantity}>
                        {Number(item.purchase_quantity).toFixed(
                          Number(item.purchase_quantity) % 1 ? 1 : 0,
                        )}{' '}
                        {item.purchase_unit}
                        {item.pantry_deduction_quantity
                          ? ` · ${locale === 'ka' ? 'მარაგი' : 'pantry'} ${item.pantry_deduction_quantity}g`
                          : ''}
                      </Text>
                    </View>
                    <View style={styles.priceColumn}>
                      <Text style={styles.price}>
                        {item.estimated_cost_gel === null
                          ? '·'
                          : formatGel(Number(item.estimated_cost_gel), locale)}
                      </Text>
                      <View
                        style={[
                          styles.freshnessBadge,
                          item.store_pricing?.is_promotion && styles.promoBadge,
                          {
                            backgroundColor: item.store_pricing?.is_promotion
                              ? colors.limeSoft
                              : freshnessColors[freshness].background,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.freshnessText,
                            {
                              color: item.store_pricing?.is_promotion
                                ? colors.warning
                                : freshnessColors[freshness].foreground,
                            },
                          ]}
                        >
                          {item.store_pricing?.is_promotion
                            ? locale === 'ka'
                              ? 'აქცია'
                              : 'Promo'
                            : freshnessLabel(item, locale)}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          ))}
          {!items.length ? (
            <Text style={styles.empty}>
              {locale === 'ka'
                ? 'ამ კვირისთვის სია ჯერ არ არის.'
                : 'There is no list for this week yet.'}
            </Text>
          ) : null}
          {items.length > 0 && groupedItems.length === 0 ? (
            <View style={styles.noResults}>
              <Ionicons color={colors.muted} name="search-outline" size={20} />
              <Text style={styles.noResultsText}>
                {locale === 'ka' ? 'შესაბამისი პროდუქტი ვერ მოიძებნა.' : 'No matching groceries.'}
              </Text>
            </View>
          ) : null}
        </View>

        {items.length ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => void shareList()}
            style={({ pressed }) => [styles.shareButton, pressed && styles.pressed]}
          >
            <Text style={styles.shareButtonText}>
              {locale === 'ka' ? 'სიის გაზიარება' : 'Share grocery list'}
            </Text>
            <Ionicons color={colors.white} name="share-outline" size={19} />
          </Pressable>
        ) : null}
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
  content: { paddingBottom: 36, paddingHorizontal: 20, paddingTop: 17 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { color: colors.emeraldDark, fontSize: 34, lineHeight: 42 },
  dateRange: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
    marginTop: 2,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
  totalRow: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 22,
  },
  totalLabel: {
    color: colors.inkSoft,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 11,
  },
  total: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('serif', 600),
    fontSize: 31,
    lineHeight: 38,
    marginTop: 1,
  },
  productCount: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
    marginBottom: 7,
  },
  search: { marginTop: 20 },
  progressCard: {
    borderRadius: 17,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  progressCopy: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressValue: {
    color: colors.emeraldDark,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 12,
  },
  progressRemaining: {
    color: colors.emerald,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 11,
  },
  progressTrack: {
    backgroundColor: 'rgba(11,107,80,0.14)',
    borderRadius: 4,
    height: 5,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: { backgroundColor: colors.emerald, borderRadius: 4, height: '100%' },
  coverageNote: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 9,
    marginTop: 8,
  },
  groups: { gap: 12, marginTop: 18 },
  listGroup: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadow(1),
  },
  groupHeader: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 42,
    paddingHorizontal: 15,
  },
  groupTitle: {
    color: colors.ink,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 15,
  },
  groupCount: {
    alignItems: 'center',
    backgroundColor: colors.paperDeep,
    borderRadius: 12,
    height: 24,
    justifyContent: 'center',
    minWidth: 24,
    paddingHorizontal: 7,
  },
  groupCountText: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 10,
  },
  item: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    gap: 11,
    minHeight: 68,
    paddingHorizontal: 15,
    paddingVertical: 11,
  },
  itemLast: { borderBottomWidth: 0 },
  itemPressed: { backgroundColor: colors.paper },
  itemCopy: { flex: 1 },
  name: { color: colors.ink, fontFamily: fontFamilyFor('sans', 500), fontSize: 14 },
  done: { color: colors.muted, textDecorationLine: 'line-through' },
  quantity: {
    color: colors.muted,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 10,
    marginTop: 3,
  },
  priceColumn: { alignItems: 'flex-end', minWidth: 76 },
  price: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 12,
    textAlign: 'right',
  },
  freshnessBadge: {
    borderRadius: 999,
    marginTop: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  promoBadge: { minWidth: 48 },
  freshnessText: { fontFamily: fontFamilyFor('sans', 600), fontSize: 8 },
  empty: { color: colors.muted, paddingVertical: 24, textAlign: 'center' },
  noResults: { alignItems: 'center', paddingVertical: 34 },
  noResultsText: { color: colors.muted, marginTop: 8, textAlign: 'center' },
  shareButton: {
    alignItems: 'center',
    backgroundColor: colors.emeraldBlack,
    borderRadius: 24,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
    marginTop: 18,
    minHeight: 54,
    ...shadow(1),
  },
  shareButtonText: {
    color: colors.white,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 14,
  },
})
