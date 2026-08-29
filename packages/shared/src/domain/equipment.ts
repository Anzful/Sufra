export type KitchenEquipmentCategory = 'cooking' | 'preparation'

const preparationEquipmentSlugs = new Set([
  'basic-kitchen-tools',
  'blender',
  'food-processor',
  'hand-mixer',
  'stand-mixer',
])

export function kitchenEquipmentCategory(slug: string): KitchenEquipmentCategory {
  return preparationEquipmentSlugs.has(slug) ? 'preparation' : 'cooking'
}
