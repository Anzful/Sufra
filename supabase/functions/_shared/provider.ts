import {
  aiWeeklyPlanJsonSchema,
  aiWeeklyPlanSchema,
  type AiWeeklyPlan,
} from '../../../packages/shared/src/schemas/meal-plan.ts'
import type {
  CandidateRecipe,
  GenerationContext,
} from '../../../packages/shared/src/domain/types.ts'
import { buildPlanInput, buildPlanInstructions } from './prompt.ts'

export type AiProvider = 'openai' | 'anthropic'

export interface ProviderResult {
  plan: AiWeeklyPlan
  responseId: string | null
  inputTokens: number | null
  outputTokens: number | null
}

function outputTextFromOpenAI(body: Record<string, unknown>): string | null {
  if (typeof body.output_text === 'string') return body.output_text
  const output = Array.isArray(body.output) ? body.output : []
  for (const item of output) {
    if (!item || typeof item !== 'object') continue
    const content = Array.isArray((item as { content?: unknown }).content)
      ? ((item as { content: unknown[] }).content ?? [])
      : []
    for (const block of content) {
      if (
        block &&
        typeof block === 'object' &&
        (block as { type?: unknown }).type === 'output_text' &&
        typeof (block as { text?: unknown }).text === 'string'
      ) {
        return (block as { text: string }).text
      }
    }
  }
  return null
}

async function generateWithOpenAI(
  model: string,
  context: GenerationContext,
  candidates: readonly CandidateRecipe[],
  safetyIdentifier: string,
  repairFeedback: readonly string[],
): Promise<ProviderResult> {
  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured.')

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      instructions: buildPlanInstructions(),
      input: buildPlanInput(context, candidates, repairFeedback),
      store: false,
      safety_identifier: safetyIdentifier,
      text: {
        format: {
          type: 'json_schema',
          name: 'sufra_weekly_meal_plan',
          strict: true,
          schema: aiWeeklyPlanJsonSchema,
        },
      },
    }),
  })
  const body = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status}): ${JSON.stringify(body)}`)
  }
  const outputText = outputTextFromOpenAI(body)
  if (!outputText) throw new Error('OpenAI returned no output text.')
  const usage = (body.usage ?? {}) as Record<string, unknown>
  return {
    plan: aiWeeklyPlanSchema.parse(JSON.parse(outputText)),
    responseId: typeof body.id === 'string' ? body.id : null,
    inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : null,
    outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : null,
  }
}

async function generateWithAnthropic(
  model: string,
  context: GenerationContext,
  candidates: readonly CandidateRecipe[],
  safetyIdentifier: string,
  repairFeedback: readonly string[],
): Promise<ProviderResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured.')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8_000,
      system: buildPlanInstructions(),
      metadata: { user_id: safetyIdentifier },
      messages: [{ role: 'user', content: buildPlanInput(context, candidates, repairFeedback) }],
      output_config: {
        format: { type: 'json_schema', schema: aiWeeklyPlanJsonSchema },
      },
    }),
  })
  const body = (await response.json()) as Record<string, unknown>
  if (!response.ok) {
    throw new Error(`Anthropic request failed (${response.status}): ${JSON.stringify(body)}`)
  }
  const blocks = Array.isArray(body.content) ? body.content : []
  const textBlock = blocks.find(
    (block) => block && typeof block === 'object' && (block as { type?: unknown }).type === 'text',
  ) as { text?: unknown } | undefined
  if (typeof textBlock?.text !== 'string') throw new Error('Anthropic returned no text block.')
  const usage = (body.usage ?? {}) as Record<string, unknown>
  return {
    plan: aiWeeklyPlanSchema.parse(JSON.parse(textBlock.text)),
    responseId: typeof body.id === 'string' ? body.id : null,
    inputTokens: typeof usage.input_tokens === 'number' ? usage.input_tokens : null,
    outputTokens: typeof usage.output_tokens === 'number' ? usage.output_tokens : null,
  }
}

export async function hashSafetyIdentifier(userId: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(userId))
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function providerConfiguration(): { provider: AiProvider; model: string } {
  const provider = (Deno.env.get('AI_PROVIDER') ?? 'openai') as AiProvider
  if (provider !== 'openai' && provider !== 'anthropic') {
    throw new Error('AI_PROVIDER must be openai or anthropic.')
  }
  const model = Deno.env.get(provider === 'openai' ? 'OPENAI_MODEL' : 'ANTHROPIC_MODEL')
  if (!model) throw new Error(`${provider.toUpperCase()}_MODEL is not configured.`)
  return { provider, model }
}

export async function generateProviderPlan(
  provider: AiProvider,
  model: string,
  context: GenerationContext,
  candidates: readonly CandidateRecipe[],
  safetyIdentifier: string,
  repairFeedback: readonly string[] = [],
): Promise<ProviderResult> {
  return provider === 'openai'
    ? generateWithOpenAI(model, context, candidates, safetyIdentifier, repairFeedback)
    : generateWithAnthropic(model, context, candidates, safetyIdentifier, repairFeedback)
}
