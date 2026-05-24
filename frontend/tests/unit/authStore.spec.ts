import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { server } from '../../src/mocks/server'
import { useAuthStore } from '../../src/stores/auth'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => setActivePinia(createPinia()))

describe('useAuthStore', () => {
  it('logs in and stores token', async () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    await auth.login('demo', 'password1')
    expect(auth.token).toBe('mock-token-123')
    expect(auth.isAuthenticated).toBe(true)
  })
  it('logout clears token', async () => {
    const auth = useAuthStore()
    await auth.login('demo', 'password1')
    auth.logout()
    expect(auth.isAuthenticated).toBe(false)
  })
})
