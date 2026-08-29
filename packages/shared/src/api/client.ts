import { DomainError } from '../domain/errors.ts'
import { generationResultSchema, mealPlanRequestSchema } from '../schemas/meal-plan.ts'
import { profileInputSchema } from '../schemas/profile.ts'
import type { SufraApi } from './contracts.ts'

interface TransportError {
  message: string
}

export interface SufraTransport {
  functions: {
    invoke: (
      functionName: string,
      options: { body: unknown },
    ) => Promise<{ data: unknown; error: TransportError | null }>
  }
  rpc: (
    functionName: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ error: TransportError | null }>
}

/** Creates the shared, runtime-neutral API facade used by Next.js and Expo clients. */
export function createSufraApi(transport: SufraTransport): SufraApi {
  return {
    async saveProfile(input) {
      const profile = profileInputSchema.parse(input)
      const result = await transport.rpc('save_profile', { p_profile: profile })
      if (result.error) {
        throw new DomainError('PROFILE_SAVE_FAILED', 'Could not save the profile.', {
          transportMessage: result.error.message,
        })
      }
    },

    async generateWeeklyPlan(input) {
      const request = mealPlanRequestSchema.parse(input)
      const result = await transport.functions.invoke('generate-weekly-plan', { body: request })
      if (result.error) {
        throw new DomainError('GENERATION_FAILED', 'Could not generate the weekly plan.', {
          transportMessage: result.error.message,
        })
      }
      return generationResultSchema.parse(result.data)
    },
  }
}
