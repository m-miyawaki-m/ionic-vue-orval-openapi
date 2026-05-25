# バリデーション定義（詳細設計）

入力検証は zod（`frontend/src/validators/`）。OpenAPI のスキーマ制約と一致させ、`gen-cases` が両者から境界値を生成し
`reconcile.md` で差分を検出する（§5-1）。L1ユニットの主対象。

## loginSchema（`validators/auth.ts`）

| 項目 | ルール | エラー時 |
|---|---|---|
| `username` | `string().min(3).max(20)` | LoginPage が「Invalid input」表示 |
| `password` | `string().min(8).max(64)` | 同上 |

ログイン送信時 `loginSchema.safeParse` → 失敗で `error='Invalid input'`、成功で `auth.login()`。
API失敗時は `error='Login failed'`（`detail/error-handling.md`）。

## itemInputSchema（`validators/item.ts`）

| 項目 | ルール | 備考 |
|---|---|---|
| `name` | `string().min(1).max(30)` | |
| `price` | `number().int().min(0).max(1000000)` | フォームは文字列→`Number()`変換後に検証 |
| `category` | `enum(['food','drink','other'])` | ion-select |
| `code` | `string().regex(/^[A-Z0-9]{8}$/)` | 8桁英数大文字 |

ItemFormPage が `itemInputSchema.safeParse` → 失敗で `formError`（issues.message を結合表示, testid `item-form-error`）、
成功で `save()` → `/tabs/tab1` へ。

## OpenAPI との対応（整合の単一根拠）

| 項目 | zod | OpenAPI |
|---|---|---|
| username | 3–20 | minLength3/maxLength20 |
| password | 8–64 | minLength8/maxLength64 |
| name | 1–30 | minLength1/maxLength30 |
| price | int 0–1e6 | integer minimum0/maximum1000000 |
| category | enum 3値 | enum food/drink/other |
| code | `^[A-Z0-9]{8}$` | 同 pattern |

`gen-cases` は OpenAPI由来(`bnd:openapi:*`)と画面項目CSV由来(`bnd:field-spec:*`)の境界値を出力し、同一項目で制約が食い違う箇所を
`docs/spec-src/reconcile.md` に警告（現状「差異なし」）。
