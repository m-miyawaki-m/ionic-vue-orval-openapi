import { test, expect } from '@playwright/test'

test('login, open scan via search tab, scan shows a code', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('login-username').locator('input').fill('demo')
  await page.getByTestId('login-password').locator('input').fill('password1')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('items-list')).toBeVisible()

  // in-app navigation only (auth is not persisted across reloads)
  // ion-tab-button renders with role=tab; use ARIA role to avoid shadow-DOM attribute mismatch
  await page.getByRole('tab', { name: 'Tab 2' }).click()
  await page.getByTestId('search-scan').click()
  await page.getByTestId('scan-scanner').click()
  await expect(page.getByTestId('scan-result')).toBeVisible()
})
