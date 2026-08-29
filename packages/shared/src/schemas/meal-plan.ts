import { z } from 'zod'

import { localeSchema, mealSlotSchema } from './common.ts'

export const mealPlanRequestSchema = z
  .object({
    weekStartDate: z.iso.date(),
    locale: localeSchema,
    idempotencyKey: z.uuid(),
  })
  .strict()

export const aiMealSelectionSchema = z
  .object({
    recipeId: z.uuid(),
    mealSlot: mealSlotSchema,
    slotPosition: z.number().int().min(1).max(8),
    servings: z.number().min(0.25).max(100),
  })
  .strict()

export const aiPlanDaySchema = z
  .object({
    dayIndex: z.number().int().min(0).max(6),
    meals: z.array(aiMealSelectionSchema).min(1).max(8),
  })
  .strict()

export const aiWeeklyPlanProviderSchema = z
  .object({
    summaryKa: z.string().min(1).max(500),
    summaryEn: z.string().min(1).max(500),
    days: z.array(aiPlanDaySchema).length(7),
  })
  .strict()

export const aiWeeklyPlanSchema = aiWeeklyPlanProviderSchema.superRefine((plan, context) => {
  const dayIndexes = new Set(plan.days.map((day) => day.dayIndex))
  if (dayIndexes.size !== 7 || [...dayIndexes].some((dayIndex) => dayIndex < 0 || dayIndex > 6)) {
    context.addIssue({
      code: 'custom',
      message: 'The plan must contain each day index from 0 through 6 exactly once.',
      path: ['days'],
    })
  }

  for (const [dayPosition, day] of plan.days.entries()) {
    const keys = new Set<string>()
    for (const [mealPosition, meal] of day.meals.entries()) {
      const key = `${meal.mealSlot}:${meal.slotPosition}`
      if (keys.has(key)) {
        context.addIssue({
          code: 'custom',
          message: 'Meal slots must be unique within a day.',
          path: ['days', dayPosition, 'meals', mealPosition],
        })
      }
      keys.add(key)
    }
  }
})

export const aiWeeklyPlanJsonSchema = z.toJSONSchema(aiWeeklyPlanProviderSchema, {
  target: 'draft-2020-12',
  unrepresentable: 'throw',
})

export const generationResultSchema = z
  .object({
    jobId: z.uuid(),
    planId: z.uuid(),
    status: z.literal('ready'),
    warnings: z.array(z.string()),
  })
  .strict()

export const planEditRequestSchema = z
  .object({
    planId: z.uuid(),
    mealId: z.uuid(),
    expectedUpdatedAt: z.iso.datetime({ offset: true }),
    replacementRecipeId: z.uuid().optional(),
    servings: z.number().min(0.25).max(100).optional(),
    locale: localeSchema,
  })
  .strict()
  .refine((input) => input.replacementRecipeId !== undefined || input.servings !== undefined, {
    message: 'A replacement recipe or serving quantity is required.',
  })

export const planEditResultSchema = z
  .object({
    planId: z.uuid(),
    status: z.literal('ready'),
    warnings: z.array(z.string()),
  })
  .strict()

export type MealPlanRequest = z.infer<typeof mealPlanRequestSchema>
export type AiMealSelection = z.infer<typeof aiMealSelectionSchema>
export type AiWeeklyPlan = z.infer<typeof aiWeeklyPlanSchema>
export type GenerationResult = z.infer<typeof generationResultSchema>
export type PlanEditRequest = z.infer<typeof planEditRequestSchema>
export type PlanEditResult = z.infer<typeof planEditResultSchema>
