import { test, expect, Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByTestId('login-username').locator('input').fill('demo')
  await page.getByTestId('login-password').locator('input').fill('password1')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('items-list')).toBeVisible()
}

test('login page visual', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByTestId('login-submit')).toBeVisible()
  await expect(page).toHaveScreenshot('login.png', { animations: 'disabled' })
})

test('items list visual', async ({ page }) => {
  await login(page)
  await expect(page.getByText('Coffee')).toBeVisible()
  await expect(page).toHaveScreenshot('items.png', { animations: 'disabled' })
})
