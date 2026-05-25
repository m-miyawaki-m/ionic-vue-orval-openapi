# 実行方法まとめ（Getting Started / Runbook）

このPoCの「何を・どう実行し・結果はどこに出るか」を1か所にまとめた索引。
コマンドはすべて `frontend/` で実行（Pythonツールのみ `tools/spec-evidence/`）。

戦略の本体は Storybook の **Test Strategy** カタログ（`frontend/src/docs/*.mdx`）、
設計書は `docs/design/` と `docs/architecture/`、結果の保存先詳細は Storybook「6. 結果の確認・レポート保存先」を参照。

---

## 0. 前提・セットアップ

```bash
cd frontend
npm install
```

- Node 18+（検証は Node 24）。
- L5 Android: Android Studio + Android 13(API33) エミュレータ。Maestro / Appium は別途導入（`frontend/android-tests/README.md`）。
- Python ツール（任意）: Python 3.11+ と `openpyxl`（`pip install openpyxl`）。テストは標準 `unittest`。

---

## 1. コード生成（契約 → 生成物）

| コマンド | 何をする | 出力 |
|---|---|---|
| `npm run gen` | OpenAPI(`openapi/openapi.yaml`) から Orval で APIクライアント/zod/MSW を生成 | `src/api/**`（手書き禁止） |
| `npm run gen:cases` | 設計ソースからテストケースを生成（下記） | `tests/cases/*.cases.json` + `docs/spec-src/reconcile.md` |
| `npm run lint:openapi` | OpenAPI を redocly で lint | – |

`gen:cases` の生成物（決定論的・ルールベース）:
- `boundary.cases.json` … **境界値**(min/max±1, length±1, enum, pattern, required) ＋ **正常系代表値**(`normal`=example) ＋ **format**(現スキーマは0件)
- `combination.cases.json` … **pairwise 組み合わせ**（各項目「有効＋1誤り」の全ペア網羅, kind=combination, payload＝フルレコード）
- `doc.cases.json` … 操作(event)/状態遷移(store) ＋ **API異常系**(401/404/422, kind=api-error, ドキュメント項目のみ・自動実行なし)
- `reconcile.md` … OpenAPI と画面項目定義CSV の制約差分（現状「差異なし」）

> 生成ロジックの詳細は spec `docs/superpowers/specs/2026-05-26-gen-cases-enhancements-design.md`。

---

## 2. テスト層（実行コマンドと結果保存先）

| 層 | コマンド | 内容 | 結果の保存先 |
|---|---|---|---|
| L1 Unit | `npm run test:unit` | ロジック単体・zod・境界値/combination データ駆動 | `vitest-results/unit-{junit.xml,results.json}` ＋ ターミナル |
| L2 Component(挙動) | `npm run test:ct` | Playwright CT（ItemListItem） | `playwright-ct-report/`（`npx playwright show-report playwright-ct-report`） |
| L2 Component(挙動) | `npm run test:browser` | Vitest browser mode | `vitest-results/browser-{junit.xml,results.json}` |
| L3 Visual | `npm run test:visual` | Playwright ビジュアル回帰 | `playwright-report/`；基準画像 `tests/visual/*-snapshots/`（git管理・OS依存） |
| L4 E2E | `npm run test:e2e` | smoke / login / scan / item-crud | `playwright-report/` |
| L5 Android | `npm run test:android:maestro` / `:appium` | 実機/エミュ スモーク（**手動・環境依存**） | `android-tests/`（手順）/ 実機エビデンス |

結果の見方（Storybook非依存）:
```bash
npx playwright show-report                       # e2e/visual の HTML レポート（:9323）
npx playwright show-report playwright-ct-report  # CT の HTML レポート
```
詳細表示: `npm run test:unit -- --reporter=verbose` / `npm run test:ct -- --reporter=list`。
出力ディレクトリ（`vitest-results`/`playwright-report`/`playwright-ct-report`/`test-results`）はすべて gitignore。

> 注: Playwright は `test-results/` を実行ごとにクリーンするため、Vitest の成果物は別の `vitest-results/` に出している。

---

## 3. Storybook（テスト戦略カタログ / コンポーネント）

```bash
npm run storybook        # http://localhost:6006/ → サイドバー "Test Strategy" と "Components"
npm run build-storybook  # 静的ビルド（storybook-static/, gitignore）
```

- **Test Strategy**: Android公式5層モデル・成果物×検証マトリクス・各層のツール比較と採用理由・結果の保存先（6章）・Componentの生実例。
- **Components/ItemListItem**: 部品カタログ（drink/food/long-name）。
- MDX ソース: `frontend/src/docs/*.mdx`。

---

## 4. テスト仕様書・エビデンスExcel（Python 別ツール・任意）

`gen:cases` の `cases.json` と Vitest 結果を消費して Excel を生成（アプリと分離）。

```bash
cd tools/spec-evidence
python -m spec_evidence                       # out/ に test-spec.md / test-spec.xlsx / evidence.xlsx
python -m spec_evidence --template --feature "認証 (Items PoC)"  # out/it-confirmation-template.xlsx（IT確認書 空テンプレ）
python -m unittest discover -s tests          # ツール自体のテスト
```

- `test-spec.md/.xlsx` … テスト仕様書（1行=1項目）
- `evidence.xlsx` … エビデンス（概要/L1境界値/操作・状態遷移、実測pass/fail、手動スクショ貼付欄）
- `it-confirmation-template.xlsx` … IT確認書テンプレ 7シート（表紙/カテゴリ別/エビデンス/利用データ）。詳細 `tools/spec-evidence/README.md`。
- 出力 `out/` は gitignore。

---

## 5. ビルド・ネイティブ

```bash
npm run build                 # vue-tsc 型チェック + vite build（dist/）
npx cap sync android          # dist を Android プロジェクトへ同期
npx cap run android           # エミュレータ/実機で起動（要 Android Studio）
```

> 本番ビルドは MSW が動かない（`main.ts` が `import.meta.env.DEV` で分岐）。L5 でデータ依存の確認をするには MSW-in-build か backend が前提（`frontend/android-tests/README.md`）。

---

## 6. 一括確認（回帰チェックの目安）

```bash
cd frontend
npm run gen:cases && npm run test:unit && npm run test:e2e && npm run test:visual && npm run test:ct && npm run test:browser && npm run build && npm run build-storybook
```

すべて緑なら主要経路は健全（L5 Android のみ手動・環境依存で別）。

---

## 関連ドキュメント
- 戦略: Storybook「Test Strategy」/ `docs/test-strategy.md`（索引）
- 設計: `docs/design/`（概要/詳細）, `docs/architecture/`（PlantUML図）
- 仕様/計画: `docs/superpowers/specs/`, `docs/superpowers/plans/`
- Pythonツール: `tools/spec-evidence/README.md`
- Android手動テスト: `frontend/android-tests/README.md`
