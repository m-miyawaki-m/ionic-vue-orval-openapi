# P1 基盤＋コード生成パイプライン Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OpenAPI契約だけを起点に、Ionic Vue + Capacitor 5(Android 13) の雛形を作り、Orvalで API/zod/MSW を生成し、MSWモックで Items 一覧が表示される起動可能アプリを完成させる。

**Architecture:** `openapi/openapi.yaml` を単一の真実とし、Orval が `axios-functions` クライアント・zodスキーマ・MSWハンドラを生成する。アプリは生成APIを共通mutator(axios)経由で呼び、開発/テストでは MSW＋固定フィクスチャで決定的データを返す。UIは Ionic Vue のタブシェルで、Tab1 に Items 一覧を縦切りで実装してパイプライン全体を疎通させる。

**Tech Stack:** Ionic Vue 8 / Vue 3 / vue-router 4 / Vite 5 / TypeScript 5.9 / Capacitor 5.7（Android, target SDK 33）/ Orval 8（axios-functions + zod + msw）/ axios 1 / MSW 2 / Vitest 0.34 / Playwright（最新安定）

> 注: バージョンは隣接の実証済みプロジェクト `../ionic-sample-orval/frontend/package.json` に準拠（Capacitor 5 を確実に得るため明示ピン）。

---

## ファイル構成（このプランで作成/変更するもの）

```
ionic-vue-orval-openapi/
├─ .gitignore                         # 作成
├─ openapi/openapi.yaml               # 作成（契約）
└─ frontend/
   ├─ package.json                    # 作成（scaffold→ピン編集）
   ├─ orval.config.ts                 # 作成
   ├─ capacitor.config.ts             # 作成/scaffold
   ├─ vite.config.ts                  # scaffold（変更: test/server設定）
   ├─ vitest.config.ts                # 作成
   ├─ playwright.config.ts            # 作成
   ├─ index.html / src/main.ts        # scaffold
   ├─ src/api/                        # 生成物（手書き禁止）: index.ts, models/, *.zod.ts, endpoints.msw.ts
   ├─ src/api/axios.ts                # 作成（mutator・手書き）
   ├─ src/mocks/browser.ts            # 作成（MSW worker）
   ├─ src/mocks/server.ts             # 作成（MSW node, テスト用）
   ├─ src/mocks/handlers.ts           # 作成（生成ハンドラ＋固定フィクスチャ上書き）
   ├─ src/mocks/fixtures/items.ts     # 作成（固定フィクスチャ）
   ├─ src/router/index.ts             # scaffold（変更）
   ├─ src/views/TabItemsPage.vue      # 作成（Items一覧・縦切り）
   ├─ src/views/TabSearchPage.vue     # 作成（プレースホルダ）
   ├─ src/views/TabSettingsPage.vue   # 作成（プレースホルダ）
   ├─ src/views/TabsShell.vue         # 作成（タブナビ）
   ├─ src/composables/useItems.ts     # 作成（一覧取得ロジック・L1対象）
   ├─ android/                        # 生成（cap add android）
   ├─ tests/unit/useItems.spec.ts     # 作成（L1スモーク）
   └─ tests/e2e/smoke.spec.ts         # 作成（Playwrightスモーク）
```

各ファイルは単一責務。生成物(`src/api/`)は手で触らず、契約変更時は `npm run gen` で再生成する。

---

## Task 1: リポジトリ初期化 ＋ Ionic Vue タブ雛形 ＋ Capacitor 5 ピン

**Files:**
- Create: `.gitignore`
- Create: `frontend/` (Ionic CLI scaffold)
- Modify: `frontend/package.json`（依存バージョンをピン）

- [ ] **Step 1: gitリポジトリを初期化**

Run（プロジェクトルート `C:\Oracle\3df002\ionic-vue-orval-openapi`）:
```bash
git init
```
Expected: `Initialized empty Git repository ...`

- [ ] **Step 2: ルート .gitignore を作成**

Create `.gitignore`:
```gitignore
node_modules/
frontend/node_modules/
frontend/dist/
frontend/android/app/build/
frontend/android/build/
frontend/android/.gradle/
frontend/.vitest-report/
frontend/test-results/
frontend/playwright-report/
frontend/blob-report/
*.log
.DS_Store
```

- [ ] **Step 3: Ionic CLI でタブ雛形を生成**

