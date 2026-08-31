export const duration = {
  instant: 120,
  enter: 200,
  sheet: 280,
  route: 320,
} as const

export type DurationToken = keyof typeof duration

/** Cubic-bezier control points, consumable by both CSS and Reanimated. */
export type EasingCurve = readonly [number, number, number, number]

export const easing = {
  enter: [0.32, 0.72, 0, 1],
  exit: [0.4, 0, 1, 1],
  standard: [0.4, 0, 0.2, 1],
} as const satisfies Record<string, EasingCurve>

export type EasingToken = keyof typeof easing

export const sheetSpring = {
  damping: 30,
  stiffness: 280,
  mass: 0.9,
} as const
