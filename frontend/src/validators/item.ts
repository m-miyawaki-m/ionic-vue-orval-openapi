import { z } from 'zod'

export const itemInputSchema = z.object({
  name: z.string().min(1).max(30),
  price: z.number().int().min(0).max(1000000),
  category: z.enum(['food', 'drink', 'other']),
  code: z.string().regex(/^[A-Z0-9]{8}$/),
})
export type ItemInputForm = z.infer<typeof itemInputSchema>
