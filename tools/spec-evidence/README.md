# spec-evidence (P5)

アプリと分離した Python 別ツール。`gen-cases` が出す `cases.json` と Vitest のテスト結果を消費し、
**テスト仕様書**（Markdown / Excel）と**エビデンス Excel**（実測 pass/fail ＋ 手動スクショ貼付欄付き）を生成する。
境界値などの導出ロジックは TS 側（`frontend/scripts/gen-cases`）に一本化しており、本ツールは**消費専用**（二重化しない）。

## 必要環境

- Python 3.11+
- `openpyxl`（`pip install openpyxl`）
- テストは標準 `unittest`（追加インストール不要）

## 入力

- `frontend/tests/cases/boundary.cases.json`（境界値ケース）
- `frontend/tests/cases/doc.cases.json`（操作・状態遷移ケース）
- `frontend/vitest-results/unit-results.json`（Vitest JSON。`npm run test:unit` で生成）
  - 境界値ケースは `boundary.spec.ts` の `test.each` タイトル＝ケースID なので、結果とケースを ID で突合して実測 pass/fail を埋める。

## 実行

```bash
cd tools/spec-evidence
python -m spec_evidence                       # 既定パス（frontend の cases + vitest-results）で out/ に生成
python -m spec_evidence --out-dir out \
  --results ../../frontend/vitest-results/unit-results.json \
            ../../frontend/vitest-results/browser-results.json
```

出力（`out/`, gitignore）:

- `test-spec.md` / `test-spec.xlsx` … テスト仕様書（1行=1項目: ID / 画面 / 観点 / 前提 / 操作・入力 / 期待結果）
- `evidence.xlsx` … エビデンス。シート `概要` / `L1境界値` / `操作・状態遷移`。
  各行に `実測(pass/fail/—)` / `実行日時` / **`スクショ貼付欄`（空セル・行高拡大）** / `画像パス`。
  スクショは手動で貼り付ける運用（画像パス列に `out/screenshots/{id}.png` の規約を記載）。

## テスト

```bash
cd tools/spec-evidence
python -m unittest discover -s tests -v
```

## 位置づけ

- アプリのビルド/テストとは独立に動く「＋オプション」ツール。CI でも単独実行可能。
- 将来: Playwright(e2e/visual) の結果や Android スクショの自動埋め込みに拡張可能。
