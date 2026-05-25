# クラス/モジュール一覧・定義（詳細設計）

composable / store / validator の一覧と入出力。実装は `frontend/src/`。L1ユニットテストの主対象。

## composable（`src/composables/`）

| モジュール | 状態(ref) | 関数 | 依存API | テスト |
|---|---|---|---|---|
| `useItems` | `items: Item[]`, `loading`, `error` | `load()` → `listItems()` | GET /items | `useItems.spec.ts` |
| `useItem` | `item: Item\|null`, `loading`, `error` | `loadItem(id)`→getItem / `save(input,id?)`→create\|update / `remove(id)`→delete | items CRUD | `useItem.spec.ts` |
| `useSearch` | `query`, `results: Item[]`, `loading` | `search(q)`（空qで結果クリア）→ `searchItems({q})` | GET /search | `useSearch.spec.ts` |
| `useScanner(adapter)` | `scanning`, `lastCode`, `error` | `scan()` → `adapter.scan()`（例外捕捉） | ScannerAdapter | `useScanner.spec.ts` |
| `useOcr(adapter)` | `recognizing`, `lastText`, `error` | `recognize(image?)` → `adapter.recognize()`（例外捕捉） | OcrAdapter | `useOcr.spec.ts` |

共通方針: 非同期は `loading/error` を更新し例外は `error` に格納（throw する scan/ocr は finally でフラグ解除）。
通信は Orval 生成関数のみ依存（`api/items/items`, `api/auth/auth`）。

## store（`src/stores/`）

| store | state | getters | actions |
|---|---|---|---|
| `auth`（`useAuthStore`） | `token: string\|null` | `isAuthenticated = token!==null` | `login(username,password)`→`loginApi`でtoken保存 / `logout()`→token=null |

非永続（メモリのみ）。状態遷移は `architecture/state-auth.puml`、テスト `authStore.spec.ts`。

## validator（`src/validators/`）

| validator | スキーマ | 詳細 |
|---|---|---|
| `auth` | `loginSchema` | `username` 3–20 / `password` 8–64（`detail/validation.md`） |
| `item` | `itemInputSchema` | `name`1–30 / `price` int 0–1e6 / `category` enum / `code` `^[A-Z0-9]{8}$` |

## 生成物（`src/api/`, 手書き禁止）

Orval 生成: `api/auth/auth`, `api/items/items`（operations）, `api/models/*`（型）, `*.zod.ts`, `endpoints.msw.ts`。
mutator `api/axios.ts`（手書き, `baseURL:'/api'`）。
