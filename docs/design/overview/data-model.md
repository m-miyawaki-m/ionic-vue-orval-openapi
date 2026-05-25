# データモデル概要（概要設計）

OpenAPI スキーマ由来（`openapi/openapi.yaml` → Orval 生成 `src/api/models/`）。エンティティは最小構成。

## Item / ItemInput

`Item` = `ItemInput` + `id`。作成/更新は `ItemInput`、取得/一覧は `Item`。

| フィールド | 型 | 制約 | 備考 |
|---|---|---|---|
| `id` | integer(int64) | required（Itemのみ） | サーバ採番。MSWは作成時 `id:999` を返す |
| `name` | string | 1–30文字 | 商品名 |
| `price` | integer | 0–1,000,000 | 円 |
| `category` | enum | `food`/`drink`/`other` | |
| `code` | string | `^[A-Z0-9]{8}$` | 8桁英数大文字。スキャン/コード検索キー |

生成モデル: `models/item.ts`, `models/itemInput.ts`, `models/itemInputCategory.ts`。

## 認証

| スキーマ | フィールド | 制約 |
|---|---|---|
| `LoginRequest` | `username` | 3–20文字 |
| | `password` | 8–64文字 |
| `LoginResponse` | `token` | string（非永続でメモリ保持） |

生成モデル: `models/loginRequest.ts`, `models/loginResponse.ts`。

## クエリパラメータ型

`listItemsParams`(`q?`,`code?`), `searchItemsParams`(`q` required) も生成される。

固定フィクスチャ（`src/mocks/fixtures`）: Coffee(drink/¥350) / Sandwich(food/¥480) / Notebook(other/¥220)。
全テスト層に決定的データを供給する。
