# テスト戦略（5層 + 生成ケース）

本PoCは「テスト自動化アプローチの比較」が目的。テストを **5層** に分け、各層のツール・対象・
ディレクトリ規約・実行コマンドを定義する。L2 と L5 は複数ツールを比較し、結論を別レポートに残す。

| 層 | 名称 | 対象 | ツール | コマンド | 自動実行 |
|---|---|---|---|---|---|
| **L1** | ロジック/ユニット | composable・validator(zod)・store・境界値ケース | Vitest (jsdom) | `npm run test:unit` | ✅ |
| **L2** | コンポーネント | 単一コンポーネント描画（例 `ItemListItem`） | Playwright CT / Vitest browser mode | `npm run test:ct` / `npm run test:browser` | ✅ |
| **L3** | レイアウト/ビジュアル回帰 | ページのスクリーンショット差分 | Playwright `toHaveScreenshot` | `npm run test:visual` | ✅ |
| **L4** | E2E | 画面遷移を伴うフロー（login/scan/CRUD） | Playwright | `npm run test:e2e` | ✅ |
| **L5** | Android スモーク | 実機/エミュレータ上の起動・主要画面 | Maestro / Appium | `npm run test:android:maestro` / `:appium` | ⚠️ 手動・環境依存 |

補助: **境界値ケース生成** `npm run gen:cases`（P4）— 設計ソース（OpenAPI + 画面項目CSV）から
正準ケース `tests/cases/*.cases.json` を生成し、L1 のデータ駆動テストが消費する。
OpenAPI と画面項目定義の差異は `docs/spec-src/reconcile.md` に出力。

## ディレクトリ規約（`frontend/`）

```
tests/
  unit/        # L1 ロジック単体（vitest, jsdom）
  cases/       # L1 データ駆動（生成 cases.json + boundary.spec.ts）
  ct/          # L2 Playwright Component Testing
  browser/     # L2 Vitest browser mode（試行・比較用）
  e2e/         # L4 Playwright E2E（smoke / login-flow / scan-flow / item-crud）
  visual/      # L3 Playwright ビジュアル回帰
    visual.spec.ts-snapshots/   # ベースライン画像（git 管理）
android-tests/ # L5 Maestro / Appium（手動）
```

vitest の対象は `tests/unit/**` と `tests/cases/**`（`vitest.config.ts`）。L2 の CT/browser は
それぞれ専用 config（`playwright-ct.config.ts` / `vitest.browser.config.ts`）で分離。
E2E と Visual は同一 `playwright.config.ts` の別プロジェクト（`--project=e2e` / `--project=visual`）。

## 決定的データ（MSW）

L2〜L4 のブラウザ実行は **MSW** で API を決定的にモックする
（`src/mocks/handlers.ts`、フィクスチャ Coffee/Sandwich/Notebook）。
これによりビジュアル回帰やフローのブレを排除する。
認証トークンは**非永続**（リロードで `/login` に戻る）ため、各テストはアプリ内遷移で完結させる。

⚠️ **MSW は Vite DEV ビルドでのみ起動**（`src/main.ts` が `import.meta.env.DEV` で分岐）。
L1〜L4 は dev サーバ/jsdom 上で動くため問題ないが、**L5（本番 Android ビルド）はモックが無い**。
L5 でデータ依存の確認をするには MSW-in-build かバックエンドが必要
（`frontend/android-tests/README.md` の「データ依存」参照）。

## ビジュアルベースラインと CI

L3 のベースライン画像は **OS / レンダラ依存**（本PoCは Windows + chromium で生成・コミット）。
別 OS の CI で実行する場合は差分が出るため、その環境でベースラインを再生成する必要がある
（`npx playwright test --project=visual --update-snapshots`）。CI 導入時はベースライン生成を
専用ジョブ/コンテナで固定すること。

## ツール比較レポート

- **L2**: [`tool-comparison-L2.md`](./tool-comparison-L2.md) — Playwright CT vs Vitest browser mode。
  両者とも動作したが、コンポーネント単位のスクショ回帰が組み込みの **Playwright CT を推奨**。
- **L5**: [`tool-comparison-L5.md`](./tool-comparison-L5.md) — Maestro vs Appium（Capacitor WebView）。
  スモーク + スクショ証跡用途では **Maestro を推奨**、厳密な DOM 操作/CI 統合なら Appium。

## ハードウェア（カメラ OCR / スキャナ）

`useOcr` / `useScanner` composable + アダプタで抽象化。L1/L2/L4 は **fake アダプタ**で自動テスト。
実機のカメラ OCR 精度・外部スキャナ/SDK 連携は**手動 + 証跡のみ**（自動化スコープ外）。

## 実行コマンド一覧

```bash
npm run test:unit            # L1（ユニット + 生成境界値ケース）
npm run test:ct              # L2 Playwright CT
npm run test:browser         # L2 Vitest browser mode
npm run test:visual          # L3 ビジュアル回帰
npm run test:e2e             # L4 E2E
npm run test:android:maestro # L5 Maestro（手動・要エミュレータ）
npm run test:android:appium  # L5 Appium（手動・要エミュレータ + Appium）
npm run gen:cases            # 境界値ケース生成（cases.json + reconcile）
npm run build                # 本番ビルド（vue-tsc + vite）
```
