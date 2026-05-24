import { describe, it, expect } from 'vitest'
import { loadOpenapiConstraints } from '../../scripts/gen-cases/openapi-adapter'
import { loadCsvConstraints } from '../../scripts/gen-cases/csv-adapter'
import { loadDocItems } from '../../scripts/gen-cases/docItems'

describe('adapters', () => {
  it('openapi adapter extracts item & login constraints', () => {
    const cs = loadOpenapiConstraints()
    const name = cs.find((c) => c.group === 'item' && c.field === 'name')!
    expect(name.maxLength).toBe(30)
    const price = cs.find((c) => c.group === 'item' && c.field === 'price')!
    expect(price.maximum).toBe(1000000)
    const cat = cs.find((c) => c.group === 'item' && c.field === 'category')!
    expect(cat.enumValues).toEqual(['food', 'drink', 'other'])
    const code = cs.find((c) => c.group === 'item' && c.field === 'code')!
    expect(code.pattern).toBe('^[A-Z0-9]{8}$')
    const user = cs.find((c) => c.group === 'login' && c.field === 'username')!
    expect([user.minLength, user.maxLength]).toEqual([3, 20])
  })
  it('csv adapter extracts equivalent constraints', () => {
    const cs = loadCsvConstraints()
    const name = cs.find((c) => c.group === 'item' && c.field === 'name')!
    expect([name.minLength, name.maxLength]).toEqual([1, 30])
    const cat = cs.find((c) => c.group === 'item' && c.field === 'category')!
    expect(cat.enumValues).toEqual(['food', 'drink', 'other'])
  })
  it('doc items from event/store specs', () => {
    const items = loadDocItems()
    expect(items.some((d) => d.source === 'event-spec' && d.kind === 'operation')).toBe(true)
    expect(items.some((d) => d.source === 'store-spec' && d.kind === 'state')).toBe(true)
  })
})
