'use server'

import {
  createMockSufraSnapshot,
  mockGeneratePlan,
  mockSaveProfile,
  mockSetMealServings,
  mockSwapMeal,
  profileInputSchema,
  type ProfileInput,
} from '@sufra/shared'
import { revalidatePath } from 'next/cache'

import { readMockState, writeMockState } from '@/lib/mock-server'

export async function generateMockPlanAction(locale: 'ka' | 'en'): Promise<void> {
  if (locale !== 'ka' && locale !== 'en') throw new Error('Unsupported locale.')
  const state = await readMockState()
  if (!state.session) throw new Error('Mock session is not authenticated.')
  await writeMockState(mockGeneratePlan(state))
  revalidatePath(`/${locale}/plan`)
}

export async function setMockGroceryCheckedAction(itemId: string, checked: boolean): Promise<void> {
  if (typeof itemId !== 'string' || typeof checked !== 'boolean') throw new Error('Invalid item.')
  const state = await readMockState()
  if (!state.session) throw new Error('Mock session is not authenticated.')
  const validIds = new Set(
    createMockSufraSnapshot(state).groceryList?.items.map((item) => item.id) ?? [],
  )
  if (!validIds.has(itemId)) throw new Error('Grocery item was not found.')
  const ids = new Set(state.checkedGroceryItemIds)
  if (checked) ids.add(itemId)
  else ids.delete(itemId)
  await writeMockState({ ...state, checkedGroceryItemIds: [...ids] })
}

export async function saveMockProfileAction(profile: ProfileInput): Promise<void> {
  const state = await readMockState()
  if (!state.session) throw new Error('Mock session is not authenticated.')
  await writeMockState(mockSaveProfile(state, profileInputSchema.parse(profile)))
}

export async function swapMockMealAction(
  mealId: string,
  recipeId: string,
  locale: 'ka' | 'en',
): Promise<void> {
  if (locale !== 'ka' && locale !== 'en') throw new Error('Unsupported locale.')
  const state = await readMockState()
  if (!state.session) throw new Error('Mock session is not authenticated.')
  await writeMockState(mockSwapMeal(state, mealId, recipeId))
  revalidatePath(`/${locale}/plan`)
}

export async function setMockMealServingsAction(
  mealId: string,
  locale: 'ka' | 'en',
  formData: FormData,
): Promise<void> {
  if (locale !== 'ka' && locale !== 'en') throw new Error('Unsupported locale.')
  const state = await readMockState()
  if (!state.session) throw new Error('Mock session is not authenticated.')
  const servings = Number(formData.get('servings'))
  await writeMockState(mockSetMealServings(state, mealId, servings))
  revalidatePath(`/${locale}/plan`)
}