Run（プロジェクトルート）:
```bash
npm install -g @ionic/cli
ionic start frontend tabs --type vue --capacitor --no-git --no-deps
```
Expected: `frontend/` が作成され `src/`, `index.html`, `ionic.config.json` が存在する。`--no-deps` で install は後段。

- [ ] **Step 4: package.json の依存を Capacitor 5 / 既知の動作バージョンにピン**

Modify `frontend/package.json` の `dependencies` と `devDependencies` を以下に置換（`name`/`scripts` は次タスクで調整）:
```json
{
  "dependencies": {
    "@capacitor/android": "5.7.8",
    "@capacitor/app": "5.0.8",
    "@capacitor/cli": "5.7.8",
    "@capacitor/core": "5.7.8",
    "@capacitor/haptics": "5.0.8",
    "@capacitor/keyboard": "5.0.9",
    "@capacitor/status-bar": "5.0.8",
    "@ionic/vue": "^8.0.0",
    "@ionic/vue-router": "^8.0.0",
    "axios": "^1.16.0",
    "ionicons": "^7.0.0",
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "zod": "^4.4.3"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/js-yaml": "^4.0.9",
    "@vitejs/plugin-vue": "^4.0.0",
    "@vitest/coverage-v8": "^0.34.6",
    "@vue/test-utils": "^2.4.10",
    "js-yaml": "^4.1.1",
    "jsdom": "^22.1.0",
    "msw": "^2.14.4",
    "orval": "^8.9.1",
    "terser": "^5.4.0",
    "tsx": "^4.22.3",
    "typescript": "~5.9.0",
    "vite": "^5.0.0",
    "vitest": "^0.34.6",
    "vue-tsc": "^2.1.10"
  }
}
```

- [ ] **Step 5: 依存をインストール**

Run（`frontend/`）:
```bash
npm install
```
Expected: 成功。`node_modules/@capacitor/core` の version が 5.7.8。

- [ ] **Step 6: dev サーバ起動で雛形が動くことを確認**

Run（`frontend/`）:
```bash
npm run dev -- --port 5173
```
Expected: Vite が起動し `http://localhost:5173` でタブUIが表示される。確認後 Ctrl+C で停止。

- [ ] **Step 7: コミット**

```bash
git add .gitignore frontend
git commit -m "chore: scaffold Ionic Vue tabs app with Capacitor 5 pinned"
```

---

## Task 2: Android プラットフォーム追加（Android 13 / target SDK 33）

**Files:**
- Modify: `frontend/capacitor.config.ts`
- Create: `frontend/android/`（`cap add android` が生成）
- Modify: `frontend/android/variables.gradle`

- [ ] **Step 1: capacitor.config.ts の appId/appName/webDir を確認・設定**

Modify `frontend/capacitor.config.ts`:
```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.ionicvueorval',
  appName: 'ionic-vue-orval-openapi',
  webDir: 'dist',
};

export default config;
```

- [ ] **Step 2: 本番ビルドを作成（cap add android は webDir を要求）**

Run（`frontend/`）:
```bash
npm run build
```
Expected: `dist/` が生成される。

- [ ] **Step 3: Android プラットフォームを追加**

Run（`frontend/`）:
```bash
npx cap add android
```
Expected: `android/` が生成される。

- [ ] **Step 4: target/compile SDK を Android 13 向けに設定**

Modify `frontend/android/variables.gradle`（既存値を置換）:
```gradle
ext {
    minSdkVersion = 22
    compileSdkVersion = 34
    targetSdkVersion = 33
    androidxActivityVersion = '1.7.0'
    androidxAppCompatVersion = '1.6.1'
    androidxCoordinatorLayoutVersion = '1.2.0'
    androidxCoreVersion = '1.10.0'
    androidxFragmentVersion = '1.5.6'
    coreSplashScreenVersion = '1.0.0'
    androidxWebkitVersion = '1.6.1'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.1.5'
    androidxEspressoCoreVersion = '3.5.1'
    cordovaAndroidVersion = '10.1.1'
}
```

- [ ] **Step 5: 同期して構成が壊れていないことを確認**

Run（`frontend/`）:
```bash
npx cap sync android
```
Expected: `[success] android platform updated` 等のメッセージ。エラーなし。

- [ ] **Step 6: コミット**

```bash
git add frontend/capacitor.config.ts frontend/android
git commit -m "feat: add Android platform targeting Android 13 (SDK 33)"
```

---

## Task 3: OpenAPI 契約を作成（auth / items CRUD / search）＋ Lint

