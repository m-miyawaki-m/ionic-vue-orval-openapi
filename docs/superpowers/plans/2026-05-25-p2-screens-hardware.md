# P2 画面＋ハードウェア抽象 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** P1の基盤の上に、ログイン/Items詳細/Items登録編集フォーム/検索/スキャンOCR の各画面と、外付けスキャナー・カメラOCRの抽象（`useScanner`/`useOcr`＋フェイクアダプタ）、画面項目バリデータ(zod)、認証ストア(Pinia)を実装する。

**Architecture:** Piniaで認証状態を保持。画面フォームは手書きzodバリデータ（画面項目定義に対応）で検証。ハードウェア機能は `ScannerAdapter`/`OcrAdapter` インターフェースで抽象化し、本体はインターフェースのみに依存。dev/テストではフェイクアダプタを注入（実機実装は未定でも進められる）。全データはMSWの決定的フィクスチャ。

**Tech Stack:** Vue 3 / Ionic Vue 8 / Pinia / zod / vue-router / Vitest / Playwright / MSW（既存）

前提知識（P1で確定）:
- 生成API: `import { listItems, getItem, createItem, updateItem, deleteItem, searchItems } from '../api/items/items'`、`import { login } from '../api/auth/auth'`。`Item`/`ItemInput` は `../api/models` バレル。
- axios mutator は `baseURL: '/api'`。MSWハンドラは `src/mocks/handlers.ts`（`/api/*`）。
- Vitestは `--environment jsdom`（vitest.config.ts済）。Ionic Web Componentsはjsdomで未定義なので、**ロジック(composable/store/validator)はユニットテスト、画面はPlaywright(L4/E2E)で検証**する方針。

---

## ファイル構成（P2で作成/変更）

```
frontend/src/
  stores/auth.ts                 # Pinia: token, isAuthenticated, login(), logout()
  validators/auth.ts             # zod loginSchema（画面項目）
  validators/item.ts             # zod itemInputSchema（画面項目）
  composables/useItem.ts         # 単一Item取得・保存・削除
  composables/useSearch.ts       # 検索
  scanner/types.ts               # ScannerAdapter, ScanResult
  scanner/fakeScannerAdapter.ts  # テスト/dev用フェイク
  composables/useScanner.ts      # スキャナー抽象の利用
  ocr/types.ts                   # OcrAdapter, OcrResult
  ocr/fakeOcrAdapter.ts          # テスト/dev用フェイク
  composables/useOcr.ts          # カメラOCR抽象の利用
  views/LoginPage.vue
  views/ItemDetailPage.vue
  views/ItemFormPage.vue         # 登録/編集兼用
  views/TabSearchPage.vue        # P1プレースホルダを実装に置換（検索＋スキャン導線）
  views/ScanPage.vue             # カメラOCR/スキャナーでコード取得→検索/詳細へ
  router/index.ts                # /login, /items/:id, /items/new, /items/:id/edit, /scan 追加＋認証ガード
  main.ts                        # createPinia().use()
  mocks/handlers.ts              # POST/PUT/DELETE items を決定的に追加
frontend/tests/unit/
  authStore.spec.ts  validators.spec.ts  useScanner.spec.ts  useOcr.spec.ts  useSearch.spec.ts  useItem.spec.ts
frontend/tests/e2e/
  login-flow.spec.ts  scan-flow.spec.ts
```

---

## Task 1: Pinia 認証ストア ＋ ログイン画面 ＋ バリデータ

**Files:** `frontend/src/stores/auth.ts`, `frontend/src/validators/auth.ts`, `frontend/src/views/LoginPage.vue`, `frontend/src/main.ts`(pinia), `frontend/src/router/index.ts`(/login + guard), `frontend/tests/unit/authStore.spec.ts`, `frontend/tests/unit/validators.spec.ts`

- [ ] **Step 1: 依存追加** — `frontend/` で `npm install pinia@^2`。

- [ ] **Step 2: バリデータの失敗テスト** `frontend/tests/unit/validators.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { loginSchema } from '../../src/validators/auth'

describe('loginSchema', () => {
  it('accepts valid credentials', () => {
    expect(loginSchema.safeParse({ username: 'demo', password: 'password1' }).success).toBe(true)
  })
  it('rejects short username (<3) and short password (<8)', () => {
    expect(loginSchema.safeParse({ username: 'ab', password: 'short' }).success).toBe(false)
  })
})
```
Run `npx vitest run tests/unit/validators.spec.ts` → FAIL。

