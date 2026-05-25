import fs from 'node:fs'
import path from 'node:path'
import { loadOpenapiConstraints } from './openapi-adapter'
import { loadCsvConstraints } from './csv-adapter'
import { loadDocItems } from './docItems'
import { deriveBoundaryCases } from './boundary'
import { buildReconcileMarkdown } from './reconcile'
import type { CaseRecord, CombinationCase, FieldConstraint } from './types'
import { derivePairwise } from './pairwise'
import { loadOperations } from './operations'
import { deriveApiErrors } from './apiError'

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
const groups = [...new Set(openapi.map((c: FieldConstraint) => c.group))]
const combination: CombinationCase[] = groups.flatMap((g) => derivePairwise(openapi, g))
const docItems = [...loadDocItems(), ...deriveApiErrors(loadOperations())]

const casesDir = path.resolve(process.cwd(), 'tests/cases')
fs.mkdirSync(casesDir, { recursive: true })
fs.writeFileSync(path.join(casesDir, 'boundary.cases.json'), JSON.stringify(boundary, null, 2) + '\n')
fs.writeFileSync(path.join(casesDir, 'combination.cases.json'), JSON.stringify(combination, null, 2) + '\n')
fs.writeFileSync(path.join(casesDir, 'doc.cases.json'), JSON.stringify(docItems, null, 2) + '\n')

const reconcileDir = path.resolve(process.cwd(), '../docs/spec-src')
fs.mkdirSync(reconcileDir, { recursive: true })
fs.writeFileSync(path.join(reconcileDir, 'reconcile.md'), buildReconcileMarkdown(openapi, csv))

console.log(`Generated ${boundary.length} boundary, ${combination.length} combination cases, ${docItems.length} doc items.`)