**Files:**
- Create: `openapi/openapi.yaml`
- Modify: `frontend/package.json`（lint:openapi スクリプト追加）

制約（minLength/maxLength/min/max/enum/pattern）は後続P4の境界値生成の源になるため、ここで意図的に付与する。

- [ ] **Step 1: openapi.yaml を作成**

Create `openapi/openapi.yaml`:
```yaml
openapi: 3.0.3
info:
  title: ionic-vue-orval PoC API
  version: 1.0.0
servers:
  - url: /api
tags:
  - name: auth
  - name: items
paths:
  /auth/login:
    post:
      tags: [auth]
      operationId: login
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/LoginRequest'
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/LoginResponse'
  /items:
    get:
      tags: [items]
      operationId: listItems
      parameters:
        - name: q
          in: query
          required: false
          schema: { type: string, maxLength: 50 }
        - name: code
          in: query
          required: false
          schema: { type: string, pattern: '^[A-Z0-9]{8}$' }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/Item' }
    post:
      tags: [items]
      operationId: createItem
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ItemInput' }
      responses:
        '201':
          description: Created
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Item' }
  /items/{id}:
    get:
      tags: [items]
      operationId: getItem
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer, format: int64 }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Item' }
    put:
      tags: [items]
      operationId: updateItem
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer, format: int64 }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: '#/components/schemas/ItemInput' }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema: { $ref: '#/components/schemas/Item' }
    delete:
      tags: [items]
      operationId: deleteItem
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: integer, format: int64 }
      responses:
        '204':
          description: No Content
  /search:
    get:
      tags: [items]
      operationId: searchItems
      parameters:
        - name: q
          in: query
          required: true
          schema: { type: string, minLength: 1, maxLength: 50 }
      responses:
        '200':
          description: OK
          content:
            application/json:
              schema:
                type: array
                items: { $ref: '#/components/schemas/Item' }
components:
  schemas:
    LoginRequest:
      type: object
      required: [username, password]
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 20
          example: demo
        password:
          type: string
          minLength: 8
          maxLength: 64
          example: password1
    LoginResponse:
      type: object
      required: [token]
      properties:
        token:
          type: string
          example: mock-token-123
    ItemInput:
      type: object
      required: [name, price, category, code]
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 30
          example: Sample Item
        price:
          type: integer
          minimum: 0
          maximum: 1000000
          example: 1200
        category:
          type: string
          enum: [food, drink, other]
          example: food
        code:
          type: string
          pattern: '^[A-Z0-9]{8}$'
          example: ABCD1234
    Item:
      allOf:
        - $ref: '#/components/schemas/ItemInput'
        - type: object
          required: [id]
          properties:
            id:
              type: integer
              format: int64
              example: 1
```

- [ ] **Step 2: lint スクリプトを追加**

Modify `frontend/package.json` の `scripts` に追加:
```json
"lint:openapi": "redocly lint ../openapi/openapi.yaml"
```
かつ devDependencies に追加:
```json
"@redocly/cli": "^1.34.0"
```

- [ ] **Step 3: redocly をインストール**

Run（`frontend/`）:
```bash
npm install
```
Expected: 成功。

- [ ] **Step 4: 契約を lint して妥当性を確認**

Run（`frontend/`）:
```bash
npm run lint:openapi
```
Expected: エラー 0 件（warning は許容）。

- [ ] **Step 5: コミット**

```bash
git add openapi/openapi.yaml frontend/package.json frontend/package-lock.json
git commit -m "feat: add OpenAPI contract (auth, items CRUD, search) with constraints"
```

---

## Task 4: Orval 設定 ＋ axios mutator ＋ コード生成

**Files:**
- Create: `frontend/orval.config.ts`
- Create: `frontend/src/api/axios.ts`
- Modify: `frontend/package.json`（gen スクリプト）
- Create（生成）: `frontend/src/api/*`

- [ ] **Step 1: gen スクリプトを追加**

Modify `frontend/package.json` の `scripts` に追加:
```json
"gen": "orval --config ./orval.config.ts"
```

- [ ] **Step 2: orval.config.ts を作成**