- [ ] **Step 3: バリデータ実装** `frontend/src/validators/auth.ts`:
```ts
import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8).max(64),
})
export type LoginInput = z.infer<typeof loginSchema>
```
Run → PASS。

- [ ] **Step 4: authストアの失敗テスト** `frontend/tests/unit/authStore.spec.ts`:
```ts
import { describe, it, expect, beforeAll, beforeEach, afterAll, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { server } from '../../src/mocks/server'
import { useAuthStore } from '../../src/stores/auth'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
beforeEach(() => setActivePinia(createPinia()))

describe('useAuthStore', () => {
  it('logs in and stores token', async () => {
    const auth = useAuthStore()
    expect(auth.isAuthenticated).toBe(false)
    await auth.login('demo', 'password1')
    expect(auth.token).toBe('mock-token-123')
    expect(auth.isAuthenticated).toBe(true)
  })
  it('logout clears token', async () => {
    const auth = useAuthStore()
    await auth.login('demo', 'password1')
    auth.logout()
    expect(auth.isAuthenticated).toBe(false)
  })
})
```
Run → FAIL。

- [ ] **Step 5: authストア実装** `frontend/src/stores/auth.ts`:
```ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '../api/auth/auth'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const isAuthenticated = computed(() => token.value !== null)

  async function login(username: string, password: string) {
    const res = await loginApi({ username, password })
    token.value = res.token
  }
  function logout() {
    token.value = null
  }
  return { token, isAuthenticated, login, logout }
})
```
Run → PASS。（注: `login` 生成関数の引数形は生成物を確認。`login(loginRequestBody)` の想定。違えば合わせる。）

- [ ] **Step 6: Pinia を main.ts に登録** — `createApp` 後に `app.use(createPinia())` を追加（`import { createPinia } from 'pinia'`）。既存の `app.use(router)`/`IonicVue` は維持。

- [ ] **Step 7: LoginPage 実装** `frontend/src/views/LoginPage.vue` — Ionicフォーム。`data-testid` を付与:
  - `ion-input` username (`data-testid="login-username"`), password (`type=password`, `data-testid="login-password"`)
  - 送信ボタン `data-testid="login-submit"`
  - エラー表示 `data-testid="login-error"`（zod失敗 or API失敗時）
  - 送信: `loginSchema.safeParse` → OKなら `auth.login()` → 成功で `router.replace('/tabs/tab1')`、失敗で error 表示。
```vue
<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Login</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <ion-input label="Username" label-placement="stacked" data-testid="login-username" v-model="username" />
      <ion-input label="Password" label-placement="stacked" type="password" data-testid="login-password" v-model="password" />
      <div v-if="error" data-testid="login-error" class="error">{{ error }}</div>
      <ion-button expand="block" data-testid="login-submit" @click="submit">Sign in</ion-button>
    </ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton } from '@ionic/vue'
import { loginSchema } from '../validators/auth'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const error = ref('')
const router = useRouter()
const auth = useAuthStore()

async function submit() {
  error.value = ''
  const parsed = loginSchema.safeParse({ username: username.value, password: password.value })
  if (!parsed.success) { error.value = 'Invalid input'; return }
  try {
    await auth.login(username.value, password.value)
    router.replace('/tabs/tab1')
  } catch (e) {
    error.value = 'Login failed'
  }
}
</script>
<style scoped>.error { color: var(--ion-color-danger); }</style>
```

- [ ] **Step 8: ルート＋ガード** `frontend/src/router/index.ts`:
  - 追加: `{ path: '/login', component: () => import('@/views/LoginPage.vue') }`
  - ルート定義の末尾で `redirect: '/login'`（ルートパス `/` が tabs にリダイレクトしている場合は `/login` を初期に）。
  - `router.beforeEach`: 未認証で `/tabs/*` へ来たら `/login` へ。`/login` 自体と公開ルートは通す。auth ストアは `useAuthStore()` をガード内で取得（Pinia は app.use 後に有効。ガードは遅延評価なので可）。
```ts
router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.path.startsWith('/tabs') && !auth.isAuthenticated) return '/login'
  return true
})
```

- [ ] **Step 9: 検証** — `npx vitest run tests/unit/validators.spec.ts tests/unit/authStore.spec.ts` 緑、`npm run build` 成功。

- [ ] **Step 10: コミット** `git add -A && git commit -m "feat(p2): pinia auth store, login validator, login page with route guard"`

---

## Task 2: Item詳細 ＋ 登録/編集フォーム ＋ バリデータ

