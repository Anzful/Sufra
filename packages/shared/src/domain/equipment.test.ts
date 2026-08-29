import { describe, expect, it } from 'vitest'

import { kitchenEquipmentCategory } from './equipment.ts'

describe('kitchenEquipmentCategory', () => {
  it('separates meal-prep tools from cooking equipment', () => {
    expect(kitchenEquipmentCategory('blender')).toBe('preparation')
    expect(kitchenEquipmentCategory('basic-kitchen-tools')).toBe('preparation')
    expect(kitchenEquipmentCategory('oven')).toBe('cooking')
    expect(kitchenEquipmentCategory('air-fryer')).toBe('cooking')
  })
})
