'use server'

import { mockRemovePantryItem, mockSetPantryItem } from '@sufra/shared'
import { revalidatePath } from 'next/cache'

import { isMockMode } from '@/lib/data-mode'
import { readMockState, writeMockState } from '@/lib/mock-server'
import { createClient } from '@/lib/supabase/server'

function validateLocale(locale: string): asserts locale is 'ka' | 'en' {
  if (locale !== 'ka' && locale !== 'en') throw new Error('Unsupported locale.')
}

function quantityFrom(formData: FormData): number {
  const quantity = Number(formData.get('quantityGrams'))
  if (!Number.isFinite(quantity) || quantity <= 0 || quantity > 100_000) {
    throw new Error('Pantry quantity must be between 1 and 100000 grams.')
  }
  return Math.round(quantity * 10) / 10
}

function expiryFrom(formData: FormData): string | null {
  const value = String(formData.get('expiresOn') ?? '').trim()
  if (!value) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Invalid expiry date.')
  return value
}

function refresh(locale: 'ka' | 'en') {
  revalidatePath(`/${locale}/pantry`)
  revalidatePath(`/${locale}/plan`)
}

export async function savePantryItemAction(locale: string, formData: FormData): Promise<void> {
  validateLocale(locale)
  const ingredientId = String(formData.get('ingredientId') ?? '')
  const quantityGrams = quantityFrom(formData)
  const expiresOn = expiryFrom(formData)

  if (isMockMode()) {
    const state = await readMockState()
    if (!state.session) throw new Error('Mock session is not authenticated.')
    await writeMockState(mockSetPantryItem(state, ingredientId, quantityGrams, expiresOn))
    refresh(locale)
    return
  }

  const numericIngredientId = Number(ingredientId)
  if (!Number.isSafeInteger(numericIngredientId) || numericIngredientId <= 0) {
    throw new Error('Invalid ingredient.')
  }
  const supabase = await createClient()
  const claims = await supabase.auth.getClaims()
  const userId = claims.data?.claims?.sub
  if (!userId) throw new Error('Authentication required.')

  const existing = await supabase
    .from('pantry_items')
    .select('id')
    .eq('user_id', userId)
    .eq('ingredient_id', numericIngredientId)
    .limit(1)
    .maybeSingle()
  if (existing.error) throw new Error(existing.error.message)

  const payload = {
    ingredient_id: numericIngredientId,
    quantity: quantityGrams,
    quantity_grams: quantityGrams,
    unit: 'g' as const,
    expires_on: expiresOn,
  }
  const result = existing.data
    ? await supabase.from('pantry_items').update(payload).eq('id', existing.data.id)
    : await supabase.from('pantry_items').insert({ ...payload, user_id: userId })
  if (result.error) throw new Error(result.error.message)
  refresh(locale)
}

export async function removePantryItemAction(locale: string, pantryItemId: string): Promise<void> {
  validateLocale(locale)
  if (!pantryItemId) throw new Error('Invalid pantry item.')

  if (isMockMode()) {
    const state = await readMockState()
    if (!state.session) throw new Error('Mock session is not authenticated.')
    await writeMockState(mockRemovePantryItem(state, pantryItemId))
    refresh(locale)
    return
  }

  const supabase = await createClient()
  const claims = await supabase.auth.getClaims()
  if (!claims.data?.claims?.sub) throw new Error('Authentication required.')
  const result = await supabase.from('pantry_items').delete().eq('id', pantryItemId)
  if (result.error) throw new Error(result.error.message)
  refresh(locale)
}
