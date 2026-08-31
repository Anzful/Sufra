import { color } from './color.ts'

export interface Shadow {
  readonly y: number
  readonly blur: number
  readonly spread: number
  readonly color: string
  readonly opacity: number
}

/**
 * Neutral descriptors rather than CSS strings, so web can emit `box-shadow`
 * and React Native can map to shadowOffset/shadowRadius/elevation from one
 * source. Level 0 carries no shadow at all. Separation there comes from a
 * 1px `linen200` rule.
 */
export const elevation = {
  0: null,
  1: { y: 1, blur: 2, spread: 0, color: color.linen900, opacity: 0.05 },
  2: { y: 8, blur: 24, spread: 0, color: color.linen900, opacity: 0.08 },
} as const satisfies Record<number, Shadow | null>

export type ElevationLevel = keyof typeof elevation
