import { describe, expect, it } from 'vitest'

import { recipeMatchesDiet } from './candidate-filter.ts'

describe('recipeMatchesDiet', () => {
  it('treats vegan recipes as compatible with vegetarian and pescatarian plans', () => {
    expect(recipeMatchesDiet(['vegan'], ['vegetarian'])).toBe(true)
    expect(recipeMatchesDiet(['vegan'], ['pescatarian'])).toBe(true)
  })

  it('keeps vegan plans strict and leaves omnivore plans unrestricted', () => {
    expect(recipeMatchesDiet(['vegetarian'], ['vegan'])).toBe(false)
    expect(recipeMatchesDiet(['omnivore'], ['omnivore'])).toBe(true)
    expect(recipeMatchesDiet(['vegetarian'], [])).toBe(true)
  })
})
