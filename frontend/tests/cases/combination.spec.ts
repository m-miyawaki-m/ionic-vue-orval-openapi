import { describe, it, expect } from 'vitest'
import cases from './combination.cases.json'
import { registry } from './registry'

type Rec = { id: string; group: string; kind: string; payload: Record<string, unknown>; expectValid: boolean; label: string }
const records = cases as Rec[]

describe('generated combination (pairwise) cases validate against full schema', () => {
  it('has combination records', () => {
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((r) => r.kind === 'combination')).toBe(true)
  })

  // Guard: every group must have a registry entry, else its records would be
  // silently skipped below (false-green). Fails loudly if a new group lacks one.
  it('all combination groups have a registry entry', () => {
    for (const g of new Set(records.map((r) => r.group))) {
      expect(registry[g], `missing registry entry for group '${g}'`).toBeDefined()
    }
  })

  for (const r of records) {
    const entry = registry[r.group]
    if (!entry) continue
    it(`${r.id}`, () => {
      expect(entry.schema.safeParse(r.payload).success).toBe(r.expectValid)
    })
  }
})
