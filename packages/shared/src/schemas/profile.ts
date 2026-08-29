import { z } from 'zod'

import { budgetPeriodSchema, localeSchema } from './common.ts'

const positiveTarget = z.number().finite().positive()

export const profileInputSchema = z
  .object({
    displayName: z.string().trim().min(1).max(80).nullable(),
    locale: localeSchema,
    timezone: z.string().trim().min(1).max(100).default('Asia/Tbilisi'),
    city: z.string().trim().min(1).max(120),
    preferredStoreId: z.number().int().positive(),
    householdSize: z.number().int().min(1).max(20),
    budgetPeriod: budgetPeriodSchema,
    budgetAmountGel: positiveTarget.max(1_000_000),
    dailyCalorieTarget: z.number().int().min(800).max(10_000),
    proteinTargetG: positiveTarget.max(1_000).nullable(),
    carbohydrateTargetG: positiveTarget.max(1_500).nullable(),
    fatTargetG: positiveTarget.max(1_000).nullable(),
    fiberTargetG: positiveTarget.max(250).nullable(),
    mealsPerDay: z.number().int().min(1).max(8),
    maxCookMinutes: z.number().int().min(5).max(1_440).nullable(),
    includeLeftovers: z.boolean(),
    allowBatchCooking: z.boolean(),
    applianceIds: z.array(z.number().int().positive()).max(30),
    allergenIds: z.array(z.number().int().positive()).max(30),
    dietaryPatternIds: z.array(z.number().int().positive()).max(10),
  })
  .strict()

export type ProfileInput = z.infer<typeof profileInputSchema>
