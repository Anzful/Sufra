/**
 * Two constraints drive this system and neither is recoverable by inspection:
 *
 * 1. Mkhedruli (the Georgian script) is caseless. No role may ever be rendered
 *    with text-transform uppercase. The transform is a no-op on Georgian while
 *    its letter-spacing side effects still apply, which desynchronises Georgian
 *    and Latin set on the same line.
 * 2. Noto Sans Georgian and Noto Serif Georgian ship tabular figures by default
 *    and expose no `tnum` feature. Price and calorie columns align with no
 *    font-feature-settings, and requesting `tnum` would be a silent no-op
 *    implying a guarantee the font does not advertise.
 */

export const fontFamily = {
  sans: 'Noto Sans Georgian',
  serif: 'Noto Serif Georgian',
} as const

export type FontFamilyName = keyof typeof fontFamily

export const fontWeight = {
  regular: 400,
  medium: 500,
  semibold: 600,
} as const

export type FontWeight = (typeof fontWeight)[keyof typeof fontWeight]

export interface PlatformSize {
  readonly web: number
  readonly mobile: number
}

export interface TypeRole {
  readonly size: number | PlatformSize
  readonly weight: FontWeight
  readonly lineHeight: number
  readonly tracking: number
  readonly family: FontFamilyName
}

export const typeScale = {
  displayXl: {
    size: { web: 56, mobile: 44 },
    weight: fontWeight.medium,
    lineHeight: 1.06,
    tracking: -0.015,
    family: 'serif',
  },
  displayL: {
    size: { web: 36, mobile: 30 },
    weight: fontWeight.medium,
    lineHeight: 1.14,
    tracking: -0.012,
    family: 'serif',
  },
  displayM: {
    size: { web: 26, mobile: 24 },
    weight: fontWeight.medium,
    lineHeight: 1.2,
    tracking: -0.008,
    family: 'serif',
  },
  titleL: {
    size: 20,
    weight: fontWeight.semibold,
    lineHeight: 1.3,
    tracking: 0,
    family: 'sans',
  },
  titleM: {
    size: 16,
    weight: fontWeight.semibold,
    lineHeight: 1.38,
    tracking: 0,
    family: 'sans',
  },
  bodyL: {
    size: { web: 17, mobile: 16 },
    weight: fontWeight.regular,
    lineHeight: 1.62,
    tracking: 0,
    family: 'sans',
  },
  bodyM: {
    size: 15,
    weight: fontWeight.regular,
    lineHeight: 1.6,
    tracking: 0,
    family: 'sans',
  },
  bodyS: {
    size: 14,
    weight: fontWeight.regular,
    lineHeight: 1.55,
    tracking: 0,
    family: 'sans',
  },
  label: {
    size: 11,
    weight: fontWeight.semibold,
    lineHeight: 1.3,
    tracking: 0.06,
    family: 'sans',
  },
  caption: {
    size: 12,
    weight: fontWeight.regular,
    lineHeight: 1.4,
    tracking: 0,
    family: 'sans',
  },
  numericXl: {
    size: 32,
    weight: fontWeight.medium,
    lineHeight: 1.1,
    tracking: 0,
    family: 'serif',
  },
  numericM: {
    size: 15,
    weight: fontWeight.medium,
    lineHeight: 1.4,
    tracking: 0,
    family: 'sans',
  },
} as const satisfies Record<string, TypeRole>

export type TypeRoleName = keyof typeof typeScale

export function sizeFor(role: TypeRole, platform: 'web' | 'mobile'): number {
  return typeof role.size === 'number' ? role.size : role.size[platform]
}
