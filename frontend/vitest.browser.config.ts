import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    include: ['tests/browser/**/*.spec.ts'],
    browser: {
      enabled: true,
      name: 'chromium',
      provider: 'playwright',
      headless: true,
    },
    // Standalone result artifacts (Storybook-independent). Dir is gitignored.
    reporters: ['default', 'junit', 'json'],
    outputFile: {
      junit: './vitest-results/browser-junit.xml',
      json: './vitest-results/browser-results.json',
    },
  },
})
