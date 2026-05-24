# ionic-vue-orval-openapi PoC 設計書

- 日付: 2026-05-25
- 位置づけ: **完全独立の実験場**（既存 `ionic-sample-orval` は参考のみ。資産は流用せず白紙から構築）
- 目的: OpenAPI契約だけを起点に Ionic Vue + Orval + Capacitor 5 の Android アプリ PoC を作り、
  **テスト自動化（UI/コンポーネント/レイアウト/画面表示=スクショ）** の手法を比較検証する。
- コスト方針: **すべてローカル完結・OSS無料**。有料クラウド層（Chromatic / Cypress Cloud / Maestro Cloud）は使わない。

---

## 1. 技術スタック

| 領域 | 採用 | バージョン目安 |
|---|---|---|
| UIフレームワーク | Ionic Vue | 8.x |
| ルーティング | @ionic/vue-router / vue-router | 4.x |
| ネイティブ | Capacitor (Android) | 5.7.x |
| コード生成 | Orval | 8.x（axios-functions + zod + msw） |
| HTTP | axios | 1.x |
| 単体/L1・L2 | Vitest（+ browser mode） | 最新安定 |
| コンポーネント比較 | Playwright Component Testing | 最新安定 |
| E2E/ビジュアル | Playwright（`toHaveScreenshot`） | 最新安定 |
| コンポーネント設計書 | Storybook（軽め導入） | 8.x |
| Android スモーク | Maestro / Appium（比較） | 最新安定 |
| 仕様書/Excel生成 | **Python + openpyxl**（アプリと分離した別ツール・任意） | Python 3.11+ |
| モック | MSW（orval生成）+ 固定フィクスチャ | 最新安定 |
| カメラ/OCR | Capacitor Camera + OCR（抽象化アダプタ経由・エンジン未定） | – |
| バーコード/QRスキャナー | 外付け機器（連携方式未定: HID/SDK/BT を抽象化） | – |

対象端末: **Android 13（API 33）のみ**。内部カメラを OCR に、外付けバーコード/QRスキャナーを読取に使用する想定。
スキャナー連携方式は未定のため、デバイス機能は抽象インターフェース（composable + アダプタ）で実装と分離する（§4-1, §5-3）。

前提: Node 18+、Python 3.11+（仕様書/Excelツール用・任意）、Android Studio + エミュレータ（L5用）、Windows 環境。

---

## 2. リポジトリ構成

```
ionic-vue-orval-openapi/
├─ openapi/
│   └─ openapi.yaml                 # 唯一の契約（真実）
├─ docs/
│   ├─ design/                      # 一般設計書（§7 設計書一覧）
│   │   ├─ overview/                # 概要設計（*.md）
│   │   └─ detail/                  # 詳細設計（*.md）
│   ├─ architecture/*.puml          # 図（構成/遷移/シーケンス/状態遷移/ツリー）
│   ├─ spec-src/                    # テスト仕様書の設計ソース（人が書く・機械可読）
│   │   ├─ field-spec/<画面>.csv    # 画面項目定義書 ＝ 境界値ソースB
│   │   ├─ event-spec/<画面>.csv    # イベント定義 → 操作系テスト項目
│   │   ├─ store-spec/<store>.csv   # ストア定義 → 状態遷移テスト項目
│   │   └─ reconcile.md             # OpenAPI vs CSV 整合性レポート(自動)
│   ├─ openapi-contract.md
│   ├─ test-strategy.md
│   ├─ boundary-cases.md
│   ├─ evidence-format.md
│   ├─ tool-comparison-L2.md
│   ├─ tool-comparison-L5.md
│   ├─ getting-started.md
│   └─ superpowers/specs/           # 本設計書・実装計画
├─ frontend/
│   ├─ src/
│   │   ├─ api/                      # ← orval生成物（手書き禁止）
│   │   │   ├─ index.ts / models/ / *.zod.ts / endpoints.msw.ts
│   │   │   └─ axios.ts              # mutator（手書き）
│   │   ├─ views/                    # 画面
│   │   ├─ components/               # 再利用UI部品（+ *.stories.ts）
│   │   ├─ composables/              # ロジック（L1対象）
│   │   ├─ validators/               # 画面項目バリデータ（CSV由来, L1対象）
│   │   ├─ router/  stores/
│   │   └─ mocks/                    # MSWハンドラ + 固定フィクスチャ
│   ├─ tests/
│   │   ├─ unit/                     # L1 Vitest
│   │   ├─ cases/                    # 生成された正準ケース表 *.cases.json + データ駆動テスト
│   │   ├─ component-vitest/         # L2: Vitest browser mode
│   │   ├─ component-pw/             # L2: Playwright CT
│   │   ├─ visual/                   # L3: Playwright toHaveScreenshot（baseline をgit管理）
│   │   ├─ e2e/                      # L4: Playwright
│   │   └─ android/                  # L5: maestro/ と appium/
│   ├─ .storybook/
│   ├─ android/                      # Capacitor生成
│   ├─ orval.config.ts  capacitor.config.ts
│   ├─ playwright.config.ts  vitest.config.ts
│   └─ package.json
├─ scripts/
│   ├─ gen-cases/                    # [TS] 正準ケース生成（OpenAPI + 各種定義 → cases.json + 実行テスト）
│   └─ start-*.cmd                   # dev/mock 起動
├─ tools/
│   └─ spec-evidence/                # [Python・任意] cases.json + テスト結果 → 仕様書/エビデンスExcel
│       ├─ pyproject.toml  README.md
│       └─ src/                      # openpyxl で xlsx 生成
└─ .vscode/extensions.json
```

