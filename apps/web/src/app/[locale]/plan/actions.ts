'use server'

import {
  createSufraApi,
  planEditRequestSchema,
  type PlanEditRequest,
  type SufraTransport,
} from '@sufra/shared'
import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function updateLiveMealAction(
  input: PlanEditRequest,
): Promise<{ ok: boolean; message?: string }> {
  const parsed = planEditRequestSchema.safeParse(input)
  if (!parsed.success) return { ok: false, message: 'INVALID_EDIT' }

  const supabase = await createClient()
  const claims = await supabase.auth.getClaims()
  if (!claims.data?.claims?.sub) return { ok: false, message: 'UNAUTHORIZED' }

  try {
    await createSufraApi(supabase as unknown as SufraTransport).updateWeeklyPlan(parsed.data)
    revalidatePath(`/${parsed.data.locale}/plan`)
    return { ok: true }
  } catch {
    return { ok: false, message: 'PLAN_UPDATE_FAILED' }
  }
}
