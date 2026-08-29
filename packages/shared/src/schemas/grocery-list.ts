import { z } from 'zod'

import { measurementUnitSchema } from './common.ts'

export const groceryListItemUpdateSchema = z
  .object({
    itemId: z.uuid(),
    isChecked: z.boolean().optional(),
    userNote: z.string().trim().max(500).nullable().optional(),
  })
  .strict()
  .refine((value) => value.isChecked !== undefined || value.userNote !== undefined, {
    message: 'At least one field must be updated.',
  })

export const groceryQuantitySchema = z
  .object({
    quantity: z.number().finite().nonnegative(),
    unit: measurementUnitSchema,
  })
  .strict()

export type GroceryListItemUpdate = z.infer<typeof groceryListItemUpdateSchema>
