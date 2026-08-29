import { z } from 'zod'

import { budgetPeriodSchema, localeSchema } from './common.ts'

const positiveTarget = z.number().finite().positive()

export const mealMoodSlugs = [
  'speedy-meals',
  'low-calorie',
  'family-favourites',
  'healthy-comfort',
  'fakeaway',
  'gut-friendly',
  'protein-packed',
] as const

export const mealMoodSlugSchema = z.enum(mealMoodSlugs)

export type MealMoodSlug = z.infer<typeof mealMoodSlugSchema>

export const mealMoodOptions: ReadonlyArray<{
  slug: MealMoodSlug
  title: { ka: string; en: string }
  description: { ka: string; en: string }
}> = [
  {
    slug: 'speedy-meals',
    title: { ka: 'სწრაფი კერძები', en: 'Speedy meals' },
    description: {
      ka: 'მარტივი კერძები მოკლე დროში',
      en: 'Simple meals with less time in the kitchen',
    },
  },
  {
    slug: 'low-calorie',
    title: { ka: 'მსუბუქი კერძები', en: 'Low calorie' },
    description: {
      ka: 'მსუბუქი, ბოსტნეულით მდიდარი არჩევანი',
      en: 'Lighter, vegetable-forward choices',
    },
  },
  {
    slug: 'family-favourites',
    title: { ka: 'ოჯახის რჩეული', en: 'Family favourites' },
    description: {
      ka: 'ყველასთვის ნაცნობი და საყვარელი გემოები',
      en: 'Familiar meals everyone can enjoy',
    },
  },
  {
    slug: 'healthy-comfort',
    title: { ka: 'ჯანსაღი კომფორტი', en: 'Healthy comfort' },
    description: {
      ka: 'თბილი, ნოყიერი და დაბალანსებული კერძები',
      en: 'Cosy, satisfying, balanced meals',
    },
  },
  {
    slug: 'fakeaway',
    title: { ka: 'სახლური ფეიქავეი', en: 'Fakeaway' },
    description: {
      ka: 'საყვარელი შეკვეთების სახლური ვერსიები',
      en: 'Homemade versions of takeaway favourites',
    },
  },
  {
    slug: 'gut-friendly',
    title: { ka: 'ნაწლავებისთვის სასარგებლო', en: 'Gut friendly' },
    description: {
      ka: 'ბოჭკოთი მდიდარი და მრავალფეროვანი',
      en: 'Fibre-rich and varied ingredients',
    },
  },
  {
    slug: 'protein-packed',
    title: { ka: 'ცილებით მდიდარი', en: 'Protein packed' },
    description: { ka: 'მეტი ცილა ყოველი დღის კერძებში', en: 'More protein across the week' },
  },
]

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
    mealMoodSlug: mealMoodSlugSchema.default('healthy-comfort'),
    dailyCalorieTarget: z.number().int().min(800).max(10_000),
    proteinTargetG: positiveTarget.max(1_000).nullable(),
    carbohydrateTargetG: positiveTarget.max(1_500).nullable(),
    fatTargetG: positiveTarget.max(1_000).nullable(),
    fiberTargetG: positiveTarget.max(250).nullable(),
    mealsPerDay: z.number().int().min(1).max(8),
    maxCookMinutes: z.number().int().min(5).max(1_440).nullable(),
    includeLeftovers: z.boolean(),
    allowBatchCooking: z.boolean(),
    applianceIds: z.array(z.number().int().positive()).min(1).max(30),
    allergenIds: z.array(z.number().int().positive()).max(30),
    dietaryPatternIds: z.array(z.number().int().positive()).length(1),
  })
  .strict()

export type ProfileInput = z.infer<typeof profileInputSchema>
