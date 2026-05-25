# gen-cases 生成エンジン強化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans。各タスクは failing test → 実装 → green → commit。Steps use `- [ ]`.

**Goal:** `frontend/scripts/gen-cases` に 正常系代表値・format検証フック・pairwise組み合わせ・API異常系(doc) を追加する。

**Architecture:** 既存の OpenAPI/CSV アダプタと境界値deriverを保ちつつ、最小のモデル拡張＋関心ごとの新モジュール（pairwise/format/operations/apiError）を足す。生成は決定論的(TS)。Pythonは関与しない。

**Tech Stack:** TypeScript（tsx 実行）/ Vitest / zod / js-yaml。spec: `docs/superpowers/specs/2026-05-26-gen-cases-enhancements-design.md`。

**前提（確認済みの既存構造）:**
- `scripts/gen-cases/types.ts`: `FieldConstraint`, `BoundaryCase`, `ABSENT='__ABSENT__'`, `CaseRecord{id,source,kind:'boundary',group,field,value,expectValid,label}`, `DocItem{id,source:'event-spec'|'store-spec',kind:'operation'|'state',group,description,precondition,action,expected}`。
- `boundary.ts`: `deriveBoundaryCases(c: FieldConstraint): BoundaryCase[]`（min/max, length, enum, pattern, required）。
- `openapi-adapter.ts`: `loadOpenapiConstraints()` が `components.schemas`（ItemInput→item, LoginRequest→login）から `FieldConstraint[]`。`OaProperty` に各制約。
- `cli.ts`: `toRecords()` で boundary を `CaseRecord` 化し `boundary.cases.json`、`loadDocItems()`→`doc.cases.json`、`buildReconcileMarkdown`→`reconcile.md`。`console.log` でカウント。
- テスト: `tests/unit/genBoundary.unit.spec.ts`（deriver単体）、`tests/cases/boundary.spec.ts`（データ駆動: `registry[group]={schema,base}` に対し1項目override→`safeParse().success===expectValid`）。`tests/cases/registry.ts`: item→itemInputSchema/base, login→loginSchema/base。
- 実行: `npm run gen:cases`（=`tsx scripts/gen-cases/cli.ts`、cwd=frontend）、`npm run test:unit`。

---

## ファイル構成（作成・変更）

```
frontend/scripts/gen-cases/
  types.ts            # 変更: FieldConstraint.format, CombinationCase, DocItem(kind/source拡張)
  boundary.ts         # 変更: normal(example) + format 派生を追加
  format.ts           # 新規: FORMAT_MAP (format→valid/invalid)
  pairwise.ts         # 新規: allPairs() + derivePairwise()
  openapi-adapter.ts  # 変更: prop.format を FieldConstraint に渡す
  operations.ts       # 新規: openapi paths → ApiOperation[]
  apiError.ts         # 新規: deriveApiErrors(ops) → DocItem[](kind=api-error)
  cli.ts              # 変更: combination/api-error 組み立て + combination.cases.json 出力
frontend/tests/
  unit/genBoundary.unit.spec.ts  # 変更: normal/format 検証追加
  unit/genPairwise.unit.spec.ts  # 新規
  unit/genApiError.unit.spec.ts  # 新規
  cases/combination.spec.ts      # 新規（データ駆動）
  cases/combination.cases.json   # 生成物（Task6で生成・コミット）
```

---

## Task 1: types.ts モデル拡張

**Files:** Modify `frontend/scripts/gen-cases/types.ts`

- [ ] **Step 1: 型を追加・拡張**

`FieldConstraint` に `format?: string` を追加（`pattern?` の次の行）:
```ts
  pattern?: string
  format?: string        // OpenAPI format（email/date 等）。任意
  example: string | number
```

ファイル末尾に追加:
```ts
export interface CombinationCase {
  id: string                        // 'cmb:<group>:<nnn>'
  group: string
  kind: 'combination'
  payload: Record<string, unknown>  // 全項目のフルレコード
  expectValid: boolean              // 全項目が有効なときのみ true
  label: string                     // 'all-valid' | 'invalid:<field>'
}
```

`DocItem` の `source`/`kind` を拡張:
```ts
export interface DocItem {
  id: string
  source: 'event-spec' | 'store-spec' | 'openapi-op'
  kind: 'operation' | 'state' | 'api-error'
  group: string
  description: string
  precondition: string
  action: string
  expected: string
}
```

- [ ] **Step 2: 既存テストが緑（コンパイル確認）**

