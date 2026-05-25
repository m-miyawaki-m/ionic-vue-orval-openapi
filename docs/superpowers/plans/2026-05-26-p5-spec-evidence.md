# P5: テスト仕様書・エビデンスExcel生成ツール Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:test-driven-development。各タスクは failing test → 実装 → green → commit。

**Goal:** `cases.json`（境界値＋操作/状態）とテスト結果（Vitest JSON）を消費し、**テスト仕様書**（md/xlsx）と**エビデンスExcel**（実測pass/fail＋手動スクショ貼付欄付き）を生成する、アプリと分離したPython別ツール `tools/spec-evidence` を作る。

**Architecture:** 純Python。依存は `openpyxl` のみ（導入済み）。テストは標準 `unittest`（追加インストール不要）。境界値ロジックはTS側(`gen-cases`)に一本化済みなので、本ツールは**消費専用**（ロジック非重複, 仕様 §5-1/§5-2）。

**Tech Stack:** Python 3.12 / openpyxl 3.1.5 / unittest。

**確定した入力構造（実データで確認済み）:**
- `frontend/tests/cases/boundary.cases.json`: 配列56件。各 `{id, source, kind:"boundary", group, field, value, expectValid, label}`。例 id=`bnd:openapi:item:name:minLength-1`。
- `frontend/tests/cases/doc.cases.json`: 配列5件。各 `{id, source, kind:"operation"|"state", group, description, precondition, action, expected}`。
- `frontend/vitest-results/unit-results.json`: Vitest JSON。`{numTotalTests,... , testResults:[{name, assertionResults:[{title, fullName, status, duration, failureMessages}]}]}`。**境界値ケースは `boundary.spec.ts` で `test.each` のタイトル＝ケースID**なので、`assertionResults[].title === case.id` でJOINして pass/fail を得る。

**出力（`tools/spec-evidence/out/` 既定, gitignore）:**
- `test-spec.md` / `test-spec.xlsx`: 1行=1項目。列 `ID / 画面 / 観点 / 前提 / 操作・入力 / 期待結果`。
- `evidence.xlsx`: 仕様＋実測。シート `概要 / L1境界値 / 操作・状態遷移`。列に `実測(pass/fail/—) / 実行日時 / スクショ貼付欄(広い空セル・行高up) / 画像パス備考`。

---

## ファイル構成

```
tools/spec-evidence/
  pyproject.toml                 # name, requires openpyxl, console script spec-evidence
  README.md
  spec_evidence/
    __init__.py
    model.py                     # TestItem dataclass + 観点ラベル変換
    cases.py                     # load_cases(boundary_path, doc_path) -> list[TestItem]
    results.py                   # load_vitest_results(paths) -> {title: {status, duration}}; join
    spec_doc.py                  # write_spec_md(items, path), write_spec_xlsx(items, path)
    evidence.py                  # write_evidence_xlsx(items, results, run_time, path)
    cli.py                       # argparse → 上記を呼ぶ
    __main__.py                  # python -m spec_evidence == cli.main()
  tests/
    __init__.py
    fixtures/                    # 小さな cases/results のサンプルJSON
    test_cases.py
    test_results.py
    test_spec_doc.py
    test_evidence.py
  out/                           # 生成物（gitignore）
```
ルート `.gitignore` に `tools/spec-evidence/out/` を追加。テスト実行: `cd tools/spec-evidence && python -m unittest discover -s tests`。

---

## Task 1: パッケージ雛形 + model

- [ ] `pyproject.toml`（`[project] name="spec-evidence" version="0.1.0" requires-python=">=3.11" dependencies=["openpyxl>=3.1"]`、`[project.scripts] spec-evidence="spec_evidence.cli:main"`）, `README.md`, `spec_evidence/__init__.py`, `tests/__init__.py` を作成。
- [ ] `spec_evidence/model.py`:
```python
from dataclasses import dataclass, field

KIND_LABEL = {"boundary": "境界値", "operation": "操作", "state": "状態遷移"}

@dataclass
class TestItem:
    id: str
    screen: str            # = group
    perspective: str       # 観点 (KIND_LABEL)
    precondition: str
    action: str            # 操作・入力
    expected: str          # 期待結果

def kind_label(kind: str) -> str:
    return KIND_LABEL.get(kind, kind)
```
- [ ] failing test `tests/test_cases.py::test_kind_label` → `kind_label("boundary")=="境界値"` 等。実装→green→commit `feat(p5): package skeleton + TestItem model`。

## Task 2: cases ローダ（boundary + doc → TestItem）