Create `frontend/orval.config.ts`:
```ts
import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: '../openapi/openapi.yaml',
    output: {
      target: 'src/api/index.ts',
      schemas: 'src/api/models',
      client: 'axios-functions',
      mode: 'tags-split',
      mock: {
        type: 'msw',
        useExamples: true,
      },
      override: {
        mutator: {
          path: 'src/api/axios.ts',
          name: 'request',
        },
      },
    },
  },
  apiZod: {
    input: '../openapi/openapi.yaml',
    output: {
      mode: 'tags-split',
      client: 'zod',
      target: 'src/api/zod',
      fileExtension: '.zod.ts',
    },
  },
})
```

- [ ] **Step 3: axios mutator を作成**

Create `frontend/src/api/axios.ts`:
```ts
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

export const AXIOS_INSTANCE = axios.create({ baseURL: '' })

export const request = <T>(config: AxiosRequestConfig): Promise<T> => {
  return AXIOS_INSTANCE({ ...config }).then((res: AxiosResponse<T>) => res.data)
}

export default request
```

- [ ] **Step 4: コードを生成**

Run（`frontend/`）:
```bash
npm run gen
```
Expected: `src/api/index.ts`, `src/api/models/*`, `src/api/zod/*.zod.ts`, タグ別の `*.msw.ts`（MSWハンドラ）が生成される。

- [ ] **Step 5: 型チェックで生成物が壊れていないことを確認**

Run（`frontend/`）:
```bash
npx vue-tsc --noEmit
```
Expected: エラーなし（既存scaffoldの型エラーが出る場合は scaffold 既定の `src` のみ。生成 `src/api` にエラーが無いことを確認）。

- [ ] **Step 6: コミット**

```bash
git add frontend/orval.config.ts frontend/src/api
git commit -m "feat: configure orval and generate API/zod/MSW from contract"
```

---

## Task 5: MSW セットアップ ＋ 固定フィクスチャ

**Files:**
- Create: `frontend/src/mocks/fixtures/items.ts`
- Create: `frontend/src/mocks/handlers.ts`
- Create: `frontend/src/mocks/browser.ts`
- Create: `frontend/src/mocks/server.ts`
- Modify: `frontend/src/main.ts`（dev時に worker 起動）
- Modify: `frontend/package.json`（msw workerDirectory）

- [ ] **Step 1: 固定フィクスチャを作成**

Create `frontend/src/mocks/fixtures/items.ts`:
```ts
import type { Item } from '../../api/models'

export const itemsFixture: Item[] = [
  { id: 1, name: 'Coffee', price: 350, category: 'drink', code: 'ABCD0001' },
  { id: 2, name: 'Sandwich', price: 480, category: 'food', code: 'ABCD0002' },
  { id: 3, name: 'Notebook', price: 220, category: 'other', code: 'ABCD0003' },
]
```

> 注: `Item` 型の import パスは生成結果に合わせる。`src/api/models/index.ts` が存在する場合は `'../../api/models'` で解決できる。解決できなければ Step 5 の型チェックで判明するので、生成物の実際のパスに修正する。

- [ ] **Step 2: ハンドラを作成（生成ハンドラ＋決定的上書き）**

Create `frontend/src/mocks/handlers.ts`:
```ts
import { http, HttpResponse } from 'msw'
import { itemsFixture } from './fixtures/items'

// 決定的なフィクスチャで主要GETを上書きする（生成 *.msw.ts はランダム例のため）
export const handlers = [
  http.get('/api/items', () => HttpResponse.json(itemsFixture)),
  http.get('/api/items/:id', ({ params }) => {
    const id = Number(params.id)
    const found = itemsFixture.find((i) => i.id === id)
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
  }),
  http.get('/api/search', () => HttpResponse.json(itemsFixture)),
  http.post('/api/auth/login', () => HttpResponse.json({ token: 'mock-token-123' })),
]
```

- [ ] **Step 2 確認: msw の version に http API があることを確認**

Run（`frontend/`）:
```bash
node -e "console.log(require('msw/package.json').version)"
```
Expected: `2.x`（`http`/`HttpResponse` API はMSW 2系）。

- [ ] **Step 3: ブラウザ用 worker を作成**

Create `frontend/src/mocks/browser.ts`:
```ts
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
```

- [ ] **Step 4: テスト(node)用 server を作成**

