# 画面一覧（概要設計）

実装は `frontend/src/views/`、ルートは `detail/routing.md`、遷移は `architecture/screen-transition.puml`。

| 画面ID | 名称 | パス | コンポーネント | レイアウト類型 | 主な状態 |
|---|---|---|---|---|---|
| S-LOGIN | ログイン | `/login` | `LoginPage.vue` | フォーム中心 | 入力 / エラー（Invalid input・Login failed） |
| S-TABS | タブシェル | `/tabs/` | `TabsPage.vue` | タブナビ（3タブ） | － |
| S-ITEMS | Items一覧 | `/tabs/tab1` | `TabItemsPage.vue` | リスト | loading / empty / error / data |
| S-SEARCH | 検索 | `/tabs/tab2` | `TabSearchPage.vue` | 検索入力＋結果 | 未入力 / ヒット / 0件 |
| S-SETTINGS | 設定 | `/tabs/tab3` | `TabSettingsPage.vue` | リスト＋トグル | － |
| S-ITEM-DETAIL | Item詳細 | `/items/:id` | `ItemDetailPage.vue` | 詳細＋戻る | loading / data |
| S-ITEM-NEW | Item登録 | `/items/new` | `ItemFormPage.vue` | フォーム | 入力 / 検証エラー / 保存 |
| S-ITEM-EDIT | Item編集 | `/items/:id/edit` | `ItemFormPage.vue` | フォーム | 既存値ロード / 検証 / 更新 |
| S-SCAN | スキャン/OCR | `/scan` | `ScanPage.vue` | カメラ/スキャナ起動 | 待機 / 読取中 / 成功 / 失敗 |

認証ガード: `/tabs` `/items` `/scan` は未認証時 `/login` へリダイレクト（`detail/routing.md`）。
loading/empty/error 状態を意図的に作り込み、L3ビジュアル回帰の差分対象を豊かにする方針。
