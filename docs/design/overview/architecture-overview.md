# 方式設計・機能一覧（概要設計）

## 方式設計

- **UI**: Ionic Vue 8 + vue-router（`@ionic/vue-router`）。SPA、`createWebHistory`。
- **契約起点のコード生成**: `openapi/openapi.yaml` を単一の真実とし、Orval で
  APIクライアント（axios-functions, `tags-split`）・zodスキーマ・MSWハンドラを生成（`npm run gen`）。生成物は手で触らない。
- **HTTP**: axios。共通 mutator `src/api/axios.ts` が `baseURL: '/api'` を付与（生成URLはパスのみ）。
- **モック**: MSW + 固定フィクスチャ（`src/mocks/handlers.ts`）。**DEVビルドのみ起動**（`main.ts` が `import.meta.env.DEV` で分岐）。
- **状態管理**: Pinia（`stores/auth.ts`）。認証トークンは**非永続**（リロードで `/login`）。
- **入力検証**: zod（`validators/`）。境界値テストは TS の `gen-cases` が OpenAPI と画面項目CSVから生成（ロジックはTS一本化）。
- **デバイス機能**: カメラOCR/外付けスキャナを**抽象インターフェース＋アダプタ**で実装分離（`src/ocr` `src/scanner`、§詳細 `detail/device-interface.md`）。
- **ネイティブ**: Capacitor 5（Android）。`webDir: dist`。対象 Android 13（API 33）。
- 全体構成は `../architecture/system.puml` を参照。

## 機能一覧

| 機能ID | 概要 | 関連画面 | API |
|---|---|---|---|
| F-AUTH | ログイン（モック認証・トークン保持） | ログイン | `POST /auth/login` |
| F-ITEM-LIST | Item一覧表示（loading/empty/error/data） | Items(tab1) | `GET /items` |
| F-ITEM-DETAIL | Item詳細表示 | Item詳細 | `GET /items/{id}` |
| F-ITEM-CREATE | Item新規作成（zod検証） | Item登録 | `POST /items` |
| F-ITEM-EDIT | Item編集（zod検証） | Item編集 | `PUT /items/{id}` |
| F-ITEM-DELETE | Item削除 | Item詳細 | `DELETE /items/{id}` |
| F-SEARCH | キーワード検索 | 検索(tab2) | `GET /search?q=` |
| F-SCAN | 外付けスキャナでコード読取 → 検索へ | スキャン | （ローカル/コード検索 `GET /items?code=`） |
| F-OCR | カメラOCRでテキスト認識 → 項目入力補助 | スキャン | （ローカル） |
| F-SETTINGS | 設定（テーマ/トグル等） | 設定(tab3) | － |

スキャン/OCR の実機読取・認識精度は自動化スコープ外（手動＋エビデンス）。テストでは fake アダプタを注入。
