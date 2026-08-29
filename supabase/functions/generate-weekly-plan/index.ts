import { withSupabase } from 'npm:@supabase/server@1.4.1'
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2.112.4'
import { ZodError } from 'zod'

import {
  generationResultSchema,
  mealPlanRequestSchema,
} from '../../../packages/shared/src/schemas/meal-plan.ts'
import { loadGenerationData } from '../_shared/generation-data.ts'
import { corsHeaders, errorMessage, errorResponse, jsonResponse } from '../_shared/http.ts'
import { hydrateAndValidatePlan } from '../_shared/orchestrator.ts'
import { PROMPT_VERSION } from '../_shared/prompt.ts'
import {
  generateProviderPlan,
  hashSafetyIdentifier,
  providerConfiguration,
} from '../_shared/provider.ts'

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1_000
const RATE_LIMIT_MAX_JOBS = 3
type AdminClient = SupabaseClient<any>

interface ExistingJob {
  id: string
  status: 'queued' | 'running' | 'succeeded' | 'failed'
  weekly_plan_id: string | null
  output_snapshot: { warnings?: unknown } | null
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

function tokenSum(...values: Array<number | null>): number | null {
  const present = values.filter((value): value is number => value !== null)
  return present.length === 0 ? null : present.reduce((sum, value) => sum + value, 0)
}

function warningsFromSnapshot(snapshot: ExistingJob['output_snapshot']): string[] {
  if (!Array.isArray(snapshot?.warnings)) return []
  return snapshot.warnings.filter((warning): warning is string => typeof warning === 'string')
}

async function findExistingJob(
  admin: AdminClient,
  userId: string,
  idempotencyKey: string,
): Promise<ExistingJob | null> {
  const result = await admin
    .from('plan_generation_jobs')
    .select('id, status, weekly_plan_id, output_snapshot')
    .eq('user_id', userId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (result.error) throw new FunctionError('DATABASE_ERROR', 'Could not read generation job.', 500)
  return result.data as ExistingJob | null
}

function responseForExistingJob(job: ExistingJob): Response {
  if (job.status === 'succeeded' && job.weekly_plan_id) {
    return jsonResponse(
      generationResultSchema.parse({
        jobId: job.id,
        planId: job.weekly_plan_id,
        status: 'ready',
        warnings: warningsFromSnapshot(job.output_snapshot),
      }),
    )
  }
  if (job.status === 'failed') {
    return errorResponse(
      'IDEMPOTENCY_KEY_FAILED',
      'This generation request previously failed. Retry with a new idempotency key.',
      409,
    )
  }
  return errorResponse(
    'GENERATION_IN_PROGRESS',
    'A meal plan is already being generated for this request.',
    409,
  )
}

async function enforceRateLimit(admin: AdminClient, userId: string): Promise<void> {
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()
  const result = await admin
    .from('plan_generation_jobs')
    .select('id')
    .eq('user_id', userId)
    .gte('created_at', since)
    .limit(RATE_LIMIT_MAX_JOBS)
  if (result.error) throw new FunctionError('DATABASE_ERROR', 'Could not check rate limit.', 500)
  if ((result.data?.length ?? 0) >= RATE_LIMIT_MAX_JOBS) {
    throw new FunctionError(
      'RATE_LIMITED',
      'Too many plans were requested recently. Please try again in a few minutes.',
      429,
    )
  }
}

function knownGenerationError(message: string): FunctionError | null {
  const errors: Record<string, string> = {
    ONBOARDING_INCOMPLETE: 'Complete onboarding before generating a meal plan.',
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

  let jobId: string | null = null
  try {
    const input = mealPlanRequestSchema.parse(await request.json())
    const admin = context.supabaseAdmin as AdminClient

    const existing = await findExistingJob(admin, userId, input.idempotencyKey)
    if (existing) return responseForExistingJob(existing)

    await enforceRateLimit(admin, userId)
    const { provider, model } = providerConfiguration()
    const generationData = await loadGenerationData(
      admin,
      userId,
      input.weekStartDate,
      input.locale,
    )

    const insertResult = await admin
      .from('plan_generation_jobs')
      .insert({
        user_id: userId,
        status: 'queued',
        provider,
        model,
        prompt_version: PROMPT_VERSION,
        idempotency_key: input.idempotencyKey,
        input_snapshot: {
          request: input,
          context: generationData.context,
          candidateRecipeIds: generationData.candidates.map((recipe) => recipe.id),
          pricedPackageCount: generationData.storePackages.length,
        },
      })
      .select('id')
      .single()

    if (insertResult.error) {
      if (insertResult.error.code === '23505') {
        const racedJob = await findExistingJob(admin, userId, input.idempotencyKey)
        if (racedJob) return responseForExistingJob(racedJob)
      }
      throw new FunctionError('DATABASE_ERROR', 'Could not create generation job.', 500)
    }
    const createdJobId = String(insertResult.data.id)
    jobId = createdJobId

    const runningResult = await admin
      .from('plan_generation_jobs')
      .update({ status: 'running', attempt_count: 1, started_at: new Date().toISOString() })
      .eq('id', createdJobId)
      .eq('user_id', userId)
    if (runningResult.error) {
      throw new FunctionError('DATABASE_ERROR', 'Could not start generation job.', 500)
    }

    const safetyIdentifier = await hashSafetyIdentifier(userId)
    const firstResult = await generateProviderPlan(
      provider,
      model,
      generationData.context,
      generationData.candidates,
      safetyIdentifier,
    )
    let providerResult = firstResult
    let validation = hydrateAndValidatePlan(firstResult.plan, generationData)
    let inputTokens = firstResult.inputTokens
    let outputTokens = firstResult.outputTokens

    if (validation.errors.length > 0 || !validation.payload) {
      const attemptUpdate = await admin
        .from('plan_generation_jobs')
        .update({ attempt_count: 2 })
        .eq('id', createdJobId)
        .eq('user_id', userId)
      if (attemptUpdate.error) {
        throw new FunctionError('DATABASE_ERROR', 'Could not update generation job.', 500)
      }

      const repairResult = await generateProviderPlan(
        provider,
        model,
        generationData.context,
        generationData.candidates,
        safetyIdentifier,
        validation.errors,
      )
      providerResult = repairResult
      inputTokens = tokenSum(inputTokens, repairResult.inputTokens)
      outputTokens = tokenSum(outputTokens, repairResult.outputTokens)
      validation = hydrateAndValidatePlan(repairResult.plan, generationData)
    }

    if (validation.errors.length > 0 || !validation.payload) {
      throw new FunctionError(
        'PLAN_CONSTRAINTS_UNSATISFIED',
        'A valid plan could not be produced for the current constraints.',
        422,
        validation.errors,
      )
    }

    const providerUpdate = await admin
      .from('plan_generation_jobs')
      .update({
        provider_response_id: providerResult.responseId,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      })
      .eq('id', createdJobId)
      .eq('user_id', userId)
    if (providerUpdate.error) {
      throw new FunctionError('DATABASE_ERROR', 'Could not update generation audit data.', 500)
    }

    const persistResult = await admin.rpc('persist_generated_plan', {
      p_user_id: userId,
      p_job_id: createdJobId,
      p_payload: validation.payload,
    })
    if (persistResult.error || typeof persistResult.data !== 'string') {
      throw new FunctionError('DATABASE_ERROR', 'Could not persist the generated plan.', 500)
    }

    return jsonResponse(
      generationResultSchema.parse({
        jobId: createdJobId,
        planId: persistResult.data,
        status: 'ready',
        warnings: validation.warnings,
      }),
      201,
    )
  } catch (error) {
    const functionError =
      error instanceof FunctionError
        ? error
        : (knownGenerationError(errorMessage(error)) ??
          new FunctionError('GENERATION_FAILED', 'Meal plan generation failed.', 502))

    if (jobId) {
      const failureResult = await (context.supabaseAdmin as AdminClient)
        .from('plan_generation_jobs')
        .update({
          status: 'failed',
          error_code: functionError.code,
          error_message: errorMessage(error).slice(0, 1_000),
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
        .eq('user_id', userId)
      if (failureResult.error)
        console.error('Could not mark generation job failed', failureResult.error)
    }

    if (error instanceof ZodError) {
      return errorResponse('VALIDATION_ERROR', 'The request is invalid.', 400, error.issues)
    }
    console.error('generate-weekly-plan failed', { code: functionError.code, error })
    return errorResponse(
      functionError.code,
      functionError.message,
      functionError.status,
      functionError.details,
    )
  }
})

export default { fetch: handler }
