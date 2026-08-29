import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      include: ['src/logic/**/*.ts'],
      provider: 'v8',
    },
    include: ['src/**/*.test.ts'],
  },
})