---

## 3. コード生成パイプライン（OpenAPI → Orval）

`openapi.yaml` を単一の真実として、`npm run gen` で3種生成:

1. **APIクライアント**: `axios-functions`、`tags-split`、共通 mutator `src/api/axios.ts` 経由
2. **zodスキーマ**: 入出力検証（フォーム/レスポンス検証 = L1・境界値テスト対象）
3. **MSWハンドラ**: 固定フィクスチャと組み合わせ、全テスト層に決定的データを供給

生成物は手で触らない。契約変更時は再生成して追従する。

---

## 4. アプリのスコープ（画面・契約）

| 画面 | レイアウト類型 | 主な状態 |
|---|---|---|
| ログイン | フォーム中心 | 入力検証・エラー・送信中 |
| タブシェル（3タブ） | タブナビ | – |
| Items一覧（タブ1） | リスト＋pull-to-refresh | loading / empty / error / data |
| Item詳細 | 詳細＋戻る | loading / data |
| Item登録・編集 | フォーム（モーダル） | 検証・保存中 |
| 検索（タブ2） | 検索入力＋結果 | 未入力 / ヒット / 0件 |
| スキャン/OCR（タブ2内 or 検索） | カメラOCR起動・外付けスキャナー入力 | 待機 / 読取中 / 成功 / 失敗 / 権限拒否 |
| 設定（タブ3） | リスト＋トグル/テーマ | – |

OpenAPI契約: `auth(login)` + `items` CRUD + `search` の最小構成。
スキャン/OCR結果はコード検索（例: `GET /items?code=` 相当）に流し込む。
loading/empty/error 状態を意図的に作り込み、ビジュアル回帰の差分対象を豊かにする。

### 4-1. ハードウェア依存機能（カメラOCR・外付けスキャナー）

対象端末は Android 13 のみ。デバイス機能は**抽象インターフェース**で実装と分離する。

- `useScanner` … 外付けバーコード/QRスキャナー入力の抽象（連携方式 HID/SDK/BT は未定 → アダプタ差替）
- `useOcr` … 内部カメラ + OCR の抽象（OCRエンジン未定 → アダプタ差替）

アプリ本体はこのインターフェースだけに依存。具体実装が未定でも設計・テストを進められ、テストではフェイクアダプタに差し替える（§5-3）。

---

## 5. テスト戦略（5層）

| 層 | ツール | 内容 | スクショ |
|---|---|---|---|
| L1 ロジック単体 | Vitest | composables・zod検証・mutator・**自動生成された境界値テスト** | – |
| L2 コンポーネント | **Vitest browser mode** vs **Playwright CT**（比較） | 同一コンポーネントを両方で実装し比較 | △ |
| L3 レイアウト/ビジュアル回帰 | Playwright `toHaveScreenshot` + Storybook stories | 各 story を複数ビューポートでピクセル差分。baseline は git 管理 | ◎ |
| L4 E2Eフロー | Playwright | MSWで全画面通し操作（ログイン→一覧→詳細→登録） | ○ |
| L5 Androidスモーク | **Maestro** vs **Appium**（比較） | エミュレータで起動〜主要画面のスクショ | ◎ |

