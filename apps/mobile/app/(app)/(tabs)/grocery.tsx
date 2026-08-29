import { formatGel, getWeekStartDate, type Locale, type MeasurementUnit } from '@sufra/shared'
import { useEffect, useState } from 'react'
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
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

interface Item {
  id: string
  purchase_quantity: number
  purchase_unit: MeasurementUnit
  estimated_cost_gel: number | null
  is_checked: boolean
  ingredients: { ingredient_translations: Array<{ locale: Locale; name: string }> }
  aisles: { aisle_translations: Array<{ locale: Locale; name: string }> } | null
}

function localizedName(rows: Array<{ locale: Locale; name: string }>, locale: Locale): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '—'
}

export default function GroceryScreen() {
  const { locale } = useLocale()
  const [items, setItems] = useState<Item[]>([])
  const [total, setTotal] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function load() {
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
        'id, purchase_quantity, purchase_unit, estimated_cost_gel, is_checked, ingredients!inner(ingredient_translations(locale, name)), aisles(aisle_translations(locale, name))',
      )
      .eq('grocery_list_id', list.data.id)
      .order('sort_order')
    setItems((result.data ?? []) as unknown as Item[])
    setLoading(false)
  }

  useEffect(() => {
    void load()
  }, [])

  async function toggle(item: Item) {
    const next = !item.is_checked
    setItems((current) =>
      current.map((candidate) =>
        candidate.id === item.id ? { ...candidate, is_checked: next } : candidate,
      ),
    )
    const result = await supabase
      .from('grocery_list_items')
      .update({ is_checked: next })
      .eq('id', item.id)
    if (result.error)
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
        <View style={styles.list}>
          {items.map((item) => {
            const aisle = item.aisles
              ? localizedName(item.aisles.aisle_translations, locale)
              : locale === 'ka'
                ? 'სხვა'
                : 'Other'
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
  quantity: { color: colors.ink, fontSize: 12, fontWeight: '800', textAlign: 'right' },
  price: { color: colors.muted, fontSize: 11, marginTop: 3, textAlign: 'right' },
  empty: { color: colors.muted, paddingVertical: 24, textAlign: 'center' },
})