Run: `cd frontend && npm run test:unit`
Expected: 既存どおり全緑（79 passed）。型追加で既存importが壊れていないこと。

- [ ] **Step 3: commit**
```bash
git add frontend/scripts/gen-cases/types.ts
git commit -m "feat(gen-cases): extend types (format, CombinationCase, DocItem api-error)"
```

---

## Task 2: 正常系代表値（normal）

**Files:** Modify `frontend/scripts/gen-cases/boundary.ts`, `frontend/tests/unit/genBoundary.unit.spec.ts`

- [ ] **Step 1: 失敗するテストを追加**

`tests/unit/genBoundary.unit.spec.ts` の `describe` 内に追加:
```ts
  it('normal → example を有効ケースとして追加', () => {
    const c: FieldConstraint = { group: 'item', field: 'name', type: 'string', required: true, minLength: 1, maxLength: 30, example: 'Sample Item' }
    const cases = deriveBoundaryCases(c)
    expect(cases.some((x) => x.value === 'Sample Item' && x.expectValid && x.label === 'normal')).toBe(true)
  })

  it('normal → example が空ならスキップ', () => {
    const c: FieldConstraint = { group: 'x', field: 'f', type: 'string', required: false, example: '' }
    expect(deriveBoundaryCases(c).some((x) => x.label === 'normal')).toBe(false)
  })
```

- [ ] **Step 2: 失敗確認**

Run: `cd frontend && npx vitest run tests/unit/genBoundary.unit.spec.ts`
Expected: 新規2件が FAIL（normal ケースがまだ無い）。

- [ ] **Step 3: 実装**

`boundary.ts` の `deriveBoundaryCases` 冒頭（`const cases: BoundaryCase[] = []` の直後）に追加:
```ts
  if (c.example !== undefined && c.example !== '') {
    cases.push({ value: c.example, expectValid: true, label: 'normal' })
  }
```

- [ ] **Step 4: 緑確認**

Run: `cd frontend && npx vitest run tests/unit/genBoundary.unit.spec.ts`
Expected: PASS（既存＋新規）。

- [ ] **Step 5: commit**
```bash
git add frontend/scripts/gen-cases/boundary.ts frontend/tests/unit/genBoundary.unit.spec.ts
git commit -m "feat(gen-cases): normal representative case from example"
```

---

## Task 3: format検証フック

**Files:** Create `frontend/scripts/gen-cases/format.ts`; Modify `boundary.ts`, `openapi-adapter.ts`, `tests/unit/genBoundary.unit.spec.ts`

- [ ] **Step 1: 失敗するテストを追加**

`tests/unit/genBoundary.unit.spec.ts` に追加:
```ts
  it('format → format付き文字列に valid/invalid を生成', () => {
    const c: FieldConstraint = { group: 'user', field: 'email', type: 'string', required: true, format: 'email', example: 'a@example.com' }
    const cases = deriveBoundaryCases(c)
    expect(cases.some((x) => x.label === 'format:email:valid' && x.expectValid)).toBe(true)
    expect(cases.some((x) => x.label === 'format:email:invalid' && !x.expectValid)).toBe(true)
  })

  it('format → format無しなら format ケースは出ない', () => {
    const c: FieldConstraint = { group: 'item', field: 'name', type: 'string', required: true, minLength: 1, maxLength: 30, example: 'X' }
    expect(deriveBoundaryCases(c).some((x) => x.label.startsWith('format:'))).toBe(false)
  })
```

- [ ] **Step 2: 失敗確認**

Run: `cd frontend && npx vitest run tests/unit/genBoundary.unit.spec.ts`
Expected: 新規2件 FAIL。

- [ ] **Step 3: format.ts を作成**

`frontend/scripts/gen-cases/format.ts`:
```ts
export interface FormatPair { valid: string; invalid: string }

export const FORMAT_MAP: Record<string, FormatPair> = {
  email: { valid: 'user@example.com', invalid: 'not-an-email' },
  date: { valid: '2026-05-26', invalid: '2026-13-99' },
  'date-time': { valid: '2026-05-26T00:00:00Z', invalid: 'notadatetime' },
  uuid: { valid: '123e4567-e89b-12d3-a456-426614174000', invalid: 'xxxx' },
}
```

- [ ] **Step 4: boundary.ts に format 派生を追加**