全層 **MSW + 固定フィクスチャ**で決定的化。
比較の成果は `tool-comparison-L2.md` / `tool-comparison-L5.md` に記録する。

### 5-1. テスト仕様書とケースの自動生成（設計ソース → 正準JSON）

[TS] `scripts/gen-cases` が複数の設計ソースを読み、**正準ケース表 `tests/cases/*.cases.json`** を出力する。
このJSONが「実行テスト」と「仕様書/Excel」両方の単一の真実になる。

設計ソースと生成されるテスト観点:

| ソース | 場所 | 生成される観点 |
|---|---|---|
| OpenAPI 契約 | `openapi.yaml` | API契約レベルの境界値 |
| 画面項目定義 | `docs/spec-src/field-spec/<画面>.csv` | 画面レベルの入力検証・境界値 |
| イベント定義 | `docs/spec-src/event-spec/<画面>.csv` | 操作系（イベント発火 → 期待結果・画面遷移） |
| ストア定義 | `docs/spec-src/store-spec/<store>.csv` | 状態遷移（action → state、初期値・不変条件） |

境界値の導出ルール（項目定義・OpenAPI共通）:
- `minimum/maximum` → 下限-1(NG)/下限(OK)/上限(OK)/上限+1(NG)
- `minLength/maxLength` → 文字数で同様の4点
- `enum` → 各有効値 + 無効値1
- `pattern` / `format` → 一致(OK) / 不一致(NG)
- `required` → 有/無

CSV列例（画面項目定義）: `画面ID, 項目ID, 項目名, 型, 必須, 最小値, 最大値, 最小桁, 最大桁, 形式, 選択肢, 備考`

出力:
1. `tests/cases/*.cases.json` … 全テスト項目の正準データ（ソース種別・観点タグ付き）
2. データ駆動 Vitest（`test.each`）… 境界値/操作のうち実行可能なものを生成zod・画面バリデータ・storeで検証
3. **整合性レポート** `docs/spec-src/reconcile.md` … 同一項目で OpenAPI と 画面項目定義 の制約が食い違う箇所を警告

手書き追加ケースを `tests/cases/*.manual.yaml` でマージ可能。設計ソース変更時は再生成で追従。
境界値ロジックは TS 側に一本化し、Python ツール（5-2）はこの `cases.json` を消費するだけ（二重化を回避）。

### 5-2. テスト仕様書・エビデンスExcelの自動出力（Python 別ツール・任意）

[Python・任意] `tools/spec-evidence`（openpyxl）が `tests/cases/*.cases.json` と
テスト結果（Vitest/Playwright の JSON/JUnit）を読み、アプリとは分離した別ツールとして xlsx/md を生成する。

- **テスト仕様書**（`.xlsx` / `.md`）: 1行 = 1テスト項目
  `ID / 画面 / 観点(境界値・操作・状態遷移) / 前提 / 操作・入力 / 期待結果`
- **エビデンスExcel**（`.xlsx`）: 仕様書 + 実測結果を結合
  `… / 実測(pass-fail) / 実行日時 / スクショ貼付欄(広い空セル・行高調整済)`
  - シート: 概要 / L1境界値 / 操作・状態遷移 / L3画面表示 / L5 Android など
  - **スクショは手動貼付**前提でセルを用意。画像ファイルパスを備考列に自動記載して貼付を補助
  - （将来オプション）openpyxl で Playwright/Maestro 画像の自動埋め込みに拡張可能
- アプリのビルド/テスト実行とは独立に動かせる「＋オプション」。CI でも単独実行可能。

### 5-3. ハードウェア依存機能のテスト方式（カメラOCR・外付けスキャナー）

連携方式・OCRエンジンが未定でも進められるよう、§4-1 の抽象インターフェースを前提にする。

