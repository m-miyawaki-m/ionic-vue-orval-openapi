import { test, expect } from '@playwright/test'

test('login then see items', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('login-username').locator('input').fill('demo')
  await page.getByTestId('login-password').locator('input').fill('password1')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('items-list')).toBeVisible()
  await expect(page.getByText('Coffee')).toBeVisible()
})
