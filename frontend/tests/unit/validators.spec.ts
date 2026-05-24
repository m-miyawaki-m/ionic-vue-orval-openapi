import { describe, it, expect } from 'vitest'
import { loginSchema } from '../../src/validators/auth'
import { itemInputSchema } from '../../src/validators/item'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ username: 'demo', password: 'password1' }).success).toBe(true)
  })
  it('rejects short username (<3) and short password (<8)', () => {
    expect(loginSchema.safeParse({ username: 'ab', password: 'short' }).success).toBe(false)
  })
})

describe('itemInputSchema', () => {
  it('accepts valid item input', () => {
    expect(
      itemInputSchema.safeParse({ name: 'X', price: 0, category: 'food', code: 'ABCD1234' }).success
    ).toBe(true)
  })
  it('rejects empty name, negative price, invalid category and short code', () => {
    expect(
      itemInputSchema.safeParse({ name: '', price: -1, category: 'xxx', code: 'abc' }).success
    ).toBe(false)
  })
})
