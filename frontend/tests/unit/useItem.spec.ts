import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '../../src/mocks/server'
import { useItem } from '../../src/composables/useItem'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useItem', () => {
  it('loads a single item', async () => {
    const { item, loadItem } = useItem()
    await loadItem(1)
    expect(item.value?.name).toBe('Coffee')
  })
})