| テスト方式 | 対象 | スキャナー(SDK連携) | カメラOCR | 自動/手動 |
|---|---|---|---|---|
| アダプタをフェイク差替（L1/L2/L4） | 結果注入でロジック・画面反映・フロー | ◎（HIDならキー入力もシミュレート可） | ◎（「画像→期待テキスト」を固定化） | 自動 |
| OCRゴールデンテスト | 認識ロジック部 | – | ◎（OCRエンジンをモックし入出力固定） | 自動 |
| エミュレータ・スモーク（L5） | 起動UI・画面スクショ | ✕（外付け機器不可） | △（仮想シーン/画像注入で画面確認は可、認識精度は不可） | 自動 |
| 実機手動 + エビデンス | 実読取・認識精度・SDK連携・速度 | ◎（実機必須） | ◎（実機必須） | 手動（スクショ貼付） |

方針:
- **SDK連携（外付けスキャナー）**: エミュレータ検証不可 → 自動はフェイクアダプタまで、実連携は実機手動エビデンス。
- **カメラOCR**: 認識ロジックは「画像→期待テキスト」をモックで固定すれば自動化可能。実認識精度は ML 依存のため実機手動。
  認識サンプルは クリア/ぼけ/傾き/低照度 のセットを用意し、手動テスト仕様書の観点にする。
- 実機手動テストの項目も `tools/spec-evidence` の仕様書/エビデンスExcelに「手動」区分で含める。

---

## 6. VSCode 推奨拡張（`.vscode/extensions.json`）

| 拡張 | 用途 |
|---|---|
| `Vue.volar` | Vue3 公式（TS/テンプレート補完） |
| `ms-playwright.playwright` | Playwright 実行/デバッグ/スクショ確認 |
| `vitest.explorer` | Vitest をエディタ内実行 |
| `dbaeumer.vscode-eslint` | Lint |
| `42Crunch.vscode-openapi` | OpenAPI 編集/プレビュー/Lint |
| `redhat.vscode-yaml` | YAML 補完・スキーマ検証 |
| `jebbs.plantuml` | 設計書(.puml) プレビュー |
| `streetsidesoftware.code-spell-checker` | スペルチェック（任意） |

Android エミュレータ操作は Android Studio 側。Maestro/Storybook は専用拡張不要。

---

## 7. 設計書一覧（概要設計・詳細設計）

一般的なフロントエンド設計書として一式を用意する。すべてがテスト自動化に使われるわけではなく、
**テスト利用**列で関与度を示す（◎=主要ソース / ○=参考に利用 / △=間接 / －=一般設計書として用意のみ）。
形式: `md`=Markdown、`puml`=PlantUML図、`csv`=機械可読定義（テスト源）。

### 7-1. 概要設計（`docs/design/overview/`, 図は `docs/architecture/`）

| 設計書 | 粒度・内容 | 形式 | テスト利用 |
|---|---|---|---|
| システム概要・全体構成図 | アプリ/コード生成/モックの全体構成、配置 | puml/md | － |
| 方式設計 | 技術選定、コード生成方式、テスト方式の方針 | md | － |
| 画面一覧 | 画面ID・名称・概要・URL | md/csv | △ |
| 画面遷移図 | 画面間の遷移とトリガ | puml | ○（L4導線の根拠） |
| 機能一覧 | 機能ID・概要・関連画面 | md | － |
| API一覧 | エンドポイント一覧（OpenAPI由来・自動） | md | ◎（契約） |
| データモデル概要 | 主要エンティティと関連 | puml/md | － |
| 利用端末・ハードウェア構成書 | Android 13、内部カメラ=OCR、外付けバーコード/QRスキャナー | md | △ |
| デバイス連携方式比較 | スキャナー連携候補（HID/SDK/BT）・未定の比較 | md | － |
| 非機能要件（PoC簡易） | 対応端末・性能・制約 | md | － |

### 7-2. 詳細設計（`docs/design/detail/`, 図は `docs/architecture/`, 定義は `docs/spec-src/`）

