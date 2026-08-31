import {
  NotoSansGeorgian_400Regular,
  NotoSansGeorgian_500Medium,
  NotoSansGeorgian_600SemiBold,
} from '@expo-google-fonts/noto-sans-georgian'
import {
  NotoSerifGeorgian_400Regular,
  NotoSerifGeorgian_500Medium,
  NotoSerifGeorgian_600SemiBold,
} from '@expo-google-fonts/noto-serif-georgian'
import {
  elevation,
  sizeFor,
  typeScale,
  type ElevationLevel,
  type FontFamilyName,
  type FontWeight,
  type TypeRoleName,
} from '@sufra/shared/design'
import type { TextStyle, ViewStyle } from 'react-native'

/**
 * Each weight is registered under its own family name because Android cannot
 * synthesise weights for a custom fontFamily, asking for one it has not been
 * given silently renders regular. Everything below therefore carries weight in
 * the family name and never emits fontWeight.
 */
export const fontAssets = {
  NotoSansGeorgian_400Regular,
  NotoSansGeorgian_500Medium,
  NotoSansGeorgian_600SemiBold,
  NotoSerifGeorgian_400Regular,
  NotoSerifGeorgian_500Medium,
  NotoSerifGeorgian_600SemiBold,
} as const

export type RegisteredFont = keyof typeof fontAssets

const familyStem: Record<FontFamilyName, string> = {
  sans: 'NotoSansGeorgian',
  serif: 'NotoSerifGeorgian',
}

const weightName: Record<FontWeight, string> = {
  400: 'Regular',
  500: 'Medium',
  600: 'SemiBold',
}

export function fontFamilyFor(family: FontFamilyName, weight: FontWeight): RegisteredFont {
  return `${familyStem[family]}_${weight}${weightName[weight]}` as RegisteredFont
}

/**
 * Resolves a shared type role at mobile sizes. The shared scale stores
 * lineHeight as a unitless multiplier and tracking in em, both of which React
 * Native expects in absolute pixels.
 */
export function typeStyle(role: TypeRoleName): TextStyle {
  const definition = typeScale[role]
  const size = sizeFor(definition, 'mobile')
  return {
    fontFamily: fontFamilyFor(definition.family, definition.weight),
    fontSize: size,
    letterSpacing: Math.round(size * definition.tracking * 100) / 100,
    lineHeight: Math.round(size * definition.lineHeight),
  }
}

/** Maps a shared elevation level onto iOS shadow props and Android's elevation scalar. */
export function shadow(level: ElevationLevel): ViewStyle {
  const descriptor = elevation[level]
  if (!descriptor) return {}
  return {
    elevation: level * 2,
    shadowColor: descriptor.color,
    shadowOffset: { width: 0, height: descriptor.y },
    shadowOpacity: descriptor.opacity,
    shadowRadius: descriptor.blur / 2,
  }
}
