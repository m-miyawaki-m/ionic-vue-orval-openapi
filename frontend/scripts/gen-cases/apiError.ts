import type { DocItem } from './types'

export interface ApiOperation {
  operationId: string
  method: string
  path: string
  tag: string
  hasBody: boolean
  hasIdParam: boolean
}

const TAG_GROUP: Record<string, string> = { auth: 'login', items: 'item' }

function mk(op: ApiOperation, status: string, description: string, precondition: string, expected: string): DocItem {
  return {
    id: `api:${op.operationId}:${status}`,
    source: 'openapi-op',
    kind: 'api-error',
    group: TAG_GROUP[op.tag] ?? op.tag,
    description,
    precondition,
    action: `${op.method.toUpperCase()} ${op.path}`,
    expected: `${status} ${expected}`,
  }
}

export function deriveApiErrors(ops: ApiOperation[]): DocItem[] {
  const out: DocItem[] = []
  for (const op of ops) {
    const isProtected = op.tag !== 'auth'
    if (isProtected) {
      out.push(mk(op, '401', `${op.operationId}: 未認証アクセス`, '未ログイン（トークン無し）', 'Unauthorized'))
    }
    if (op.hasIdParam) {
      out.push(mk(op, '404', `${op.operationId}: 不明なIDを指定`, '存在しない id', 'Not Found'))
    }
    if (op.hasBody && op.tag === 'items') {
      out.push(mk(op, '422', `${op.operationId}: 不正なリクエストボディ`, 'バリデーション違反のbody', 'Unprocessable Entity'))
    }
  }
  return out
}
