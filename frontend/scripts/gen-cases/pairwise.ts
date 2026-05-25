import type { CombinationCase, FieldConstraint } from './types'

// 各パラメータの値数(counts)を受け取り、全2-wiseペアを被覆する index タプル集合を返す（貪欲法）
export function allPairs(counts: number[]): number[][] {
  const n = counts.length
  if (n === 0) return []
  if (n === 1) return Array.from({ length: counts[0] }, (_, a) => [a])

  const need = new Set<string>()
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++)
      for (let a = 0; a < counts[i]; a++)
        for (let b = 0; b < counts[j]; b++) need.add(`${i},${j},${a},${b}`)

  const rows: number[][] = []
  let guard = 0
  while (need.size > 0 && guard++ < 10000) {
    const row = new Array(n).fill(-1)
    for (let i = 0; i < n; i++) {
      let bestVal = 0
      let bestCover = -1
      for (let a = 0; a < counts[i]; a++) {
        let cover = 0
        // Count pairs with already-assigned columns
        for (let j = 0; j < n; j++) {
          if (j === i || row[j] === -1) continue
          const key = i < j ? `${i},${j},${a},${row[j]}` : `${j},${i},${row[j]},${a}`
          if (need.has(key)) cover++
        }
        // Look ahead: count unassigned columns that still have uncovered pairs with (i,a)
        for (let j = i + 1; j < n; j++) {
          if (row[j] !== -1) continue
          for (let b = 0; b < counts[j]; b++) {
            if (need.has(`${i},${j},${a},${b}`)) { cover++; break }
          }
        }
        if (cover > bestCover) { bestCover = cover; bestVal = a }
      }
      row[i] = bestVal
    }
    for (let i = 0; i < n; i++)
      for (let j = i + 1; j < n; j++) need.delete(`${i},${j},${row[i]},${row[j]}`)
    rows.push(row)
  }
  return rows
}

function invalidValue(c: FieldConstraint): unknown {
  if (c.enumValues) return '__invalid_enum__'
  if (c.pattern) return '!!'
  if (c.type === 'integer' || c.type === 'number')
    return c.minimum !== undefined ? c.minimum - 1 : c.maximum !== undefined ? c.maximum + 1 : -1
  if (c.maxLength !== undefined) return 'a'.repeat(c.maxLength + 1)
  if (c.minLength !== undefined && c.minLength > 0) return 'a'.repeat(c.minLength - 1)
  return ''
}

export function derivePairwise(constraints: FieldConstraint[], group: string): CombinationCase[] {
  const fields = constraints.filter((c) => c.group === group)
  if (fields.length === 0) return []
  // index 0 = valid(example), index 1 = invalid
  const values = fields.map((c) => [c.example as unknown, invalidValue(c)])
  const rows = allPairs(fields.map(() => 2))

  return rows.map((row, n) => {
    const payload: Record<string, unknown> = {}
    let firstInvalid = ''
    fields.forEach((c, i) => {
      payload[c.field] = values[i][row[i]]
      if (row[i] === 1 && firstInvalid === '') firstInvalid = c.field
    })
    const expectValid = firstInvalid === ''
    return {
      id: `cmb:${group}:${String(n + 1).padStart(3, '0')}`,
      group,
      kind: 'combination',
      payload,
      expectValid,
      label: expectValid ? 'all-valid' : `invalid:${firstInvalid}`,
    }
  })
}
