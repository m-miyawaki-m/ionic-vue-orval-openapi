import { describe, it, expect } from 'vitest'
import cases from './boundary.cases.json'
import { registry } from './registry'
import { ABSENT } from '../../scripts/gen-cases/types'

type Rec = {
  id: string; source: string; group: string; field: string
  value: unknown; expectValid: boolean; label: string
}

const records = cases as Rec[]

describe('generated boundary cases validate against screen schemas', () => {
  it('has cases from both openapi and field-spec sources', () => {
    const sources = new Set(records.map((r) => r.source))
    expect(sources.has('openapi')).toBe(true)
    expect(sources.has('field-spec')).toBe(true)
  })

  for (const r of records) {
    const entry = registry[r.group]
    if (!entry) continue
    it(`${r.id}`, () => {
      const obj: Record<string, unknown> = { ...entry.base }
      if (r.value === ABSENT) delete obj[r.field]
      else obj[r.field] = r.value
      expect(entry.schema.safeParse(obj).success).toBe(r.expectValid)
    })
  }
})