`boundary.ts` 先頭の import に追加:
```ts
import { FORMAT_MAP } from './format'
```
`if (c.type === 'string') { ... }` ブロック内、`if (c.pattern) {...}` の後に追加:
```ts
    if (c.format && FORMAT_MAP[c.format]) {
      const fp = FORMAT_MAP[c.format]
      cases.push({ value: fp.valid, expectValid: true, label: `format:${c.format}:valid` })
      cases.push({ value: fp.invalid, expectValid: false, label: `format:${c.format}:invalid` })
    }
```

- [ ] **Step 5: openapi-adapter.ts が format を読む**

`openapi-adapter.ts` の `OaProperty` に追加:
```ts
  pattern?: string
  format?: string
  example?: string | number
```
`constraint` 生成に追加（`pattern: prop.pattern,` の次）:
```ts
        pattern: prop.pattern,
        format: prop.format,
        example: prop.example ?? '',
```

- [ ] **Step 6: 緑確認**

Run: `cd frontend && npx vitest run tests/unit/genBoundary.unit.spec.ts`
Expected: PASS。

- [ ] **Step 7: commit**
```bash
git add frontend/scripts/gen-cases/format.ts frontend/scripts/gen-cases/boundary.ts frontend/scripts/gen-cases/openapi-adapter.ts frontend/tests/unit/genBoundary.unit.spec.ts
git commit -m "feat(gen-cases): format validation hook (FORMAT_MAP); openapi-adapter reads format"
```

---

## Task 4: pairwise（組み合わせ）

**Files:** Create `frontend/scripts/gen-cases/pairwise.ts`, `frontend/tests/unit/genPairwise.unit.spec.ts`

- [ ] **Step 1: 失敗するテストを作成**

`frontend/tests/unit/genPairwise.unit.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { allPairs, derivePairwise } from '../../scripts/gen-cases/pairwise'
import type { FieldConstraint } from '../../scripts/gen-cases/types'

const item: FieldConstraint[] = [
  { group: 'item', field: 'name', type: 'string', required: true, minLength: 1, maxLength: 30, example: 'Sample Item' },
  { group: 'item', field: 'price', type: 'integer', required: true, minimum: 0, maximum: 1000000, example: 1200 },
  { group: 'item', field: 'category', type: 'string', required: true, enumValues: ['food', 'drink', 'other'], example: 'food' },
  { group: 'item', field: 'code', type: 'string', required: true, pattern: '^[A-Z0-9]{8}$', example: 'ABCD1234' },
]

describe('allPairs', () => {
  it('4つの2値パラメータの全ペアを被覆する', () => {
    const rows = allPairs([2, 2, 2, 2])
    for (let i = 0; i < 4; i++)
      for (let j = i + 1; j < 4; j++)
        for (const a of [0, 1])
          for (const b of [0, 1])
            expect(rows.some((r) => r[i] === a && r[j] === b)).toBe(true)
  })
})

describe('derivePairwise', () => {
  it('expectValid は全項目が有効値のときのみ true', () => {
    const cases = derivePairwise(item, 'item')
    expect(cases.length).toBeGreaterThan(0)
    for (const c of cases) {
      const anyInvalid = item.some((fc) => c.payload[fc.field] !== fc.example)
      expect(c.expectValid).toBe(!anyInvalid)
    }
    expect(cases.some((c) => c.expectValid)).toBe(true)
    expect(cases.some((c) => !c.expectValid)).toBe(true)
    expect(cases.every((c) => c.kind === 'combination')).toBe(true)
  })

  it('payload は全項目を含む', () => {
    const cases = derivePairwise(item, 'item')
    for (const c of cases) {
      expect(Object.keys(c.payload).sort()).toEqual(['category', 'code', 'name', 'price'])
    }
  })
})
```

- [ ] **Step 2: 失敗確認**

Run: `cd frontend && npx vitest run tests/unit/genPairwise.unit.spec.ts`
Expected: FAIL（モジュール未作成）。

- [ ] **Step 3: pairwise.ts を作成**

`frontend/scripts/gen-cases/pairwise.ts`:
```ts
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
        for (let j = 0; j < n; j++) {
          if (j === i || row[j] === -1) continue
          const key = i < j ? `${i},${j},${a},${row[j]}` : `${j},${i},${row[j]},${a}`
          if (need.has(key)) cover++
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
```

- [ ] **Step 4: 緑確認**

Run: `cd frontend && npx vitest run tests/unit/genPairwise.unit.spec.ts`
Expected: PASS。

