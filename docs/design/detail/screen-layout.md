# 画面レイアウト定義（詳細設計）

各画面の領域構成（Ionic コンポーネント）と主要 testid。L3ビジュアル回帰の対象。実装は `frontend/src/views/`。

## ログイン（LoginPage）
- `ion-header`（title "Login"）/ `ion-content`（padding）
- Username `ion-input`（`login-username`）, Password `ion-input[type=password]`（`login-password`）, エラー（`login-error`）, `ion-button`（`login-submit`, "Sign in"）

## Items一覧（TabItemsPage）
- `ion-header`（title "Items" / 右に "New" `items-new`）
- `ion-content`: 状態出し分け — `items-loading` / `items-error` / `items-empty` / `ion-list`(`items-list`)
- リスト行 = `ItemListItem`（`item-row`, name/category/¥price）

## Item詳細（ItemDetailPage）
- `ion-header`（戻る `ion-back-button` default `/tabs/tab1`）/ 詳細表示（loading/data）

## Item登録・編集（ItemFormPage）
- `ion-header`（title "New Item"/"Edit Item" + 戻る）
- `form` > `ion-list`: Name(`item-name`) / Price(`item-price`,number) / Category(`item-category`,ion-select food/drink/other) / Code(`item-code`)
- エラー（`item-form-error`）, 送信 `ion-button`（`item-form-submit`, "Create"/"Update"）
- ion-select は既定 alert インターフェース（E2Eは open→radio→OK）

## 検索（TabSearchPage）
- 検索入力 + 結果リスト（未入力/ヒット/0件）, スキャン起動（`search-scan`）

## スキャン/OCR（ScanPage）
- スキャナ起動（`scan-scanner`）/ 結果（`scan-result`）/ 待機・読取中・成功・失敗（`state-scan.puml`）

## 設定（TabSettingsPage）
- `ion-list` + トグル/テーマ等（PoC簡易）

## タブシェル（TabsPage）
- `ion-tabs` + `ion-tab-bar`（Tab1/Tab2/Tab3, role=tab）

> 決定的データ（MSW）と `animations:'disabled'` でビジュアル回帰のブレを排除。baseline は `tests/visual/*-snapshots/`（git管理, OS依存）。