**Files:** `frontend/src/validators/item.ts`, `frontend/src/composables/useItem.ts`, `frontend/src/views/ItemDetailPage.vue`, `frontend/src/views/ItemFormPage.vue`, `frontend/src/mocks/handlers.ts`(POST/PUT/DELETE), `frontend/src/router/index.ts`, `frontend/src/views/TabItemsPage.vue`(詳細遷移＋新規ボタン), `frontend/tests/unit/validators.spec.ts`(追記), `frontend/tests/unit/useItem.spec.ts`

- [ ] **Step 1: itemバリデータ追記テスト** — `validators.spec.ts` に itemInputSchema のテストを追加（valid: name 'X', price 0, category 'food', code 'ABCD1234' → success; invalid: name '' , price -1, category 'xxx', code 'abc' → fail）。FAIL を確認。

- [ ] **Step 2: itemバリデータ実装** `frontend/src/validators/item.ts`:
```ts
import { z } from 'zod'

export const itemInputSchema = z.object({
  name: z.string().min(1).max(30),
  price: z.number().int().min(0).max(1000000),
  category: z.enum(['food', 'drink', 'other']),
  code: z.string().regex(/^[A-Z0-9]{8}$/),
})
export type ItemInputForm = z.infer<typeof itemInputSchema>
```
PASS。

- [ ] **Step 3: 決定的ハンドラ追加** `frontend/src/mocks/handlers.ts` に追加（既存のGET群に追記）:
```ts
http.post('/api/items', async ({ request }) => {
  const body = (await request.json()) as Record<string, unknown>
  return HttpResponse.json({ id: 999, ...body }, { status: 201 })
}),
http.put('/api/items/:id', async ({ request, params }) => {
  const body = (await request.json()) as Record<string, unknown>
  return HttpResponse.json({ id: Number(params.id), ...body })
}),
http.delete('/api/items/:id', () => new HttpResponse(null, { status: 204 })),
```

- [ ] **Step 4: useItem 失敗テスト** `frontend/tests/unit/useItem.spec.ts` — MSW server で `loadItem(1)` 後 `item.value?.name === 'Coffee'` を検証。FAIL。

- [ ] **Step 5: useItem 実装** `frontend/src/composables/useItem.ts`:
```ts
import { ref } from 'vue'
import type { Item, ItemInput } from '../api/models'
import { getItem, createItem, updateItem, deleteItem } from '../api/items/items'

export function useItem() {
  const item = ref<Item | null>(null)
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function loadItem(id: number) {
    loading.value = true; error.value = null
    try { item.value = await getItem(id) } catch (e) { error.value = e } finally { loading.value = false }
  }
  async function save(input: ItemInput, id?: number) {
    return id == null ? createItem(input) : updateItem(id, input)
  }
  async function remove(id: number) { return deleteItem(id) }

  return { item, loading, error, loadItem, save, remove }
}
```
PASS。（生成関数の引数順は生成物に合わせる: `getItem(id)`, `updateItem(id, body)` 想定。）

- [ ] **Step 6: ItemDetailPage** — ルート `/items/:id`。`useItem().loadItem(id)`。name/category/price/code 表示、`data-testid="item-detail"`。編集ボタン→ `/items/:id/edit`、削除ボタン→ remove 後 `/tabs/tab1`。`ion-back-button`。

- [ ] **Step 7: ItemFormPage（登録/編集兼用）** — ルート `/items/new` と `/items/:id/edit`。フォーム項目 name/price/category(`ion-select`)/code。`itemInputSchema.safeParse` で検証、エラー表示 `data-testid="item-form-error"`。保存ボタン `data-testid="item-form-submit"` → `save(input, idOrUndefined)` → 成功で詳細 or 一覧へ。編集時は `loadItem` で初期値投入。各入力に `data-testid`（item-name/item-price/item-category/item-code）。

- [ ] **Step 8: TabItemsPage 拡張** — 各 `ion-item` をクリックで `/items/:id` へ（`router.push`）。ヘッダに新規ボタン `data-testid="items-new"` → `/items/new`。空状態 `data-testid="items-empty"`、エラー状態 `data-testid="items-error"`（useItems の error を表示）も追加（P1レビュー#1の対応）。

- [ ] **Step 9: ルート追加** — `/items/:id`, `/items/new`, `/items/:id/edit` を router に追加（認証ガード対象に含める: パスを `/items` も guard 対象に）。

