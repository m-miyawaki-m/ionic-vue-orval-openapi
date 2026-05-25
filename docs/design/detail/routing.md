# ルーティング定義（詳細設計）

実装: `frontend/src/router/index.ts`（`@ionic/vue-router`, `createWebHistory`）。

## ルート表

| path | コンポーネント | ロード | params | 備考 |
|---|---|---|---|---|
| `/` | （redirect） | — | — | → `/tabs/tab1` |
| `/login` | `LoginPage.vue` | lazy | — | 認証不要 |
| `/scan` | `ScanPage.vue` | lazy | — | 要認証 |
| `/items/new` | `ItemFormPage.vue` | lazy | — | 要認証（新規） |
| `/items/:id/edit` | `ItemFormPage.vue` | lazy | `id` | 要認証（編集, 既存値ロード） |
| `/items/:id` | `ItemDetailPage.vue` | lazy | `id` | 要認証 |
| `/tabs/` | `TabsPage.vue`（eager） | — | — | 子ルートのシェル。`''`→`/tabs/tab1` |
| `/tabs/tab1` | `TabItemsPage.vue` | lazy | — | Items一覧 |
| `/tabs/tab2` | `TabSearchPage.vue` | lazy | — | 検索 |
| `/tabs/tab3` | `TabSettingsPage.vue` | lazy | — | 設定 |

`/items/:id/edit` は `/items/:id` より前に定義し、`new` を含め静的セグメントを動的より優先させている。

## 認証ガード

`router.beforeEach`:

```ts
if ((to.path.startsWith('/tabs') || to.path.startsWith('/items') || to.path.startsWith('/scan'))
    && !auth.isAuthenticated) return '/login'
```

- 保護対象: `/tabs*` `/items*` `/scan*`。未認証なら `/login` へ。
- 認証は **Pinia の `useAuthStore().isAuthenticated`**（トークンの有無）。**非永続**なのでリロードで未認証に戻り `/login` へ。
- `/login` 自体はガード対象外。

テスト観点（△）: E2E は各保護画面に入る前にログインを通す（`tests/e2e/*`）。スキャン導線も `search-scan` → `/scan`。
