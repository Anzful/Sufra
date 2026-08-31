import type { PriceFreshness } from '../logic/price-freshness.ts'

export const color = {
  linen0: '#FFFFFF',
  linen50: '#FAF6EE',
  linen100: '#F2ECE1',
  linen200: '#DFD6C6',
  linen300: '#C7BCA8',
  linen400: '#9A8A6F',
  linen500: '#736958',
  linen600: '#635948',
  linen700: '#4A4136',
  linen900: '#2A231A',
  linen950: '#1E1913',

  pomegranate50: '#F7EBEC',
  pomegranate600: '#8E2C3B',
  pomegranate700: '#6D1F2C',

  olive50: '#EDF1E7',
  olive600: '#4F6142',

  brass600: '#836420',

  success50: '#E8F1EA',
  success600: '#2F6B41',

  warning50: '#FBF0DC',
  warning600: '#8A5A12',

  danger50: '#F9E9E6',
  danger600: '#A32B22',
} as const

export type ColorToken = keyof typeof color

export interface StatusPair {
  readonly background: string
  readonly foreground: string
}

export const priceFreshness: Readonly<Record<PriceFreshness, StatusPair>> = {
  fresh: { background: color.success50, foreground: color.success600 },
  aging: { background: color.warning50, foreground: color.warning600 },
  stale: { background: color.warning50, foreground: color.brass600 },
  expired: { background: color.danger50, foreground: color.danger600 },
  unavailable: { background: color.linen100, foreground: color.linen500 },
} as const
