# 設計ドキュメント一覧（P6）

spec §7 の設計書インベントリ。本PoCの実装（`frontend/src`）と OpenAPI 契約から導出した設計書を整備する。
**テスト利用**列は spec §7 の関与度（◎=主要ソース / ○=参考 / △=間接 / －=一般設計書）。
状態列: ✅=本ドキュメントとして整備済み / 📄=機械可読ソース（既存, `docs/spec-src/`）/ ⏳=PoC保留。

> テスト戦略そのものは Storybook の **Test Strategy** カタログ（`frontend/src/docs/*.mdx`）と
> `docs/test-strategy.md` が単一ソース。本ディレクトリは「アプリ製造の設計書」を扱う。

## 概要設計（`overview/`, 図は `architecture/`）

| 設計書 | 形式 | テスト利用 | 状態 |
|---|---|---|---|
| システム概要・全体構成図 | puml | － | ✅ `architecture/system.puml` |
| 方式設計 | md | － | ✅ `overview/architecture-overview.md` |
| 画面一覧 | md | △ | ✅ `overview/screen-list.md` |
| 画面遷移図 | puml | ○ | ✅ `architecture/screen-transition.puml` |
| 機能一覧 | md | － | ✅ `overview/architecture-overview.md`（機能節） |
| API一覧 | md | ◎（契約） | ✅ `overview/api-list.md` |
| データモデル概要 | md | － | ✅ `overview/data-model.md` |
| 利用端末・ハードウェア構成書 | md | △ | ✅ `overview/device-hardware.md` |
| デバイス連携方式比較（HID/SDK/BT） | md | － | ✅ `overview/device-hardware.md`（比較節） |
| 非機能要件（PoC簡易） | md | － | ⏳ PoC保留（対応端末/制約は device-hardware に記載） |

## 詳細設計（`detail/`, 図は `architecture/`, 定義は `docs/spec-src/`）

| 設計書 | 形式 | テスト利用 | 状態 |
|---|---|---|---|
| 画面レイアウト定義 | md | ○ | ✅ `detail/screen-layout.md` |
| 画面項目定義書 | csv | ◎（境界値） | 📄 `docs/spec-src/field-spec/` |
| イベント定義書 | csv | ◎（操作系） | 📄 `docs/spec-src/event-spec/` |
| ストア定義書 | csv | ◎（状態遷移） | 📄 `docs/spec-src/store-spec/` |
| バリデーション定義 | md | ◎ | ✅ `detail/validation.md` |
| メッセージ一覧 | md | △ | ⏳ PoC保留 |
| コンポーネント一覧 | md | － | ✅ `detail/components.md` |
| コンポーネントツリー | puml | △ | ✅ `architecture/component-tree.puml` |
| コンポーネント定義 | md | ○ | ✅ `detail/components.md` |
| クラス/モジュール一覧 | md | － | ✅ `detail/modules.md` |
| クラス定義 | md | ○ | ✅ `detail/modules.md` |
| ルーティング定義 | md | △ | ✅ `detail/routing.md` |
| デバイス抽象化I/F設計 | md | ○ | ✅ `detail/device-interface.md` |
| 権限設計（Androidパーミッション） | md | △ | ⏳ PoC保留（CAMERA前提のみ device-hardware に記載） |
| OCR項目マッピング定義 | csv/md | ○ | ⏳ PoC保留（OCRエンジン未定のため） |
| シーケンス図 | puml | ○ | ✅ `architecture/sequence-*.puml` |
| 状態遷移図 | puml | ○ | ✅ `architecture/state-*.puml` |
| エラーハンドリング方針 | md | △ | ✅ `detail/error-handling.md` |

## 図（`architecture/`, PlantUML）

`system.puml` / `screen-transition.puml` / `component-tree.puml` /
`sequence-login.puml` / `sequence-items.puml` / `sequence-item-crud.puml` / `sequence-scan-ocr.puml` /
`state-auth.puml` / `state-scan.puml`

> 注: ◎/○ で csv のものは `gen-cases` が機械可読ソースとして消費する（§5-1）。⏳ は OCRエンジン/スキャナ連携方式が
> 未定、または PoC スコープ外のため保留（spec §9 YAGNI）。
