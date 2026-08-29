import type { GenerationResult, MealPlanRequest } from '../schemas/meal-plan.ts'
import type { ProfileInput } from '../schemas/profile.ts'

export interface ApiErrorBody {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface SufraApi {
  saveProfile(input: ProfileInput): Promise<void>
  generateWeeklyPlan(input: MealPlanRequest): Promise<GenerationResult>
}

export type { GenerationResult, MealPlanRequest, ProfileInput }
