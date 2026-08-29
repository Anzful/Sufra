import type {
  CandidateRecipe,
  GenerationContext,
} from '../../../packages/shared/src/domain/types.ts'

export const PROMPT_VERSION = 'weekly-plan-v1'

export function buildPlanInstructions(): string {
  return [
    'You are Sufra’s meal-planning scheduler for households in Georgia.',
    'Select only recipe IDs present in the supplied candidate list.',
    'Never invent recipes, ingredients, nutrition, appliances, or prices.',
    'Return seven distinct day indexes, 0 through 6.',
    'Each day must contain exactly the requested mealsPerDay meal entries.',
    'Use slotPosition 1 unless multiple snacks require additional positions.',
    'servings is the total recipe servings prepared for the whole household.',
    'Vary servings modestly when needed to approach the per-person daily nutrition target.',
    'Prefer loved ingredients, avoid disliked ingredients when practical, and never use avoided items.',
    'Prefer ingredient reuse across the week and respect available appliances and cook-time limits.',
    'Hard safety filtering has already happened; do not attempt to reintroduce excluded recipes.',
    'Write both short summaries naturally: summaryKa in Georgian and summaryEn in English.',
  ].join('\n')
}

export function buildPlanInput(
  context: GenerationContext,
  candidates: readonly CandidateRecipe[],
  repairFeedback: readonly string[] = [],
): string {
  return JSON.stringify({
    task: 'Schedule a seven-day meal plan from the allowed candidate recipes.',
    context,
    candidates,
    ...(repairFeedback.length === 0 ? {} : { repairFeedback }),
  })
}
