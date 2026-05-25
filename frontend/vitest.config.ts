import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['tests/unit/**/*.spec.ts', 'tests/cases/**/*.spec.ts'],
    // Standalone result artifacts (Storybook-independent). Dir is gitignored.
    reporters: ['default', 'junit', 'json'],
    outputFile: {
      junit: './vitest-results/unit-junit.xml',
      json: './vitest-results/unit-results.json',
    },
  },
})
