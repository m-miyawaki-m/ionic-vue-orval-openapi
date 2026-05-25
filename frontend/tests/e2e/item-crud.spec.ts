import { test, expect, type Page } from '@playwright/test'

async function login(page: Page) {
  await page.goto('/login')
  await page.getByTestId('login-username').locator('input').fill('demo')
  await page.getByTestId('login-password').locator('input').fill('password1')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('items-list')).toBeVisible()
}

test('create item: fill form (incl. ion-select) and return to list', async ({ page }) => {
  await login(page)

  // open the create form
  await page.getByTestId('items-new').click()
  await expect(page.getByTestId('item-form-submit')).toBeVisible()

  // ion-input exposes a shadow <input>; type into it like the login flow
  await page.getByTestId('item-name').locator('input').fill('Tea')
  await page.getByTestId('item-price').locator('input').fill('250')

  // ion-select uses the default 'alert' interface: open overlay, pick radio, confirm
  await page.getByTestId('item-category').click()
  await page.locator('ion-alert').getByRole('radio', { name: 'drink' }).click()
  await page.locator('ion-alert').getByRole('button', { name: 'OK' }).click()

  await page.getByTestId('item-code').locator('input').fill('TEA00001')

  await page.getByTestId('item-form-submit').click()

  // MSW POST returns id 999, but GET /api/items serves the static fixture
  // (the create is not persisted), so we assert the flow completes without a
  // validation error and navigates back to the list.
  await expect(page.getByTestId('items-list')).toBeVisible()
  await expect(page.getByTestId('item-form-error')).toHaveCount(0)
})
