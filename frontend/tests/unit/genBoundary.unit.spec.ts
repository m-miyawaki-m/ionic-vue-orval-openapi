import { describe, it, expect } from 'vitest'
import { deriveBoundaryCases } from '../../scripts/gen-cases/boundary'
import type { FieldConstraint } from '../../scripts/gen-cases/types'

describe('deriveBoundaryCases', () => {
  it('numeric min/max → 4 boundary points with correct validity', () => {
    const c: FieldConstraint = { group: 'item', field: 'price', type: 'integer', required: true, minimum: 0, maximum: 1000000, example: 1200 }
    const cases = deriveBoundaryCases(c)
    expect(cases).toEqual(expect.arrayContaining([
      expect.objectContaining({ value: -1, expectValid: false, label: 'minimum-1' }),
      expect.objectContaining({ value: 0, expectValid: true, label: 'minimum' }),
      expect.objectContaining({ value: 1000000, expectValid: true, label: 'maximum' }),
      expect.objectContaining({ value: 1000001, expectValid: false, label: 'maximum+1' }),
    ]))
  })

  it('string length → boundary lengths', () => {
    const c: FieldConstraint = { group: 'item', field: 'name', type: 'string', required: true, minLength: 1, maxLength: 30, example: 'Sample' }
    const cases = deriveBoundaryCases(c)
    const byLabel = Object.fromEntries(cases.map((x) => [x.label, x]))
    expect((byLabel['minLength-1'].value as string).length).toBe(0)
    expect(byLabel['minLength-1'].expectValid).toBe(false)
    expect((byLabel['minLength'].value as string).length).toBe(1)
    expect(byLabel['minLength'].expectValid).toBe(true)
    expect((byLabel['maxLength'].value as string).length).toBe(30)
    expect(byLabel['maxLength'].expectValid).toBe(true)
    expect((byLabel['maxLength+1'].value as string).length).toBe(31)
    expect(byLabel['maxLength+1'].expectValid).toBe(false)
  })

  it('enum → each valid + one invalid', () => {
    const c: FieldConstraint = { group: 'item', field: 'category', type: 'string', required: true, enumValues: ['food', 'drink', 'other'], example: 'food' }
    const cases = deriveBoundaryCases(c)
    const enumValidValues = cases.filter((x) => x.expectValid && x.label.startsWith('enum:')).map((x) => x.value).sort()
    expect(enumValidValues).toEqual(['drink', 'food', 'other'])
    expect(cases.some((x) => !x.expectValid)).toBe(true)
  })

  it('pattern → valid example + invalid', () => {
    const c: FieldConstraint = { group: 'item', field: 'code', type: 'string', required: true, pattern: '^[A-Z0-9]{8}$', example: 'ABCD1234' }
    const cases = deriveBoundaryCases(c)
    expect(cases.some((x) => x.value === 'ABCD1234' && x.expectValid)).toBe(true)
    expect(cases.some((x) => !x.expectValid)).toBe(true)
  })

  it('required → absent case is invalid', () => {
    const c: FieldConstraint = { group: 'login', field: 'username', type: 'string', required: true, minLength: 3, maxLength: 20, example: 'demo' }
    const cases = deriveBoundaryCases(c)
    expect(cases.some((x) => x.value === '__ABSENT__' && x.expectValid === false && x.label === 'required-absent')).toBe(true)
  })

  it('normal → example を有効ケースとして追加', () => {
    const c: FieldConstraint = { group: 'item', field: 'name', type: 'string', required: true, minLength: 1, maxLength: 30, example: 'Sample Item' }
    const cases = deriveBoundaryCases(c)
    expect(cases.some((x) => x.value === 'Sample Item' && x.expectValid && x.label === 'normal')).toBe(true)
  })

  it('normal → example が空ならスキップ', () => {
    const c: FieldConstraint = { group: 'x', field: 'f', type: 'string', required: false, example: '' }
    expect(deriveBoundaryCases(c).some((x) => x.label === 'normal')).toBe(false)
  })
})
