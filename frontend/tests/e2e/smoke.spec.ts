import { test, expect } from '@playwright/test'

test('app boots and Tab1 shows items from MSW', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('items-list')).toBeVisible()
  await expect(page.getByText('Coffee')).toBeVisible()
})