- [ ] **Step 5: commit**
```bash
git add frontend/scripts/gen-cases/pairwise.ts frontend/tests/unit/genPairwise.unit.spec.ts
git commit -m "feat(gen-cases): pairwise (all-pairs) combination generation"
```

---

## Task 5: API異常系（operations + apiError, doc項目）

**Files:** Create `frontend/scripts/gen-cases/operations.ts`, `frontend/scripts/gen-cases/apiError.ts`, `frontend/tests/unit/genApiError.unit.spec.ts`

- [ ] **Step 1: 失敗するテストを作成**

`frontend/tests/unit/genApiError.unit.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { deriveApiErrors, type ApiOperation } from '../../scripts/gen-cases/apiError'

const ops: ApiOperation[] = [
  { operationId: 'login', method: 'post', path: '/auth/login', tag: 'auth', hasBody: true, hasIdParam: false },
  { operationId: 'listItems', method: 'get', path: '/items', tag: 'items', hasBody: false, hasIdParam: false },
  { operationId: 'createItem', method: 'post', path: '/items', tag: 'items', hasBody: true, hasIdParam: false },
  { operationId: 'getItem', method: 'get', path: '/items/{id}', tag: 'items', hasBody: false, hasIdParam: true },
  { operationId: 'updateItem', method: 'put', path: '/items/{id}', tag: 'items', hasBody: true, hasIdParam: true },
  { operationId: 'deleteItem', method: 'delete', path: '/items/{id}', tag: 'items', hasBody: false, hasIdParam: true },
]

describe('deriveApiErrors', () => {
  const items = deriveApiErrors(ops)

  it('全て kind=api-error / source=openapi-op', () => {
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((i) => i.kind === 'api-error' && i.source === 'openapi-op')).toBe(true)
  })

  it('保護op(items系)に401、login(auth)には401を出さない', () => {
    expect(items.some((i) => i.id === 'api:listItems:401')).toBe(true)
    expect(items.some((i) => i.id === 'api:login:401')).toBe(false)
  })

  it('{id}op に404', () => {
    expect(items.some((i) => i.id === 'api:getItem:404')).toBe(true)
    expect(items.some((i) => i.id === 'api:listItems:404')).toBe(false)
  })

  it('body付きitems op(create/update)に422、getItemには出さない', () => {
    expect(items.some((i) => i.id === 'api:createItem:422')).toBe(true)
    expect(items.some((i) => i.id === 'api:getItem:422')).toBe(false)
  })
})
```

- [ ] **Step 2: 失敗確認**

Run: `cd frontend && npx vitest run tests/unit/genApiError.unit.spec.ts`
Expected: FAIL（モジュール未作成）。

- [ ] **Step 3: apiError.ts を作成（純関数）**

`frontend/scripts/gen-cases/apiError.ts`:
```ts
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
```

- [ ] **Step 4: 緑確認（apiError）**

Run: `cd frontend && npx vitest run tests/unit/genApiError.unit.spec.ts`
Expected: PASS。

- [ ] **Step 5: operations.ts を作成（OpenAPI paths 読み込み）**

`frontend/scripts/gen-cases/operations.ts`:
```ts
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
```

- [ ] **Step 6: commit**
```bash
git add frontend/scripts/gen-cases/apiError.ts frontend/scripts/gen-cases/operations.ts frontend/tests/unit/genApiError.unit.spec.ts
git commit -m "feat(gen-cases): api-error doc items (401/404/422) from openapi operations"
```

---

## Task 6: cli.ts 組み立て ＋ combination.cases.json ＋ データ駆動テスト

**Files:** Modify `frontend/scripts/gen-cases/cli.ts`; Create `frontend/tests/cases/combination.spec.ts`, `frontend/tests/cases/combination.cases.json`(生成)

- [ ] **Step 1: cli.ts に combination/api-error を組み込む**

`cli.ts` の import 群に追加:
```ts
import { derivePairwise } from './pairwise'
import { loadOperations } from './operations'
import { deriveApiErrors } from './apiError'
import type { CaseRecord, CombinationCase, FieldConstraint } from './types'
```
（既存 `import type { CaseRecord, FieldConstraint } from './types'` は上の行に統合し重複させない）

`const docItems = loadDocItems()` を次に変更:
```ts
const docItems = [...loadDocItems(), ...deriveApiErrors(loadOperations())]
```

`const boundary = ...` の後に combination を生成:
```ts
const groups = [...new Set(openapi.map((c: FieldConstraint) => c.group))]
const combination: CombinationCase[] = groups.flatMap((g) => derivePairwise(openapi, g))
```