Create `frontend/src/mocks/server.ts`:
```ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

- [ ] **Step 5: MSW worker スクリプトを public に配置**

Run（`frontend/`）:
```bash
npx msw init public --save
```
Expected: `public/mockServiceWorker.js` が生成され、`package.json` に `"msw": { "workerDirectory": ["public"] }` が追記される。

- [ ] **Step 6: dev時に worker を起動するよう main.ts を変更**

Modify `frontend/src/main.ts`（`app.mount('#app')` 周辺を以下に変更。既存 import は維持）:
```ts
async function enableMocking() {
  if (import.meta.env.DEV) {
    const { worker } = await import('./mocks/browser')
    await worker.start({ onUnhandledRequest: 'bypass' })
  }
}

enableMocking().then(() => {
  router.isReady().then(() => {
    app.mount('#app')
  })
})
```

- [ ] **Step 7: 型チェック**

Run（`frontend/`）:
```bash
npx vue-tsc --noEmit
```
Expected: `src/mocks/*` にエラーなし（Step 1 の Item import パスが違えばここで修正）。

- [ ] **Step 8: コミット**

```bash
git add frontend/src/mocks frontend/src/main.ts frontend/public/mockServiceWorker.js frontend/package.json
git commit -m "feat: set up MSW with deterministic fixtures"
```

---

## Task 6: Items一覧の縦切り実装（composable + Tab1ページ）

**Files:**
- Create: `frontend/src/composables/useItems.ts`
- Create: `frontend/tests/unit/useItems.spec.ts`
- Create: `frontend/src/views/TabItemsPage.vue`
- Modify: `frontend/src/router/index.ts`（Tab1 を TabItemsPage に）

TDDで composable から作る。

- [ ] **Step 1: 失敗するテストを書く（useItems）**

Create `frontend/tests/unit/useItems.spec.ts`:
```ts
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import { server } from '../../src/mocks/server'
import { useItems } from '../../src/composables/useItems'

beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

describe('useItems', () => {
  it('loads items from the API and exposes them', async () => {
    const { items, loading, load } = useItems()
    expect(loading.value).toBe(false)
    await load()
    expect(loading.value).toBe(false)
    expect(items.value).toHaveLength(3)
    expect(items.value[0].name).toBe('Coffee')
  })
})
```

- [ ] **Step 2: テストを実行して失敗を確認**

Run（`frontend/`）:
```bash
npx vitest run tests/unit/useItems.spec.ts
```
Expected: FAIL（`useItems` が存在しない、import 解決エラー）。

- [ ] **Step 3: composable を最小実装**

Create `frontend/src/composables/useItems.ts`:
```ts
import { ref } from 'vue'
import type { Item } from '../api/models'
import { listItems } from '../api'

export function useItems() {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<unknown>(null)

  async function load() {
    loading.value = true
    error.value = null
    try {
      items.value = await listItems()
    } catch (e) {
      error.value = e
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, load }
}
```

> 注: `listItems` の import 元（`'../api'`）と引数有無は生成結果に合わせる。`axios-functions` + `tags-split` では関数が `src/api/index.ts` から再エクスポートされる。名称/パスが異なれば生成物に合わせて修正する。

- [ ] **Step 4: テストを実行して成功を確認**

Run（`frontend/`）:
```bash
npx vitest run tests/unit/useItems.spec.ts
```
Expected: PASS（1 passed）。

- [ ] **Step 5: Tab1 ページを実装**

Create `frontend/src/views/TabItemsPage.vue`:
```vue
<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-title>Items</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content :fullscreen="true">
      <div v-if="loading" data-testid="items-loading">Loading...</div>
      <ion-list v-else data-testid="items-list">
        <ion-item v-for="item in items" :key="item.id">
          <ion-label>
            <h2>{{ item.name }}</h2>
            <p>{{ item.category }} / ¥{{ item.price }}</p>
          </ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonList, IonItem, IonLabel,
} from '@ionic/vue'
import { useItems } from '../composables/useItems'

const { items, loading, load } = useItems()
onMounted(load)
</script>
```

- [ ] **Step 6: ルータの Tab1 を TabItemsPage に差し替え**

Modify `frontend/src/router/index.ts`：tabs 既定の tab1 ルートの `component` を `() => import('../views/TabItemsPage.vue')` に変更する（既存の tab1/tab2/tab3 構造は維持。tab2/tab3 は次タスクで差し替え）。

- [ ] **Step 7: dev で Items が表示されることを確認**

Run（`frontend/`）:
```bash
npm run dev -- --port 5173
```
Expected: Tab1 に Coffee/Sandwich/Notebook の3件が表示される。確認後 Ctrl+C。

- [ ] **Step 8: コミット**

```bash
git add frontend/src/composables/useItems.ts frontend/tests/unit/useItems.spec.ts frontend/src/views/TabItemsPage.vue frontend/src/router/index.ts
git commit -m "feat: render items list (Tab1) via generated API and MSW"
```

---

## Task 7: テスト基盤（Vitest / Playwright）＋ スモーク ＋ スクリプト整備

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/test-setup.ts`
- Create: `frontend/playwright.config.ts`
- Create: `frontend/tests/e2e/smoke.spec.ts`
- Modify: `frontend/src/views/TabSearchPage.vue` / `TabSettingsPage.vue`（プレースホルダ）
- Modify: `frontend/package.json`（test スクリプト）

- [ ] **Step 1: Vitest 設定を作成**

Create `frontend/vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./test-setup.ts'],
    include: ['tests/unit/**/*.spec.ts'],
  },
})
```

- [ ] **Step 2: テストセットアップを作成**

Create `frontend/test-setup.ts`:
```ts
import { config } from '@vue/test-utils'

