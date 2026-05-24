import fs from 'node:fs'
import path from 'node:path'
import type { DocItem } from './types'

function parseCsv(content: string): Record<string, string>[] {
  // Normalize CRLF/CR to LF, then split
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

function readCsvDir(dirPath: string): Array<{ file: string; rows: Record<string, string>[] }> {
  if (!fs.existsSync(dirPath)) return []
  const files = fs.readdirSync(dirPath).filter((f) => f.endsWith('.csv'))
  return files.map((file) => {
    const content = fs.readFileSync(path.join(dirPath, file), 'utf-8')
    return { file, rows: parseCsv(content) }
  })
}

export function loadDocItems(): DocItem[] {
  const baseDir = path.resolve(process.cwd(), '../docs/spec-src')
  const result: DocItem[] = []

  // event-spec: columns screen,event,trigger,handler,expected,note
  const eventFiles = readCsvDir(path.join(baseDir, 'event-spec'))
  for (const { rows } of eventFiles) {
    rows.forEach((row, i) => {
      const item: DocItem = {
        id: `event-spec:${row['screen']}:${i}`,
        source: 'event-spec',
        kind: 'operation',
        group: row['screen'],
        description: row['event'],
        precondition: '',
        action: `${row['trigger']} → ${row['handler']}`,
        expected: row['expected'],
      }
      result.push(item)
    })
  }

  // store-spec: columns store,action,from,to,note
  const storeFiles = readCsvDir(path.join(baseDir, 'store-spec'))
  for (const { rows } of storeFiles) {
    rows.forEach((row, i) => {
      const item: DocItem = {
        id: `store-spec:${row['store']}:${i}`,
        source: 'store-spec',
        kind: 'state',
        group: row['store'],
        description: row['action'],
        precondition: row['from'],
        action: row['action'],
        expected: row['to'],
      }
      result.push(item)
    })
  }

  return result
}
