import { describe, it, expect } from 'vitest'
import { allPairs, derivePairwise } from '../../scripts/gen-cases/pairwise'
import type { FieldConstraint } from '../../scripts/gen-cases/types'

const item: FieldConstraint[] = [
  { group: 'item', field: 'name', type: 'string', required: true, minLength: 1, maxLength: 30, example: 'Sample Item' },
  { group: 'item', field: 'price', type: 'integer', required: true, minimum: 0, maximum: 1000000, example: 1200 },
  { group: 'item', field: 'category', type: 'string', required: true, enumValues: ['food', 'drink', 'other'], example: 'food' },
  { group: 'item', field: 'code', type: 'string', required: true, pattern: '^[A-Z0-9]{8}$', example: 'ABCD1234' },
]

describe('allPairs', () => {
  it('4つの2値パラメータの全ペアを被覆する', () => {
    const rows = allPairs([2, 2, 2, 2])
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        for (const a of [0, 1])
          for (const b of [0, 1])
            expect(rows.some((r) => r[i] === a && r[j] === b)).toBe(true)
  })
})

describe('derivePairwise', () => {
  it('expectValid は全項目が有効値のときのみ true', () => {
    const cases = derivePairwise(item, 'item')
    expect(cases.length).toBeGreaterThan(0)
    for (const c of cases) {
      const anyInvalid = item.some((fc) => c.payload[fc.field] !== fc.example)
      expect(c.expectValid).toBe(!anyInvalid)
    }
    expect(cases.some((c) => c.expectValid)).toBe(true)
    expect(cases.some((c) => !c.expectValid)).toBe(true)
    expect(cases.every((c) => c.kind === 'combination')).toBe(true)
  })

  it('payload は全項目を含む', () => {
    const cases = derivePairwise(item, 'item')
    for (const c of cases) {
      expect(Object.keys(c.payload).sort()).toEqual(['category', 'code', 'name', 'price'])
    }
  })
})
