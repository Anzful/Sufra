import { withSupabase } from 'npm:@supabase/server@1.4.1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.4'
import { ZodError } from 'zod'

import {
  aiWeeklyPlanSchema,
  planEditRequestSchema,
  planEditResultSchema,
} from '../../../packages/shared/src/schemas/meal-plan.ts'
import { loadGenerationData } from '../_shared/generation-data.ts'
import { corsHeaders, errorMessage, errorResponse, jsonResponse } from '../_shared/http.ts'
import { hydrateAndValidatePlan } from '../_shared/orchestrator.ts'

type AdminClient = SupabaseClient<any>

interface PlanRow {
  id: string
  week_start_date: string
  summary_ka: string | null
  summary_en: string | null
  updated_at: string
}

interface MealRow {
  id: string
  day_index: number
  meal_slot: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  slot_position: number
  recipe_id: string
  servings: number
}

class FunctionError extends Error {
  constructor(
    readonly code: string,
    message: string,
    readonly status: number,
    readonly details?: unknown,
  ) {
    super(message)
  }
}

function knownProfileError(message: string): FunctionError | null {
  const errors: Record<string, string> = {
    ONBOARDING_INCOMPLETE: 'Complete onboarding before editing a meal plan.',
    PROFILE_TARGETS_INCOMPLETE: 'Store, budget, and calorie targets are required.',
    NO_SAFE_RECIPE_CANDIDATES: 'No recipes match the current safety and appliance filters.',
  }
  return errors[message] ? new FunctionError(message, errors[message], 422) : null
}

const handler = withSupabase({ auth: 'user', cors: corsHeaders }, async (request, context) => {
  if (request.method !== 'POST') {
    return errorResponse('METHOD_NOT_ALLOWED', 'Only POST is supported.', 405)
  }

  const userId = context.userClaims?.id
  if (!userId) return errorResponse('UNAUTHORIZED', 'A signed-in user is required.', 401)

  try {
    const input = planEditRequestSchema.parse(await request.json())
    const admin = context.supabaseAdmin as AdminClient

    const [planResult, mealsResult] = await Promise.all([
      admin
        .from('weekly_plans')
        .select('id, week_start_date, summary_ka, summary_en, updated_at')
        .eq('id', input.planId)
        .eq('user_id', userId)
        .eq('is_current', true)
        .eq('status', 'ready')
        .maybeSingle(),
      admin
        .from('planned_meals')
        .select('id, day_index, meal_slot, slot_position, recipe_id, servings')
        .eq('weekly_plan_id', input.planId)
        .eq('user_id', userId)
        .order('day_index')
        .order('slot_position'),
    ])

    if (planResult.error || mealsResult.error) {
      throw new FunctionError('DATABASE_ERROR', 'Could not load the weekly plan.', 500)
    }
    if (!planResult.data) {
      throw new FunctionError('PLAN_NOT_FOUND', 'A current ready plan was not found.', 404)
    }

    const plan = planResult.data as PlanRow
    if (plan.updated_at !== input.expectedUpdatedAt) {
      throw new FunctionError(
        'PLAN_CHANGED',
        'The plan changed on another device. Reload it before editing again.',
        409,
      )
    }

    const meals = (mealsResult.data ?? []) as MealRow[]
    if (!meals.some((meal) => meal.id === input.mealId)) {
      throw new FunctionError(
        'MEAL_NOT_FOUND',
        'The selected meal was not found in this plan.',
        404,
      )
    }

    const candidatePlan = aiWeeklyPlanSchema.parse({
      summaryKa: plan.summary_ka ?? 'მომხმარებლის მიერ განახლებული კვირის გეგმა.',
      summaryEn: plan.summary_en ?? 'A weekly plan updated by the user.',
      days: Array.from({ length: 7 }, (_, dayIndex) => ({
        dayIndex,
        meals: meals
          .filter((meal) => meal.day_index === dayIndex)
          .map((meal) => ({
            recipeId:
              meal.id === input.mealId && input.replacementRecipeId
                ? input.replacementRecipeId
                : meal.recipe_id,
            mealSlot: meal.meal_slot,
            slotPosition: meal.slot_position,
            servings:
              meal.id === input.mealId && input.servings !== undefined
                ? input.servings
                : Number(meal.servings),
          })),
      })),
    })

    const generationData = await loadGenerationData(
      admin,
      userId,
      plan.week_start_date,
      input.locale,
    )
    const validation = hydrateAndValidatePlan(candidatePlan, generationData)
    if (!validation.payload) {
      throw new FunctionError(
        'EDIT_CONSTRAINTS_UNSATISFIED',
        'That edit is not compatible with the profile safety rules.',
        422,
        validation.errors,
      )
    }

    // Explicit user edits may move targets or budget out of tolerance. Preserve
    // the edit and return those deterministic validation results as warnings.
    const warnings = [...new Set([...validation.warnings, ...validation.errors])]
    const persistResult = await admin.rpc('replace_edited_plan', {
      p_user_id: userId,
      p_plan_id: input.planId,
      p_expected_updated_at: input.expectedUpdatedAt,
      p_payload: {
        ...validation.payload,
        generationVersion: 'v1-edit',
        warnings,
      },
    })

    if (persistResult.error) {
      if (persistResult.error.code === '40001') {
        throw new FunctionError(
          'PLAN_CHANGED',
          'The plan changed on another device. Reload it before editing again.',
          409,
        )
      }
      throw new FunctionError('DATABASE_ERROR', 'Could not persist the plan edit.', 500)
    }

    return jsonResponse(
      planEditResultSchema.parse({
        planId: input.planId,
        status: 'ready',
        warnings,
      }),
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return errorResponse('VALIDATION_ERROR', 'The request is invalid.', 400, error.issues)
    }
    const functionError =
      error instanceof FunctionError
        ? error
        : (knownProfileError(errorMessage(error)) ??
          new FunctionError('PLAN_UPDATE_FAILED', 'The weekly plan could not be updated.', 500))
    console.error('update-weekly-plan failed', { code: functionError.code, error })
    return errorResponse(
      functionError.code,
      functionError.message,
      functionError.status,
      functionError.details,
    )
  }
})

export default { fetch: handler }
