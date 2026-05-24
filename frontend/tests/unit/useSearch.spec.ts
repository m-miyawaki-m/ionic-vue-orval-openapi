import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '../../src/mocks/server'
import { useSearch } from '../../src/composables/useSearch'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useSearch', () => {
  it('returns results for a query', async () => {
    const { results, search } = useSearch()
    await search('cof')
    expect(results.value).toHaveLength(3)
  })
  it('clears results for empty query', async () => {
    const { results, search } = useSearch()
    await search('')
    expect(results.value).toHaveLength(0)
  })
})