- [ ] `tests/fixtures/boundary.sample.json`（2件: 1 valid, 1 invalid）, `doc.sample.json`（1 operation, 1 state）。
- [ ] failing `tests/test_cases.py::test_load_cases`: `load_cases(b, d)` が4件返し、境界値項目は `action == "name = ''"` 形式・`expected` が `expectValid` 由来（True→"有効(受理)" / False→"無効(拒否)"）、doc項目は `action`/`precondition`/`expected` をそのまま、`perspective` が観点ラベルになる。
- [ ] `spec_evidence/cases.py::load_cases`:
  - boundary: `action=f"{c['field']} = {c['value']!r}"`, `expected="有効(受理)" if c['expectValid'] else "無効(拒否)"`, `precondition=""`, `perspective=kind_label("boundary")`。
  - doc: `action=c["action"]`, `precondition=c.get("precondition",""), expected=c["expected"]`, `perspective=kind_label(c["kind"])`。
  - 共通 `screen=c["group"]`, `id=c["id"]`。
- [ ] green → commit `feat(p5): load boundary+doc cases into unified TestItem list`。

## Task 3: 結果パーサ＋JOIN

- [ ] `tests/fixtures/vitest.sample.json`（assertionResults に1件 `title` がサンプルboundary idと一致, status passed; 1件 failed）。
- [ ] failing `tests/test_results.py::test_load_and_join`: `load_vitest_results([path])` が `{title: {"status":..., "duration":...}}` を返し、`join_status(item_id, results)` が一致時 status、無い時 `None`。
- [ ] `spec_evidence/results.py`:
```python
import json
def load_vitest_results(paths):
    out = {}
    for p in paths:
        data = json.loads(open(p, encoding="utf-8").read())
        for f in data.get("testResults", []):
            for a in f.get("assertionResults", []):
                out[a["title"]] = {"status": a["status"], "duration": a.get("duration")}
    return out
def join_status(item_id, results):
    return results.get(item_id)
```
- [ ] green → commit `feat(p5): parse vitest results json and join by case id`。

## Task 4: テスト仕様書（md + xlsx）

- [ ] failing `tests/test_spec_doc.py`: `write_spec_md(items, path)` がヘッダ行 `| ID | 画面 | 観点 | 前提 | 操作・入力 | 期待結果 |` と各項目行を含むテキストを書く。`write_spec_xlsx(items, path)` が openpyxl で1シート・ヘッダ＋行数=len(items)+1 を書き、`load_workbook` で開けてセルA1=="ID"。
- [ ] `spec_evidence/spec_doc.py` 実装（md は手書き整形、xlsx は openpyxl）。
- [ ] green → commit `feat(p5): generate test-spec md and xlsx`。

## Task 5: エビデンスExcel（実測＋スクショ欄）

- [ ] failing `tests/test_evidence.py`: `write_evidence_xlsx(items, results, run_time, path)` が `概要`/`L1境界値`/`操作・状態遷移` シートを持ち、`L1境界値` のヘッダに `実測`/`実行日時`/`スクショ貼付欄`/`画像パス` を含み、boundary項目の `実測` が results 由来（pass/fail）、未マップは `—`。`概要` に総数・pass数・fail数。`load_workbook` で検証。
- [ ] `spec_evidence/evidence.py`:
  - シート分割: 観点=="境界値"→L1境界値、それ以外→操作・状態遷移。
  - スクショ貼付欄: 空セル、`ws.column_dimensions[col].width = 40`、`ws.row_dimensions[r].height = 80`。画像パス列に `out/screenshots/{id}.png`（規約パス）を記載（貼付補助）。
  - 概要シート: 生成日時(run_time)、項目総数、実測pass/fail/未測。
- [ ] green → commit `feat(p5): generate evidence xlsx with results + manual screenshot cells`。

## Task 6: CLI + 実データ生成 + README

- [ ] `spec_evidence/cli.py`（argparse: `--boundary`,`--doc`,`--results`(複数),`--out-dir`、既定は repo 相対パス）, `__main__.py`。
- [ ] failing `tests/test_cli.py::test_cli_smoke`: tmp dir に fixtures を渡し `cli.main([...])` 実行で `out/test-spec.md`,`test-spec.xlsx`,`evidence.xlsx` が生成される。
- [ ] **実データ生成（手動確認）**: `cd tools/spec-evidence && python -m spec_evidence --out-dir out`（既定パスで frontend の cases + vitest-results を読む）。生成3ファイルを確認（xlsx は `load_workbook` でシート名＋行数を出力して確認）。
- [ ] `README.md`（用途・入力・実行方法・出力・手動スクショ貼付の運用）。`.gitignore` に `tools/spec-evidence/out/`。
- [ ] commit `feat(p5): CLI + README; generate spec/evidence from real cases+results`。

## Task 7: 全体検証

- [ ] `cd tools/spec-evidence && python -m unittest discover -s tests -v` 全green。
- [ ] 実データで3成果物生成、`evidence.xlsx` の `L1境界値` 行数 == boundary件数、`実測` 列が unit-results と整合（pass数一致）。
- [ ] 仕上げ commit。

## 完了確認
- [ ] `python -m unittest discover -s tests` 全green
- [ ] 実 cases+results から `test-spec.md/.xlsx`・`evidence.xlsx` 生成、スクショ貼付欄あり
- [ ] アプリ/フロントのビルド・テストに影響なし（独立ツール）