`boundary.cases.json` 書き出しの直後に追加:
```ts
fs.writeFileSync(path.join(casesDir, 'combination.cases.json'), JSON.stringify(combination, null, 2) + '\n')
```

`console.log` を更新:
```ts
console.log(`Generated ${boundary.length} boundary, ${combination.length} combination cases, ${docItems.length} doc items.`)
```

- [ ] **Step 2: 生成実行**

Run: `cd frontend && npm run gen:cases`
Expected: `Generated <N> boundary, <M> combination cases, <K> doc items.` と表示。`tests/cases/combination.cases.json` が作られ、`boundary.cases.json` に `normal` ラベルが含まれ、`doc.cases.json` に `api:` プレフィクスの項目が含まれる。

確認:
```bash
node -e "const c=require('./tests/cases/combination.cases.json'); console.log('combination', c.length, c[0]); const b=require('./tests/cases/boundary.cases.json'); console.log('normal?', b.some(x=>x.label==='normal')); const d=require('./tests/cases/doc.cases.json'); console.log('api-error?', d.some(x=>x.kind==='api-error'))"
```
Expected: combination が1件以上、`normal? true`、`api-error? true`。

- [ ] **Step 3: combination データ駆動テストを作成**

`frontend/tests/cases/combination.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import cases from './combination.cases.json'
import { registry } from './registry'

type Rec = { id: string; group: string; kind: string; payload: Record<string, unknown>; expectValid: boolean; label: string }
const records = cases as Rec[]

describe('generated combination (pairwise) cases validate against full schema', () => {
  it('has combination records', () => {
    expect(records.length).toBeGreaterThan(0)
    expect(records.every((r) => r.kind === 'combination')).toBe(true)
  })

  for (const r of records) {
    const entry = registry[r.group]
    if (!entry) continue
    it(`${r.id}`, () => {
      expect(entry.schema.safeParse(r.payload).success).toBe(r.expectValid)
    })
  }
})
```

- [ ] **Step 4: 全ユニット緑確認**

Run: `cd frontend && npm run test:unit`
Expected: 全緑。`combination.spec.ts` の各レコードで `safeParse(payload).success === expectValid`、`boundary.spec.ts` に増えた `normal` ケースも緑、既存も緑。

- [ ] **Step 5: commit**
```bash
git add frontend/scripts/gen-cases/cli.ts frontend/tests/cases/combination.spec.ts frontend/tests/cases/combination.cases.json frontend/tests/cases/boundary.cases.json frontend/tests/cases/doc.cases.json docs/spec-src/reconcile.md
git commit -m "feat(gen-cases): wire combination + api-error in cli; combination.cases.json + data-driven test"
```

---

## Task 7: 全体検証（回帰なし）

**Files:** （検証のみ）

- [ ] **Step 1: 生成と全テスト**

Run:
```bash
cd frontend
npm run gen:cases     # 再生成（冪等）
npm run test:unit     # Expected: 全緑（境界値+normal+combination+既存ユニット）
```

- [ ] **Step 2: spec 成功基準 §6 を照合**

`docs/superpowers/specs/2026-05-26-gen-cases-enhancements-design.md` §6 の6項目を確認:
1. gen:cases が boundary(+normal)/combination/doc(+api-error) を出力 ✔
2. 各group(item/login)に正常系代表値（normal）✔
3. combination が all-pairs ＋ `combination.spec.ts` 緑 ✔
4. api-error が 401/404/422 で doc.cases.json に ✔
5. format フック実装済み（現スキーマ0件でOK）✔
6. 既存 test:unit 緑（回帰なし）✔

未達があれば該当Taskへ戻る。

- [ ] **Step 3: 仕上げ commit（あれば）**
```bash
git add -A
git commit -m "test(gen-cases): regenerate cases; full verification green"
```

---

## 完了確認（Done）
- [ ] `npm run gen:cases` が boundary(+normal)/combination/doc(+api-error) を生成
- [ ] `npm run test:unit` 全緑（genBoundary/genPairwise/genApiError 単体 ＋ boundary/combination データ駆動 ＋ 既存）
- [ ] combination が zod 完全スキーマで `success===expectValid`
- [ ] api-error 401/404/422 が doc.cases.json に（実行なし）
- [ ] format フックあり（現スキーマ生成0件で問題なし）

## 次: サイクル B（単体テスト項目書ジェネレータ）— 別 spec/plan。