| 設計書 | 粒度・内容 | 形式 | テスト利用 |
|---|---|---|---|
| 画面レイアウト定義 | 領域構成・ワイヤー | md/png | ○（L3観点） |
| **画面項目定義書** | 項目・型・必須・桁/範囲・形式・選択肢 | csv | ◎（境界値） |
| **イベント定義書** | イベント・契機・処理・画面遷移 | csv | ◎（操作系） |
| **ストア定義書** | state/getters/actions・初期値・不変条件 | csv | ◎（状態遷移） |
| バリデーション定義 | 入力規則・エラーメッセージ対応 | csv/md | ◎ |
| メッセージ一覧 | メッセージID・文言・種別 | csv/md | △ |
| コンポーネント一覧 | 再利用UI部品の一覧と責務 | md | － |
| コンポーネントツリー | 画面→子コンポーネントの階層 | puml/md | △（L2観点） |
| コンポーネント定義 | props/emits/slots・状態・依存 | md | ○（L2観点） |
| クラス/モジュール一覧 | composable/service/store の一覧 | md | － |
| クラス定義 | 各関数の責務・入出力・依存関係 | md | ○（L1観点） |
| ルーティング定義 | path・guard・params | md | △ |
| デバイス抽象化I/F設計 | `useScanner`/`useOcr` のインターフェースとアダプタ差替 | md | ○（フェイク差替） |
| 権限設計 | Androidパーミッション（CAMERA等）・ランタイム権限フロー | md | △ |
| OCR項目マッピング定義 | 認識テキスト→画面項目の対応・整形ルール | csv/md | ○ |
| シーケンス図 | ログイン / データ取得(MSW) / 登録・更新 / カメラOCR / スキャナー入力 | puml | ○（L4導線） |
| 状態遷移図 | ストア・画面・スキャン(待機/読取/成功/失敗)の状態遷移 | puml | ○ |
| エラーハンドリング方針 | 例外・エラー表示・権限拒否/カメラ無し/認識失敗/スキャナー未接続 | md | △ |

### 7-3. テスト・PoC関連ドキュメント

| ドキュメント | 内容 |
|---|---|
| `openapi-contract.md` | 契約とスキーマ制約の説明 |
| `test-strategy.md` | 5層テストの方針とディレクトリ規約 |
| `boundary-cases.md` | 境界値生成ルール（§5-1） |
| `evidence-format.md` | テスト仕様書・エビデンスExcel様式（§5-2） |
| `spec-src/reconcile.md` | OpenAPI と画面項目定義の整合性レポート（自動） |
| `tool-comparison-L2.md` / `tool-comparison-L5.md` | 比較結果レポート（実験場の成果） |
| `getting-started.md` | セットアップ（Node / Python / Android SDK / Windows 留意点） |

> 注: ◎/○ のものは §5-1 の `gen-cases` が機械可読ソース（csv/OpenAPI）として消費する。
> △/－ は人間向けの設計書として整備し、テスト生成には使わない。

---

## 8. 成功基準（PoC完了の定義）

1. `npm run gen` で OpenAPI から API/zod/MSW が再生成できる
2. `npm run gen:cases` で OpenAPI・画面項目・イベント・ストアの各定義から正準 `cases.json` + データ駆動テストが生成され、Vitest が緑
3. `reconcile.md` に OpenAPI と画面項目定義の制約差分が出力される
4. L2 で Vitest browser mode と Playwright CT の両実装が動き、比較レポートがある
5. L3 ビジュアル回帰がローカル baseline で差分検出できる
6. L4 E2E が MSW で主要フローを通す
7. L5 でエミュレータ主要画面のスクショが撮れる（Maestro/Appium 両方）+ 比較レポート
8. Python 別ツール `tools/spec-evidence` が `cases.json` + テスト結果から **テスト仕様書** と **エビデンスExcel**（手動スクショ貼付欄付き）を出力できる
9. カメラOCR・スキャナーが `useOcr`/`useScanner` で抽象化され、フェイクアダプタで L1/L2/L4 の自動テストが通る（実機読取は手動エビデンス）
10. 設計書一式が揃う

---

## 9. スコープ外（YAGNI）

- 本物のバックエンド実装（契約=openapi.yaml のみ）
- 認証の本格実装（ログインはモック応答で可）
- iOS 対応（**Android 13 のみ**）
- 外付けスキャナー連携方式の確定実装（HID/SDK/BT は未定・抽象化のみ）
- 実機ハードウェアの自動テスト（カメラOCR認識精度・外付けスキャナー実連携・SDK）は**手動＋エビデンス**で対応
- 有料クラウド層（Chromatic / Cypress Cloud / Maestro Cloud）
- CI 構築は本PoCでは任意（ローカル完結を優先。設定例の提示に留める）
