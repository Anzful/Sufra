import { describe, expect, it } from 'vitest'

import { color, priceFreshness } from './color.ts'
import { contrastRatio } from './contrast.ts'

interface Pairing {
  readonly name: string
  readonly foreground: string
  readonly background: string
  readonly minimum: number
}

/**
 * WCAG 2.2 minima: 4.5 for normal text (SC 1.4.3) and 3.0 for the visual
 * boundary of a user-interface component (SC 1.4.11). The border rows are the
 * ones the previous palette violated, at 1.28.
 */
const pairings: readonly Pairing[] = [
  { name: 'body text on page', foreground: color.linen900, background: color.linen50, minimum: 14 },
  {
    name: 'display headline on page',
    foreground: color.linen950,
    background: color.linen50,
    minimum: 14,
  },
  { name: 'subhead on page', foreground: color.linen700, background: color.linen50, minimum: 7 },
  {
    name: 'secondary text on page',
    foreground: color.linen600,
    background: color.linen50,
    minimum: 6,
  },
  {
    name: 'tertiary text on page',
    foreground: color.linen500,
    background: color.linen50,
    minimum: 4.5,
  },
  {
    name: 'tertiary text on inset fill',
    foreground: color.linen500,
    background: color.linen100,
    minimum: 4.5,
  },
  {
    name: 'control border on page (SC 1.4.11)',
    foreground: color.linen400,
    background: color.linen50,
    minimum: 3,
  },
  {
    name: 'control border on card (SC 1.4.11)',
    foreground: color.linen400,
    background: color.linen0,
    minimum: 3,
  },
  {
    name: 'brand on page',
    foreground: color.pomegranate600,
    background: color.linen50,
    minimum: 4.5,
  },
  {
    name: 'brand on selected tint',
    foreground: color.pomegranate600,
    background: color.pomegranate50,
    minimum: 4.5,
  },
  {
    name: 'white on brand',
    foreground: color.linen0,
    background: color.pomegranate600,
    minimum: 4.5,
  },
  {
    name: 'white on brand pressed',
    foreground: color.linen0,
    background: color.pomegranate700,
    minimum: 4.5,
  },
  {
    name: 'white on primary button fill',
    foreground: color.linen0,
    background: color.linen900,
    minimum: 7,
  },
]

const semanticAccents = [
  { name: 'olive', accent: color.olive600, tint: color.olive50 },
  { name: 'success', accent: color.success600, tint: color.success50 },
  { name: 'warning', accent: color.warning600, tint: color.warning50 },
  { name: 'danger', accent: color.danger600, tint: color.danger50 },
  { name: 'brass', accent: color.brass600, tint: color.warning50 },
] as const

function assertAtLeast(name: string, foreground: string, background: string, minimum: number) {
  const ratio = contrastRatio(foreground, background)
  expect(
    ratio,
    `${name}: ${foreground} on ${background} measured ${ratio.toFixed(2)}:1, needs ${minimum}:1`,
  ).toBeGreaterThanOrEqual(minimum)
}

describe('Table Linen palette contrast', () => {
  it.each(pairings)('$name clears $minimum:1', ({ name, foreground, background, minimum }) => {
    assertAtLeast(name, foreground, background, minimum)
  })

  it.each(semanticAccents)('$name accent is legible on page and on its own tint', (entry) => {
    assertAtLeast(`${entry.name} on page`, entry.accent, color.linen50, 4.5)
    assertAtLeast(`${entry.name} on tint`, entry.accent, entry.tint, 4.5)
  })

  it.each(Object.entries(priceFreshness))(
    '%s freshness pill is legible against its own background',
    (state, pair) => {
      assertAtLeast(`${state} pill`, pair.foreground, pair.background, 4.5)
    },
  )
})
