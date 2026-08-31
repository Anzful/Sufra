import Ionicons from '@expo/vector-icons/Ionicons'
import type { Locale } from '@sufra/shared'
import { useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState, type ComponentProps } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { SufraBrand } from '@/components/sufra-brand'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot, removePantryItemMock, setPantryItemMock } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { fontFamilyFor, shadow } from '@/lib/theme'
import { useLocale } from '@/providers/locale-provider'

interface IngredientChoice {
  id: string
  name: string
}

interface PantryItem {
  expiresOn: string | null
  id: string
  ingredientId: string
  name: string
  quantityGrams: number
}

interface TranslationRow {
  locale: Locale
  name: string
}

type IoniconName = ComponentProps<typeof Ionicons>['name']
type PantryGroupKey = 'dry' | 'fresh'

const freshIngredientIds = new Set([
  'apple',
  'banana',
  'carrot',
  'cucumber',
  'onion',
  'potato',
  'tomato',
])

const ingredientIcons: Record<string, IoniconName> = {
  carrot: 'nutrition-outline',
  lentils: 'apps-outline',
  oats: 'leaf-outline',
  onion: 'layers-outline',
  potato: 'ellipse-outline',
  rice: 'grid-outline',
  walnut: 'flower-outline',
}

function localized(rows: TranslationRow[], locale: Locale): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '·'
}

function pantryGroupFor(item: PantryItem): PantryGroupKey {
  return freshIngredientIds.has(item.ingredientId) ? 'fresh' : 'dry'
}

function IngredientIcon({ ingredientId }: { ingredientId: string }) {
  return (
    <View style={styles.ingredientIcon}>
      <Ionicons
        color={colors.emeraldDark}
        name={ingredientIcons[ingredientId] ?? 'restaurant-outline'}
        size={18}
      />
    </View>
  )
}

function PantryGroup({
  items,
  locale,
  onRemove,
  title,
}: {
  items: PantryItem[]
  locale: Locale
  onRemove: (item: PantryItem) => void
  title: string
}) {
  if (items.length === 0) return null

  return (
    <View style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.groupCount}>
          <Text style={styles.groupCountText}>{items.length}</Text>
        </View>
      </View>
      {items.map((item, index) => (
        <View key={item.id} style={[styles.inventoryRow, index > 0 && styles.inventoryRowBorder]}>
          <IngredientIcon ingredientId={item.ingredientId} />
          <Text numberOfLines={1} style={styles.inventoryName}>
            {item.name}
          </Text>
          <Text style={styles.inventoryQuantity}>{item.quantityGrams.toLocaleString()} გ</Text>
          <Pressable
            accessibilityLabel={locale === 'ka' ? `${item.name} წაშლა` : `Remove ${item.name}`}
            accessibilityRole="button"
            hitSlop={9}
            onPress={() => onRemove(item)}
            style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}
          >
            <Ionicons color={colors.emeraldDark} name="trash-outline" size={18} />
          </Pressable>
        </View>
      ))}
    </View>
  )
}