// Ionic Web Components は jsdom で未定義のため、L1ではcomposable中心にテストする
config.global.stubs = {}
```

- [ ] **Step 3: test スクリプトを追加し Vitest を実行**

Modify `frontend/package.json` の `scripts` に追加:
```json
"test:unit": "vitest run",
"test:e2e": "playwright test"
```

Run（`frontend/`）:
```bash
npm run test:unit
```
Expected: `useItems.spec.ts` を含め PASS（1 passed 以上）。

- [ ] **Step 4: tab2/tab3 のプレースホルダページを作成**

Create `frontend/src/views/TabSearchPage.vue`:
```vue
<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Search</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" data-testid="search-page">Search (placeholder)</ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
</script>
```

Create `frontend/src/views/TabSettingsPage.vue`:
```vue
<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Settings</ion-title></ion-toolbar></ion-header>
    <ion-content :fullscreen="true" data-testid="settings-page">Settings (placeholder)</ion-content>
  </ion-page>
</template>
<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/vue'
</script>
```

Modify `frontend/src/router/index.ts`：tab2 を `TabSearchPage.vue`、tab3 を `TabSettingsPage.vue` に差し替える。

- [ ] **Step 5: Playwright をインストール（ブラウザ込み）**

Run（`frontend/`）:
```bash
npx playwright install --with-deps chromium
```
Expected: Chromium がダウンロードされる。

- [ ] **Step 6: Playwright 設定を作成**

Create `frontend/playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev -- --port 5173',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
})
```

- [ ] **Step 7: 失敗するE2Eスモークを書く**

Create `frontend/tests/e2e/smoke.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

test('app boots and Tab1 shows items from MSW', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByTestId('items-list')).toBeVisible()
  await expect(page.getByText('Coffee')).toBeVisible()
})
```

- [ ] **Step 8: E2Eを実行して成功を確認**

Run（`frontend/`）:
```bash
npm run test:e2e
```
Expected: PASS（1 passed）。webServer が dev を起動し、MSWモックで Coffee が表示される。

> 失敗時の診断: dev単体で `http://localhost:5173` を開き、DevTools Console で MSW の `[MSW] Mocking enabled` ログが出ているか、`/api/items` が 200 を返すかを確認する。

- [ ] **Step 9: コミット**

```bash
git add frontend/vitest.config.ts frontend/test-setup.ts frontend/playwright.config.ts frontend/tests/e2e/smoke.spec.ts frontend/src/views/TabSearchPage.vue frontend/src/views/TabSettingsPage.vue frontend/src/router/index.ts frontend/package.json
git commit -m "test: add Vitest + Playwright base configs with smoke tests"
```

---

## 完了確認（P1のDone定義）

- [ ] `npm run gen` で `openapi.yaml` から API/zod/MSW が再生成できる
- [ ] `npm run dev` で起動し Tab1 に MSW のItems 3件が表示される
- [ ] `npm run test:unit` が緑（useItems）
- [ ] `npm run test:e2e` が緑（smoke）
- [ ] `npx cap sync android` がエラーなく通る（Android 13 / SDK 33）

## 次の計画

- **P2 画面＋ハードウェア抽象**: ログイン/CRUDフォーム/検索/スキャンOCR画面、`useScanner`/`useOcr`＋フェイクアダプタ。
- P3 テスト5層＋比較 → P4 境界値ジェネレータ → P5 Python仕様書/エビデンス → P6 設計書群。
