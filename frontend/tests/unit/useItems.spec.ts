import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '../../src/mocks/server'
import { useItems } from '../../src/composables/useItems'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useItems', () => {
  it('loads items from the API and exposes them', async () => {
    const { items, loading, load } = useItems()
    expect(loading.value).toBe(false)
    await load()
    expect(loading.value).toBe(false)
    expect(items.value).toHaveLength(3)
    expect(items.value[0].name).toBe('Coffee')
  })
})