- [ ] **Step 10: 検証＋コミット** — 関連ユニット緑、`npm run build` 成功。`git commit -m "feat(p2): item detail, create/edit form with zod validation, list navigation & states"`

---

## Task 3: 検索（useSearch ＋ TabSearchPage）

**Files:** `frontend/src/composables/useSearch.ts`, `frontend/src/views/TabSearchPage.vue`(置換), `frontend/tests/unit/useSearch.spec.ts`

- [ ] **Step 1: useSearch 失敗テスト** — MSW で `search('cof')` 後 `results.value.length === 3`（フィクスチャ返却）。FAIL。
- [ ] **Step 2: useSearch 実装** `frontend/src/composables/useSearch.ts`:
```ts
import { ref } from 'vue'
import type { Item } from '../api/models'
import { searchItems } from '../api/items/items'

export function useSearch() {
  const query = ref('')
  const results = ref<Item[]>([])
  const loading = ref(false)
  async function search(q: string) {
    query.value = q
    if (!q) { results.value = []; return }
    loading.value = true
    try { results.value = await searchItems({ q }) } finally { loading.value = false }
  }
  return { query, results, loading, search }
}
```
PASS。（`searchItems({ q })` の引数形は生成物に合わせる。）
- [ ] **Step 3: TabSearchPage 実装** — `ion-searchbar`(`data-testid="search-input"`)、結果 `ion-list`(`data-testid="search-results"`)、0件 `data-testid="search-empty"`。スキャン画面への導線ボタン `data-testid="search-scan"` → `/scan`。結果クリックで `/items/:id`。
- [ ] **Step 4: 検証＋コミット** — ユニット緑、build 成功。`git commit -m "feat(p2): search composable and search tab"`

---

## Task 4: ハードウェア抽象（useScanner / useOcr ＋ フェイクアダプタ ＋ ScanPage）

**Files:** `frontend/src/scanner/types.ts`, `frontend/src/scanner/fakeScannerAdapter.ts`, `frontend/src/composables/useScanner.ts`, `frontend/src/ocr/types.ts`, `frontend/src/ocr/fakeOcrAdapter.ts`, `frontend/src/composables/useOcr.ts`, `frontend/src/views/ScanPage.vue`, `frontend/src/router/index.ts`(/scan), `frontend/tests/unit/useScanner.spec.ts`, `frontend/tests/unit/useOcr.spec.ts`

- [ ] **Step 1: Scanner型** `frontend/src/scanner/types.ts`:
```ts
export interface ScanResult { code: string; format: 'qr' | 'barcode' }
export interface ScannerAdapter {
  /** 1回のスキャンを行い結果を返す。未接続/失敗時は例外。 */
  scan(): Promise<ScanResult>
  isAvailable(): Promise<boolean>
}
```
- [ ] **Step 2: フェイクScanner** `frontend/src/scanner/fakeScannerAdapter.ts`:
```ts
import type { ScannerAdapter, ScanResult } from './types'

export function createFakeScannerAdapter(result: ScanResult = { code: 'ABCD0001', format: 'qr' }): ScannerAdapter {
  return {
    async scan() { return result },
    async isAvailable() { return true },
  }
}
```
- [ ] **Step 3: useScanner 失敗テスト** `frontend/tests/unit/useScanner.spec.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { useScanner } from '../../src/composables/useScanner'
import { createFakeScannerAdapter } from '../../src/scanner/fakeScannerAdapter'

describe('useScanner', () => {
  it('returns scanned code via injected adapter', async () => {
    const { lastCode, scan, scanning } = useScanner(createFakeScannerAdapter({ code: 'ZZZZ9999', format: 'barcode' }))
    expect(scanning.value).toBe(false)
    const r = await scan()
    expect(r.code).toBe('ZZZZ9999')
    expect(lastCode.value).toBe('ZZZZ9999')
  })
  it('captures error when adapter throws', async () => {
    const failing = { async scan() { throw new Error('no device') }, async isAvailable() { return false } }
    const { scan, error } = useScanner(failing)
    await expect(scan()).rejects.toThrow()
    expect(error.value).toBeTruthy()
  })
})
```
FAIL。
- [ ] **Step 4: useScanner 実装** `frontend/src/composables/useScanner.ts`:
```ts
import { ref } from 'vue'
import type { ScannerAdapter, ScanResult } from '../scanner/types'

export function useScanner(adapter: ScannerAdapter) {
  const scanning = ref(false)
  const lastCode = ref<string | null>(null)
  const error = ref<unknown>(null)

  async function scan(): Promise<ScanResult> {
    scanning.value = true; error.value = null
    try {
      const r = await adapter.scan()
      lastCode.value = r.code
      return r
    } catch (e) {
      error.value = e
      throw e
    } finally {
      scanning.value = false
    }
  }
  return { scanning, lastCode, error, scan }
}
```
PASS。
- [ ] **Step 5: OCR型＋フェイク＋useOcr（Scannerと同形）**
  `frontend/src/ocr/types.ts`:
