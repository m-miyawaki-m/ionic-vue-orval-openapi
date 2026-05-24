import type { FieldConstraint } from './types'

interface DiffRow {
  group: string
  field: string
  attr: string
  openapi: string
  csv: string
}

export function buildReconcileMarkdown(openapi: FieldConstraint[], csv: FieldConstraint[]): string {
  // Build lookup maps keyed by "group:field"
  const openapiMap = new Map<string, FieldConstraint>()
  for (const c of openapi) openapiMap.set(`${c.group}:${c.field}`, c)

  const csvMap = new Map<string, FieldConstraint>()
  for (const c of csv) csvMap.set(`${c.group}:${c.field}`, c)

  const diffs: DiffRow[] = []
  const onlyInOpenapi: { group: string; field: string }[] = []
  const onlyInCsv: { group: string; field: string }[] = []

  // Fields only in OpenAPI
  for (const [key, c] of openapiMap) {
    if (!csvMap.has(key)) {
      onlyInOpenapi.push({ group: c.group, field: c.field })
    }
  }

  // Fields only in CSV
  for (const [key, c] of csvMap) {
    if (!openapiMap.has(key)) {
      onlyInCsv.push({ group: c.group, field: c.field })
    }
  }

  // Compare attributes for fields present in both
  const attrs: Array<keyof Pick<FieldConstraint, 'minimum' | 'maximum' | 'minLength' | 'maxLength' | 'pattern' | 'required'>> =
    ['minimum', 'maximum', 'minLength', 'maxLength', 'pattern', 'required']

  for (const [key, oa] of openapiMap) {
    const cv = csvMap.get(key)
    if (!cv) continue

    const { group, field } = oa

    // Compare scalar attributes
    for (const attr of attrs) {
      const oaVal = String(oa[attr] ?? '')
      const cvVal = String(cv[attr] ?? '')
      if (oaVal !== cvVal) {
        diffs.push({ group, field, attr, openapi: oaVal, csv: cvVal })
      }
    }

    // Compare enumValues by join
    const oaEnum = (oa.enumValues ?? []).join('|')
    const cvEnum = (cv.enumValues ?? []).join('|')
    if (oaEnum !== cvEnum) {
      diffs.push({ group, field, attr: 'enumValues', openapi: oaEnum, csv: cvEnum })
    }
  }

  const timestamp = new Date().toISOString()
  const lines: string[] = []

  lines.push('# 整合性レポート (OpenAPI vs 画面項目定義)')
  lines.push('')
  lines.push(`生成日時: ${timestamp}`)
  lines.push('')

  if (diffs.length === 0 && onlyInOpenapi.length === 0 && onlyInCsv.length === 0) {
    lines.push('差異なし（OpenAPIと画面項目定義は整合）')
  } else {
    if (diffs.length > 0) {
      lines.push('## 差異一覧')
      lines.push('')
      lines.push('| group | field | 属性 | OpenAPI | 画面項目定義 |')
      lines.push('| --- | --- | --- | --- | --- |')
      for (const row of diffs) {
        lines.push(`| ${row.group} | ${row.field} | ${row.attr} | ${row.openapi} | ${row.csv} |`)
      }
      lines.push('')
    } else {
      lines.push('差異なし（OpenAPIと画面項目定義は整合）')
      lines.push('')
    }

    if (onlyInOpenapi.length > 0 || onlyInCsv.length > 0) {
      lines.push('## 片側のみに存在')
      lines.push('')
      if (onlyInOpenapi.length > 0) {
        lines.push('### OpenAPIのみ')
        lines.push('')
        for (const { group, field } of onlyInOpenapi) {
          lines.push(`- ${group}:${field}`)
        }
        lines.push('')
      }
      if (onlyInCsv.length > 0) {
        lines.push('### 画面項目定義のみ')
        lines.push('')
        for (const { group, field } of onlyInCsv) {
          lines.push(`- ${group}:${field}`)
        }
        lines.push('')
      }
    }
  }

  return lines.join('\n') + '\n'
}
