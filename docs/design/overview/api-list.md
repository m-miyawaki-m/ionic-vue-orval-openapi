# API一覧（概要設計）

単一の真実 = `openapi/openapi.yaml`（server `/api`）。本表は契約由来（自動追従の対象）。
クライアントは Orval 生成（`src/api/`, `tags-split`）、mutator が `baseURL:'/api'` を付与。

| operationId | メソッド/パス | パラメータ | 入力 | 出力 | 使用 composable |
|---|---|---|---|---|---|
| `login` | POST `/auth/login` | － | `LoginRequest` | `LoginResponse`(200) | `stores/auth.ts` |
| `listItems` | GET `/items` | query `q?`(maxLen50), `code?`(`^[A-Z0-9]{8}$`) | － | `Item[]`(200) | `useItems` |
| `createItem` | POST `/items` | － | `ItemInput` | `Item`(201) | `useItem.save` |
| `getItem` | GET `/items/{id}` | path `id`(int64) | － | `Item`(200) | `useItem.loadItem` |
| `updateItem` | PUT `/items/{id}` | path `id`(int64) | `ItemInput` | `Item`(200) | `useItem.save` |
| `deleteItem` | DELETE `/items/{id}` | path `id`(int64) | － | （204 No Content） | `useItem.remove` |
| `searchItems` | GET `/search` | query `q`(**required**, 1–50) | － | `Item[]`(200) | `useSearch` |

## スキーマ制約（境界値テストのソース）

| スキーマ.項目 | 型 | 制約 |
|---|---|---|
| `LoginRequest.username` | string | minLength 3 / maxLength 20 |
| `LoginRequest.password` | string | minLength 8 / maxLength 64 |
| `LoginResponse.token` | string | required |
| `ItemInput.name` | string | minLength 1 / maxLength 30 |
| `ItemInput.price` | integer | minimum 0 / maximum 1000000 |
| `ItemInput.category` | string(enum) | `food` / `drink` / `other` |
| `ItemInput.code` | string | pattern `^[A-Z0-9]{8}$` |
| `Item` | object | `ItemInput` + `id`(int64, required) |

これらの制約から `gen-cases` が境界値ケース（`bnd:openapi:*`）を生成し、画面項目定義CSV由来（`bnd:field-spec:*`）と
`reconcile.md` で整合チェックする（§5-1）。