```ts
export interface OcrResult { text: string }
export interface OcrAdapter {
  /** 画像（dataURL/Blob等の抽象）からテキストを認識。引数なしならカメラ起動を想定。 */
  recognize(image?: unknown): Promise<OcrResult>
  isAvailable(): Promise<boolean>
}
```
  `frontend/src/ocr/fakeOcrAdapter.ts`:
```ts
import type { OcrAdapter, OcrResult } from './types'

export function createFakeOcrAdapter(text = 'ABCD1234'): OcrAdapter {
  return {
    async recognize() { return { text } },
    async isAvailable() { return true },
  }
}
```
  `frontend/src/composables/useOcr.ts`（useScannerと同型: `recognizing`, `lastText`, `error`, `recognize()`）。
  テスト `useOcr.spec.ts`: フェイク注入で `recognize()` → `lastText==='HELLO'`、失敗アダプタで error 捕捉。TDDで FAIL→実装→PASS。
- [ ] **Step 6: ScanPage** `frontend/src/views/ScanPage.vue` — ルート `/scan`。
  - 「スキャナーで読取」ボタン `data-testid="scan-scanner"` → `useScanner` で取得 → コードを `data-testid="scan-result"` に表示し、`/search` or `/items?code=` 導線。
  - 「カメラOCR」ボタン `data-testid="scan-ocr"` → `useOcr` で認識 → テキスト表示。
  - **アダプタ注入**: 本番未定のため、ScanPage は dev/PoC では `createFakeScannerAdapter()`/`createFakeOcrAdapter()` を使う（将来、実機アダプタに差し替えるポイントをコメントで明示）。
  - エラー表示 `data-testid="scan-error"`。
- [ ] **Step 7: /scan ルート追加**（guard対象）。検証＋コミット `git commit -m "feat(p2): scanner & OCR hardware abstraction with fake adapters, scan page"`

---

## Task 5: 仕上げ（一覧状態/設定）＋ E2Eフロー ＋ 全体検証

**Files:** `frontend/src/views/TabSettingsPage.vue`(任意の軽い拡張), `frontend/tests/e2e/login-flow.spec.ts`, `frontend/tests/e2e/scan-flow.spec.ts`

- [ ] **Step 1: TabSettingsPage 軽拡張** — `ion-toggle`（ダークテーマ切替, `data-testid="settings-dark"`）と「ログアウト」ボタン `data-testid="settings-logout"`（auth.logout()→/login）。最小で可。
- [ ] **Step 2: login-flow E2E** `frontend/tests/e2e/login-flow.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('login then see items', async ({ page }) => {
  await page.goto('/login')
  await page.getByTestId('login-username').locator('input').fill('demo')
  await page.getByTestId('login-password').locator('input').fill('password1')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('items-list')).toBeVisible()
  await expect(page.getByText('Coffee')).toBeVisible()
})
```
（`ion-input` 内の実 `input` 取得方法は実装に合わせ調整可。）
- [ ] **Step 3: scan-flow E2E** `frontend/tests/e2e/scan-flow.spec.ts` — ログイン→ /scan へ遷移→ `scan-scanner` クリック→ `scan-result` にコード表示を確認。
- [ ] **Step 4: 全体検証** — `npm run test:unit`（全ユニット緑）, `npm run test:e2e`（全E2E緑）, `npm run build` 成功。
- [ ] **Step 5: コミット** `git commit -m "feat(p2): settings tweaks and e2e flows for login and scan"`

---

## 完了確認（P2 Done）
- [ ] ログイン→Items一覧→詳細→編集/新規 の導線が動く（E2E緑）
- [ ] 検索タブで検索でき、スキャン画面導線がある
- [ ] `useScanner`/`useOcr` がアダプタ注入で動作（ユニット緑、フェイクで自動テスト）
- [ ] 画面項目バリデータ(zod)が境界を弾く（ユニット緑）
- [ ] `npm run build` 成功、`npm run test:unit`/`test:e2e` 緑

## 次: P4（境界値ジェネレータ gen-cases）
