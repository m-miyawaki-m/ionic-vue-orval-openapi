export interface FormatPair { valid: string; invalid: string }

export const FORMAT_MAP: Record<string, FormatPair> = {
  email: { valid: 'user@example.com', invalid: 'not-an-email' },
  date: { valid: '2026-05-26', invalid: '2026-13-99' },
  'date-time': { valid: '2026-05-26T00:00:00Z', invalid: 'notadatetime' },
  uuid: { valid: '123e4567-e89b-12d3-a456-426614174000', invalid: 'xxxx' },
}
