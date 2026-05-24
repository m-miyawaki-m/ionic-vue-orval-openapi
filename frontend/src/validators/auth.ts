import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(64),
})
export type LoginInput = z.infer<typeof loginSchema>
