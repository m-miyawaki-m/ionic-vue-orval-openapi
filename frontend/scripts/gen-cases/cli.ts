import fs from 'node:fs'
import path from 'node:path'
import { loadOpenapiConstraints } from './openapi-adapter'
import { loadCsvConstraints } from './csv-adapter'
import { loadDocItems } from './docItems'
import { deriveBoundaryCases } from './boundary'
import { buildReconcileMarkdown } from './reconcile'
import type { CaseRecord, FieldConstraint } from './types'

function toRecords(constraints: FieldConstraint[], source: CaseRecord['source']): CaseRecord[] {
  const out: CaseRecord[] = []
  for (const c of constraints) {
    for (const b of deriveBoundaryCases(c)) {
      out.push({
        id: `bnd:${source}:${c.group}:${c.field}:${b.label}`,
        source, kind: 'boundary', group: c.group, field: c.field,
        value: b.value, expectValid: b.expectValid, label: b.label,
      })
    }
  }
  return out
}

const openapi = loadOpenapiConstraints()
const csv = loadCsvConstraints()
const boundary: CaseRecord[] = [...toRecords(openapi, 'openapi'), ...toRecords(csv, 'field-spec')]
const docItems = loadDocItems()

const casesDir = path.resolve(process.cwd(), 'tests/cases')
fs.mkdirSync(casesDir, { recursive: true })
fs.writeFileSync(path.join(casesDir, 'boundary.cases.json'), JSON.stringify(boundary, null, 2) + '\n')
fs.writeFileSync(path.join(casesDir, 'doc.cases.json'), JSON.stringify(docItems, null, 2) + '\n')

const reconcileDir = path.resolve(process.cwd(), '../docs/spec-src')
fs.mkdirSync(reconcileDir, { recursive: true })
fs.writeFileSync(path.join(reconcileDir, 'reconcile.md'), buildReconcileMarkdown(openapi, csv))

console.log(`Generated ${boundary.length} boundary cases, ${docItems.length} doc items.`)
