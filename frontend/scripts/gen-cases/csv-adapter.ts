import fs from 'node:fs'
import path from 'node:path'
import type { FieldConstraint, FieldType } from './types'

function parseCsv(content: string): Record<string, string>[] {
  // Normalize line endings and split lines
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const nonEmpty = lines.filter((l) => l.trim() !== '')
  if (nonEmpty.length < 2) return []

  const headers = nonEmpty[0].split(',').map((h) => h.trim())
  const rows: Record<string, string>[] = []

  for (let i = 1; i < nonEmpty.length; i++) {
    const cells = nonEmpty[i].split(',').map((c) => c.trim())
    const row: Record<string, string> = {}
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = cells[j] ?? ''
    }
    rows.push(row)
  }

  return rows
}

function toNum(val: string | undefined): number | undefined {
  if (val === undefined || val === '') return undefined
  const n = Number(val)
  return isNaN(n) ? undefined : n
}

function toStr(val: string | undefined): string | undefined {
  if (val === undefined || val === '') return undefined
  return val
}

export function loadCsvConstraints(): FieldConstraint[] {
  const fieldSpecDir = path.resolve(process.cwd(), '../docs/spec-src/field-spec')
  const files = fs.readdirSync(fieldSpecDir).filter((f) => f.endsWith('.csv'))
  const result: FieldConstraint[] = []

  for (const file of files) {
    const content = fs.readFileSync(path.join(fieldSpecDir, file), 'utf-8')
    const rows = parseCsv(content)

    for (const row of rows) {
      const enumRaw = toStr(row['enum'])
      const constraint: FieldConstraint = {
        group: row['group'],
        field: row['field'],
        type: (row['type'] ?? 'string') as FieldType,
        required: row['required'] === 'true',
        minimum: toNum(row['minimum']),
        maximum: toNum(row['maximum']),
        minLength: toNum(row['minLength']),
        maxLength: toNum(row['maxLength']),
        enumValues: enumRaw ? enumRaw.split('|') : undefined,
        pattern: toStr(row['pattern']),
        example: toStr(row['example']) ?? '',
      }
      result.push(constraint)
    }
  }

  return result
}
