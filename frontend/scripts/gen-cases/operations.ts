import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import type { ApiOperation } from './apiError'

interface OaOp {
  operationId?: string
  tags?: string[]
  requestBody?: unknown
  parameters?: Array<{ in?: string; name?: string }>
}
interface OaPaths { paths?: Record<string, Record<string, OaOp>> }

const METHODS = ['get', 'post', 'put', 'delete', 'patch']

export function loadOperations(): ApiOperation[] {
  const yamlPath = path.resolve(process.cwd(), '../openapi/openapi.yaml')
  const doc = yaml.load(fs.readFileSync(yamlPath, 'utf-8')) as OaPaths
  const paths = doc?.paths ?? {}
  const ops: ApiOperation[] = []
  for (const [p, methods] of Object.entries(paths)) {
    for (const m of METHODS) {
      const op = methods[m]
      if (!op || !op.operationId) continue
      const hasIdParam = p.includes('{') || (op.parameters ?? []).some((pp) => pp.in === 'path')
      ops.push({
        operationId: op.operationId,
        method: m,
        path: p,
        tag: (op.tags ?? [])[0] ?? '',
        hasBody: op.requestBody !== undefined,
        hasIdParam,
      })
    }
  }
  return ops
}
