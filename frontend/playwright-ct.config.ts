import { defineConfig, devices } from '@playwright/experimental-ct-vue'

export default defineConfig({
  testDir: './tests/ct',
  // Standalone HTML report (Storybook-independent). Dir is gitignored.
  reporter: [['list'], ['html', { outputFolder: 'playwright-ct-report', open: 'never' }]],
  use: {
    ...devices['Desktop Chrome'],
    ctViteConfig: {
      resolve: {},
    },
  },
})
