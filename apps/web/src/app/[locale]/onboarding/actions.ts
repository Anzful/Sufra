'use server'

import { createSufraApi, type SufraTransport } from '@sufra/shared'
import { profileInputSchema } from '@sufra/shared/schemas'
import { redirect } from 'next/navigation'

import { isLocale } from '@/lib/locale'
import { createClient } from '@/lib/supabase/server'

function numberValue(formData: FormData, name: string): number {
  return Number(formData.get(name))
}

function nullableNumberValue(formData: FormData, name: string): number | null {
  const value = String(formData.get(name) ?? '').trim()
  return value === '' ? null : Number(value)
}

function numberList(formData: FormData, name: string): number[] {
  return formData.getAll(name).map(Number)
}

export async function saveOnboardingAction(formData: FormData) {
  const requestedLocale = String(formData.get('locale') ?? 'ka')
  const locale = isLocale(requestedLocale) ? requestedLocale : 'ka'
  const result = profileInputSchema.safeParse({
    displayName: String(formData.get('displayName') ?? '').trim() || null,
    locale,
    timezone: 'Asia/Tbilisi',
    city: String(formData.get('city') ?? 'Tbilisi').trim(),
    preferredStoreId: numberValue(formData, 'preferredStoreId'),
    householdSize: numberValue(formData, 'householdSize'),
    budgetPeriod: formData.get('budgetPeriod'),
    budgetAmountGel: numberValue(formData, 'budgetAmountGel'),
    dailyCalorieTarget: numberValue(formData, 'dailyCalorieTarget'),
    proteinTargetG: nullableNumberValue(formData, 'proteinTargetG'),
    carbohydrateTargetG: nullableNumberValue(formData, 'carbohydrateTargetG'),
    fatTargetG: nullableNumberValue(formData, 'fatTargetG'),
    fiberTargetG: nullableNumberValue(formData, 'fiberTargetG'),
    mealsPerDay: numberValue(formData, 'mealsPerDay'),
    maxCookMinutes: nullableNumberValue(formData, 'maxCookMinutes'),
    includeLeftovers: formData.has('includeLeftovers'),
    allowBatchCooking: formData.has('allowBatchCooking'),
    applianceIds: numberList(formData, 'applianceIds'),
    allergenIds: numberList(formData, 'allergenIds'),
    dietaryPatternIds: numberList(formData, 'dietaryPatternIds'),
  })

  if (!result.success) redirect(`/${locale}/onboarding?error=validation`)

  const supabase = await createClient()
  const claims = await supabase.auth.getClaims()
  if (!claims.data?.claims?.sub) redirect(`/${locale}/sign-in`)
  try {
    await createSufraApi(supabase as unknown as SufraTransport).saveProfile(result.data)
  } catch (error) {
    console.error('save_profile failed', error)
    redirect(`/${locale}/onboarding?error=save`)
  }
  redirect(`/${locale}/plan`)
}