export default function PantryScreen() {
  const { locale } = useLocale()
  const [ingredients, setIngredients] = useState<IngredientChoice[]>([])
  const [items, setItems] = useState<PantryItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [query, setQuery] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const visibleIngredients = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase(locale === 'ka' ? 'ka-GE' : 'en-US')
    const matches = normalized
      ? ingredients.filter((ingredient) =>
          ingredient.name
            .toLocaleLowerCase(locale === 'ka' ? 'ka-GE' : 'en-US')
            .includes(normalized),
        )
      : ingredients
    return matches.slice(0, 8)
  }, [ingredients, locale, query])

  const groupedItems = useMemo(
    () => ({
      fresh: items.filter((item) => pantryGroupFor(item) === 'fresh'),
      dry: items.filter((item) => pantryGroupFor(item) === 'dry'),
    }),
    [items],
  )

  async function load() {
    setLoading(true)
    if (isMockMode()) {
      const snapshot = getMockSnapshot()
      const choices = snapshot.ingredients.map((ingredient) => ({
        id: ingredient.id,
        name: ingredient.name[locale],
      }))
      setIngredients(choices)
      setSelectedId((current) => current || choices[0]?.id || '')
      setItems(
        snapshot.pantryItems.map((item) => ({
          expiresOn: item.expiresOn,
          id: item.id,
          ingredientId: item.ingredientId,
          name: item.name[locale],
          quantityGrams: item.quantityGrams,
        })),
      )
      setLoading(false)
      return
    }

    const user = await supabase.auth.getUser()
    if (!user.data.user) {
      setLoading(false)
      return
    }
    const [ingredientsResult, pantryResult] = await Promise.all([
      supabase
        .from('ingredients')
        .select('id, ingredient_translations(locale, name)')
        .eq('is_active', true)
        .order('canonical_code'),
      supabase
        .from('pantry_items')
        .select(
          'id, ingredient_id, quantity, quantity_grams, expires_on, ingredients!inner(ingredient_translations(locale, name))',
        )
        .eq('user_id', user.data.user.id)
        .order('created_at'),
    ])
    if (ingredientsResult.error || pantryResult.error) {
      Alert.alert(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'მარაგი ვერ ჩაიტვირთა.' : 'Could not load pantry.',
      )
      setLoading(false)
      return
    }
    const choices = (ingredientsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: localized(row.ingredient_translations as TranslationRow[], locale),
    }))
    setIngredients(choices)
    setSelectedId((current) => current || choices[0]?.id || '')
    setItems(
      (pantryResult.data ?? []).map((row) => {
        const ingredient = row.ingredients as unknown as {
          ingredient_translations: TranslationRow[]
        }
        return {
          expiresOn: row.expires_on,
          id: row.id,
          ingredientId: String(row.ingredient_id),
          name: localized(ingredient.ingredient_translations, locale),
          quantityGrams: Number(row.quantity_grams ?? row.quantity),
        }
      }),
    )
    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [locale]),
  )

  async function save() {
    const quantityGrams = Number(quantity)
    if (!selectedId || !Number.isFinite(quantityGrams) || quantityGrams <= 0) {
      Alert.alert(
        locale === 'ka' ? 'შეამოწმე რაოდენობა' : 'Check the quantity',
        locale === 'ka'
          ? 'მიუთითე დადებითი რაოდენობა გრამებში.'
          : 'Enter a positive amount in grams.',
      )
      return
    }
    setSaving(true)
    try {
      if (isMockMode()) {
        setPantryItemMock(selectedId, quantityGrams)
      } else {
        const user = await supabase.auth.getUser()
        if (!user.data.user) throw new Error('Authentication required.')
        const ingredientId = Number(selectedId)
        const existing = await supabase
          .from('pantry_items')
          .select('id')
          .eq('user_id', user.data.user.id)
          .eq('ingredient_id', ingredientId)
          .limit(1)
          .maybeSingle()
        if (existing.error) throw existing.error
        const payload = {
          expires_on: null,
          ingredient_id: ingredientId,
          quantity: quantityGrams,
          quantity_grams: quantityGrams,
          unit: 'g' as const,
        }
        const result = existing.data
          ? await supabase.from('pantry_items').update(payload).eq('id', existing.data.id)
          : await supabase.from('pantry_items').insert({ ...payload, user_id: user.data.user.id })
        if (result.error) throw result.error
      }
      setQuantity('')
      await load()
    } catch {
      Alert.alert(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'მარაგი ვერ შეინახა.' : 'Could not save pantry item.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function remove(item: PantryItem) {
    try {
      if (isMockMode()) removePantryItemMock(item.id)
      else {
        const result = await supabase.from('pantry_items').delete().eq('id', item.id)
        if (result.error) throw result.error
      }
      await load()
    } catch {
      Alert.alert(
        locale === 'ka' ? 'შეცდომა' : 'Error',
        locale === 'ka' ? 'პროდუქტი ვერ წაიშალა.' : 'Could not remove item.',
      )
    }
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.emerald} />
      </View>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.emerald} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <SufraBrand size="compact" />
          <View style={styles.totalPill}>
            <Text style={styles.totalPillText}>
              {items.length} {locale === 'ka' ? 'პროდუქტი' : 'products'}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>
          {locale === 'ka' ? 'რა გვაქვს სახლში?' : 'What is at home?'}
        </Text>
        <Text style={styles.body}>
          {locale === 'ka'
            ? 'შენახული რაოდენობა საყიდლების სიას აკლდება.'
            : 'Saved quantities are deducted from your grocery list.'}
        </Text>

        <View style={styles.addCard}>
          <Text style={styles.cardTitle}>
            {locale === 'ka' ? 'პროდუქტის დამატება' : 'Add a product'}
          </Text>
          <View style={styles.searchField}>
            <Ionicons color={colors.ink} name="search-outline" size={22} />
            <TextInput
              autoCapitalize="none"
              onChangeText={setQuery}
              placeholder={locale === 'ka' ? 'მოძებნე პროდუქტი' : 'Search products'}
              placeholderTextColor={colors.mutedLight}
              selectionColor={colors.emerald}
              style={styles.searchInput}
              value={query}
            />
            <Ionicons color={colors.muted} name="chevron-down" size={19} />
          </View>

          <ScrollView
            contentContainerStyle={styles.chipRow}
            horizontal
            keyboardShouldPersistTaps="handled"
            showsHorizontalScrollIndicator={false}
          >
            {visibleIngredients.map((ingredient) => {
              const selected = selectedId === ingredient.id
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  key={ingredient.id}
                  onPress={() => {
                    setSelectedId(ingredient.id)
                    setQuery('')
                  }}
                  style={({ pressed }) => [
                    styles.chip,
                    selected && styles.chipSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {ingredient.name}
                  </Text>
                </Pressable>
              )
            })}
          </ScrollView>

          <Text style={styles.quantityLabel}>{locale === 'ka' ? 'რაოდენობა' : 'Quantity'}</Text>
          <View style={styles.quantityRow}>
            <View style={styles.quantityField}>
              <TextInput
                keyboardType="decimal-pad"
                onChangeText={setQuantity}
                placeholder="200"
                placeholderTextColor={colors.ink}
                selectionColor={colors.emerald}
                style={styles.quantityInput}
                value={quantity}
              />
              <Text style={styles.quantityUnit}>{locale === 'ka' ? 'გ' : 'g'}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ busy: saving, disabled: saving }}
              disabled={saving}
              onPress={() => void save()}
              style={({ pressed }) => [styles.saveButton, pressed && styles.saveButtonPressed]}
            >
              {saving ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.saveButtonText}>
                  {locale === 'ka' ? 'მარაგის შენახვა' : 'Save item'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionTitle}>{locale === 'ka' ? 'შენი მარაგი' : 'Your pantry'}</Text>
        {items.length ? (
          <View style={styles.groups}>
            <PantryGroup
              items={groupedItems.fresh}
              locale={locale}
              onRemove={(item) => void remove(item)}
              title={locale === 'ka' ? 'ბოსტნეული' : 'Fresh produce'}
            />
            <PantryGroup
              items={groupedItems.dry}
              locale={locale}
              onRemove={(item) => void remove(item)}
              title={locale === 'ka' ? 'მშრალი მარაგი' : 'Dry pantry'}
            />
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {locale === 'ka' ? 'მარაგი ცარიელია.' : 'Your pantry is empty.'}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#fbfcfa', flex: 1 },
  loading: {
    alignItems: 'center',
    backgroundColor: '#fbfcfa',
    flex: 1,
    justifyContent: 'center',
  },
  content: { paddingBottom: 24, paddingHorizontal: 20, paddingTop: 18 },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  totalPill: {
    backgroundColor: colors.mintSoft,
    borderColor: colors.line,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  totalPillText: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
  },
  title: {
    color: colors.emeraldBlack,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 31,
    letterSpacing: -0.7,
    lineHeight: 41,
    marginTop: 25,
  },
  body: {
    color: colors.inkSoft,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 14,
    lineHeight: 21,
    marginTop: 3,
    maxWidth: 310,
  },
  addCard: {
    backgroundColor: 'rgba(255,255,255,0.86)',
    borderColor: colors.line,
    borderRadius: 19,
    borderWidth: 1,
    marginTop: 18,
    padding: 15,
    ...shadow(1),
  },
  cardTitle: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 600),
    fontSize: 14,
    marginBottom: 10,
  },
  searchField: {
    alignItems: 'center',
    borderColor: colors.lineStrong,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: 'row',
    height: 48,
    paddingHorizontal: 12,
  },
  searchInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilyFor('sans', 400),
    fontSize: 13,
    height: '100%',
    marginLeft: 10,
    paddingVertical: 0,
  },
  chipRow: { gap: 9, paddingBottom: 15, paddingTop: 13 },
  chip: {
    alignItems: 'center',
    borderColor: colors.line,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    minWidth: 102,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: colors.mintSoft, borderColor: '#a8d7c0' },
  chipText: { color: colors.ink, fontFamily: fontFamilyFor('sans', 400), fontSize: 12 },
  chipTextSelected: { color: colors.emeraldDark, fontFamily: fontFamilyFor('sans', 500) },
  quantityLabel: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
    marginBottom: 7,
  },
  quantityRow: { flexDirection: 'row', gap: 12 },
  quantityField: {
    alignItems: 'center',
    borderColor: colors.lineStrong,
    borderRadius: 10,
    borderWidth: 1,
    flex: 0.43,
    flexDirection: 'row',
    height: 49,
    paddingHorizontal: 13,
  },
  quantityInput: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 17,
    height: '100%',
    paddingVertical: 0,
  },
  quantityUnit: { color: colors.muted, fontFamily: fontFamilyFor('sans', 500), fontSize: 13 },
  saveButton: {
    alignItems: 'center',
    backgroundColor: colors.emeraldDark,
    borderRadius: 11,
    flex: 0.57,
    height: 49,
    justifyContent: 'center',
    ...shadow(1),
  },
  saveButtonPressed: { opacity: 0.86, transform: [{ scale: 0.99 }] },
  saveButtonText: {
    color: colors.white,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 13,
  },
  sectionTitle: {
    color: colors.ink,
    fontFamily: fontFamilyFor('serif', 500),
    fontSize: 19,
    lineHeight: 27,
    marginBottom: 10,
    marginTop: 18,
  },
  groups: { gap: 11 },
  groupCard: {
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 15,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupHeader: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    height: 37,
    justifyContent: 'space-between',
    paddingHorizontal: 13,
  },
  groupTitle: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
  },
  groupCount: {
    alignItems: 'center',
    backgroundColor: colors.paperDeep,
    borderRadius: 10,
    height: 21,
    justifyContent: 'center',
    minWidth: 21,
  },
  groupCountText: { color: colors.ink, fontFamily: fontFamilyFor('sans', 500), fontSize: 11 },
  inventoryRow: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 43,
    paddingHorizontal: 12,
  },
  inventoryRowBorder: { borderTopColor: colors.line, borderTopWidth: StyleSheet.hairlineWidth },
  ingredientIcon: {
    alignItems: 'center',
    backgroundColor: colors.mintSoft,
    borderRadius: 9,
    height: 31,
    justifyContent: 'center',
    width: 31,
  },
  inventoryName: {
    color: colors.ink,
    flex: 1,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
    marginLeft: 11,
  },
  inventoryQuantity: {
    color: colors.ink,
    fontFamily: fontFamilyFor('sans', 500),
    fontSize: 12,
    marginRight: 13,
  },
  deleteButton: { alignItems: 'center', height: 34, justifyContent: 'center', width: 28 },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.line,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 86,
  },
  emptyText: { color: colors.muted, fontFamily: fontFamilyFor('sans', 400), fontSize: 13 },
  pressed: { opacity: 0.68 },
})
