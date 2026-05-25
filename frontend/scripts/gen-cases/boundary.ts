import { ABSENT, BoundaryCase, FieldConstraint } from './types'
import { FORMAT_MAP } from './format'

export function deriveBoundaryCases(c: FieldConstraint): BoundaryCase[] {
  const cases: BoundaryCase[] = []

  if (c.example !== undefined && c.example !== '') {
    let exampleValue: unknown = c.example
    if ((c.type === 'integer' || c.type === 'number') && typeof c.example === 'string') {
      const n = Number(c.example)
      if (!isNaN(n)) exampleValue = n
    }
    cases.push({ value: exampleValue, expectValid: true, label: 'normal' })
  }

  if (c.type === 'integer' || c.type === 'number') {
    if (c.minimum !== undefined) {
      cases.push({ value: c.minimum - 1, expectValid: false, label: 'minimum-1' })
      cases.push({ value: c.minimum, expectValid: true, label: 'minimum' })
    }
    if (c.maximum !== undefined) {
      cases.push({ value: c.maximum, expectValid: true, label: 'maximum' })
      cases.push({ value: c.maximum + 1, expectValid: false, label: 'maximum+1' })
    }
  }

  if (c.type === 'string') {
    const ch = 'a'
    if (c.minLength !== undefined) {
      cases.push({ value: ch.repeat(Math.max(0, c.minLength - 1)), expectValid: false, label: 'minLength-1' })
      cases.push({ value: ch.repeat(c.minLength), expectValid: true, label: 'minLength' })
    }
    if (c.maxLength !== undefined) {
      cases.push({ value: ch.repeat(c.maxLength), expectValid: true, label: 'maxLength' })
      cases.push({ value: ch.repeat(c.maxLength + 1), expectValid: false, label: 'maxLength+1' })
    }
    if (c.enumValues) {
      for (const v of c.enumValues) cases.push({ value: v, expectValid: true, label: `enum:${v}` })
      cases.push({ value: '__invalid_enum__', expectValid: false, label: 'enum:invalid' })
    }
    if (c.pattern) {
      cases.push({ value: String(c.example), expectValid: true, label: 'pattern:valid' })
      cases.push({ value: '!!', expectValid: false, label: 'pattern:invalid' })
    }
    if (c.format && FORMAT_MAP[c.format]) {
      const fp = FORMAT_MAP[c.format]
      cases.push({ value: fp.valid, expectValid: true, label: `format:${c.format}:valid` })
      cases.push({ value: fp.invalid, expectValid: false, label: `format:${c.format}:invalid` })
    }
  }

  if (c.required) {
    cases.push({ value: ABSENT, expectValid: false, label: 'required-absent' })
  }

  return cases
}
