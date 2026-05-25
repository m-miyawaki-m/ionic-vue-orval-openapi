import { defineConfig, devices } from '@playwright/experimental-ct-vue'

export default defineConfig({
  testDir: './tests/ct',
  use: {
    ...devices['Desktop Chrome'],
    ctViteConfig: {
      resolve: {},
    },
  },
})
