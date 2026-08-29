import type { Locale } from '@sufra/shared'
import { useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Field, PrimaryButton, Title } from '@/components/ui'
import { colors } from '@/lib/colors'
import { isMockMode } from '@/lib/data-mode'
import { getMockSnapshot, removePantryItemMock, setPantryItemMock } from '@/lib/mock-store'
import { supabase } from '@/lib/supabase'
import { useLocale } from '@/providers/locale-provider'

interface IngredientChoice {
  id: string
  name: string
}

interface PantryItem {
  id: string
  ingredientId: string
  name: string
  quantityGrams: number
  expiresOn: string | null
}

interface TranslationRow {
  locale: Locale
  name: string
}

function localized(rows: TranslationRow[], locale: Locale): string {
  return rows.find((row) => row.locale === locale)?.name ?? rows[0]?.name ?? '—'
}

export default function PantryScreen() {
  const { locale } = useLocale()
  const [ingredients, setIngredients] = useState<IngredientChoice[]>([])
  const [items, setItems] = useState<PantryItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

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
          id: item.id,
          ingredientId: item.ingredientId,
          name: item.name[locale],
          quantityGrams: item.quantityGrams,
          expiresOn: item.expiresOn,
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
          id: row.id,
          ingredientId: String(row.ingredient_id),
          name: localized(ingredient.ingredient_translations, locale),
          quantityGrams: Number(row.quantity_grams ?? row.quantity),
          expiresOn: row.expires_on,
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
          ingredient_id: ingredientId,
          quantity: quantityGrams,
          quantity_grams: quantityGrams,
          unit: 'g' as const,
          expires_on: null,
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
        <ActivityIndicator color={colors.wine} />
      </View>
    )
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.wine} />
        }
      >
        <Text style={styles.eyebrow}>04 · {locale === 'ka' ? 'მარაგი' : 'PANTRY'}</Text>
        <Title>{locale === 'ka' ? 'რა გვაქვს სახლში?' : 'What is at home?'}</Title>
        <Text style={styles.body}>
          {locale === 'ka'
            ? 'შენახული რაოდენობა ავტომატურად აკლდება დემო საყიდლების სიას.'
            : 'Saved quantities are automatically deducted from the demo grocery list.'}
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            {locale === 'ka' ? 'აირჩიე პროდუქტი' : 'Choose ingredient'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
            {ingredients.map((ingredient) => (
              <Pressable
                key={ingredient.id}
                onPress={() => setSelectedId(ingredient.id)}
                style={[styles.chip, selectedId === ingredient.id && styles.chipSelected]}
              >
                <Text
                  style={[styles.chipText, selectedId === ingredient.id && styles.chipTextSelected]}
                >
                  {ingredient.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
          <Text style={styles.label}>
            {locale === 'ka' ? 'რაოდენობა გრამებში' : 'Quantity in grams'}
          </Text>
          <Field
            keyboardType="decimal-pad"
            onChangeText={setQuantity}
            placeholder="500"
            value={quantity}
          />
          <View style={styles.save}>
            <PrimaryButton
              disabled={saving}
              onPress={save}
              title={locale === 'ka' ? 'მარაგის შენახვა' : 'Save pantry item'}
            />
          </View>
        </View>

        <View style={styles.list}>
          {items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.itemCopy}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>{item.quantityGrams.toLocaleString()} g</Text>
              </View>
              <Pressable onPress={() => remove(item)} style={styles.remove}>
                <Text style={styles.removeText}>{locale === 'ka' ? 'წაშლა' : 'Remove'}</Text>
              </Pressable>
            </View>
          ))}
          {!items.length ? (
            <Text style={styles.empty}>
              {locale === 'ka' ? 'მარაგი ცარიელია.' : 'Your pantry is empty.'}
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
  body: { color: colors.muted, fontSize: 15, lineHeight: 22, marginTop: 12 },
  form: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 24,
    padding: 18,
  },
  label: { color: colors.ink, fontSize: 12, fontWeight: '800', marginBottom: 9, marginTop: 4 },
  chips: { marginBottom: 16 },
  chip: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  chipSelected: { backgroundColor: colors.leaf, borderColor: colors.leaf },
  chipText: { color: colors.ink, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: colors.white },
  save: { marginTop: 14 },
  list: {
    backgroundColor: colors.white,
    borderColor: colors.line,
    borderRadius: 24,
    borderWidth: 1,
    marginTop: 18,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  item: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingVertical: 15,
  },
  itemCopy: { flex: 1 },
  name: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  remove: {
    borderColor: colors.line,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  removeText: { color: colors.wine, fontSize: 11, fontWeight: '800' },
  empty: { color: colors.muted, paddingVertical: 28, textAlign: 'center' },
})
