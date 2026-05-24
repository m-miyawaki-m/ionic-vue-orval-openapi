import { describe, it, expect } from 'vitest'
import { loginSchema } from '../../src/validators/auth'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ username: 'demo', password: 'password1' }).success).toBe(true)
  })
  it('rejects short username (<3) and short password (<8)', () => {
    expect(loginSchema.safeParse({ username: 'ab', password: 'short' }).success).toBe(false)
  })
})
