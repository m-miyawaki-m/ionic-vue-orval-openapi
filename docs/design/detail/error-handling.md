# エラーハンドリング方針（詳細設計）

## 方針

- **composable で捕捉**: 非同期は `try/catch` し `error`（または `loading` 解除）に反映。画面は状態で出し分け。
- **画面で表示**: loading/empty/error/data を明示的に持ち、ユーザに状態を返す（L3ビジュアル回帰の対象も兼ねる）。
- **検証エラーは送信前**: zod `safeParse` で送信前に弾き、メッセージ表示（API 呼び出し前）。

## 画面別

| 画面 | 異常系 | 表示/挙動 |
|---|---|---|
| ログイン | 入力不正 | `error='Invalid input'`（testid `login-error`） |
| ログイン | 認証API失敗 | `error='Login failed'` |
| Items一覧 | 取得失敗 | `items-error`（"Error loading items."） |
| Items一覧 | 0件 | `items-empty`（"No items found."） |
| Items一覧 | 取得中 | `items-loading`（"Loading..."） |
| Item登録/編集 | 検証失敗 | `item-form-error`（zod issues 結合） |
| スキャン/OCR | 読取/認識失敗 | composable の `error` に格納 → 失敗表示（`state-scan.puml`） |
| スキャン | 未接続/カメラ無し | `isAvailable()` false → 待機/不可表示（PoCは簡易） |

## 横断

- **認証ガード**: 未認証で保護画面へ → `/login` リダイレクト（`detail/routing.md`）。トークン非永続。
- **MSW**: DEVのみ。未ハンドルのリクエストは `onUnhandledRequest:'bypass'`（`main.ts`）。本番ビルドはモック無し
  → L5実機ではデータ依存に注意（MSW-in-build か backend が前提, `frontend/android-tests/README.md`）。
- 権限拒否（CAMERA 等）の詳細フローは PoC保留（`device-hardware.md`）。
