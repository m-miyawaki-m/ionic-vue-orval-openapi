import { z } from 'zod'
import { itemInputSchema } from '../../src/validators/item'
import { loginSchema } from '../../src/validators/auth'

type Entry = { schema: z.ZodTypeAny; base: Record<string, unknown> }

export const registry: Record<string, Entry> = {
  item: { schema: itemInputSchema, base: { name: 'X', price: 100, category: 'food', code: 'ABCD1234' } },
  login: { schema: loginSchema, base: { username: 'demo', password: 'password1' } },
}
