# gen-cases 生成エンジン強化 設計書（A）

- 日付: 2026-05-26
- 位置づけ: P4 の `frontend/scripts/gen-cases`（境界値生成）の強化。テスト自動化PoCの「テストパターン自動生成」を拡張する。
- 関連: 後続サイクル **B（単体テスト項目書ジェネレータ）** が本強化の出力を消費する。spec §5-1 / `data-model.md` / `api-list.md` を前提。
- コスト方針: ローカル完結・OSS無料。生成は決定論的（AI/fuzzing不使用）。

## 0. 目的（現状の不足を埋める）

現状 `gen-cases` は OpenAPI＋画面項目CSV から **境界値中心**（min/max±1, length±1, enum, pattern, required）を生成するのみ。次の4点を追加する:

1. **正常系代表値** — 各項目に典型的な有効値ケース
2. **pairwise（組み合わせ）** — 複数項目の組み合わせケース（現状は各項目独立）
3. **API異常系** — 401/404/422 を観点として（ドキュメント項目のみ・自動実行なし）
4. **format検証** — OpenAPI `format`（email/date等）の検証フック（インフラのみ）

> 境界値ロジックは TS 側に一本化（§5-1）。Python の P5 は消費専用。本強化も TS 側で完結。

---

## 1. データモデル変更（`scripts/gen-cases/types.ts`）

- `FieldConstraint` に `format?: string` を追加。
- `CaseRecord.kind` は現状 `'boundary'`。`label` に `'normal'` と format ラベル（例 `format:email:valid`）を追加（いずれも単一項目, kind は `'boundary'` のまま）。
- 新規 `CombinationCase`:
  ```ts
  export interface CombinationCase {
    id: string                       // 'cmb:<group>:<nnn>'
    group: string                    // 'item' | 'login'
    kind: 'combination'
    payload: Record<string, unknown> // フルレコード（全項目の値）
    expectValid: boolean             // 全項目が有効なときのみ true
    label: string                    // 例 'all-valid' / 'invalid:price'
  }
  ```
- `DocItem.kind` に `'api-error'` を追加（既存の `description/precondition/action/expected` を流用）。`source` に `'openapi-op'` を追加（API異常系の導出元）。

---

## 2. 機能仕様

### 2-1. 正常系代表値（kind=boundary, label=`normal`）

各 `FieldConstraint` につき、`example`（妥当な代表値）の有効ケースを1件追加する。

- value = `c.example`、`expectValid = true`、`label = 'normal'`。
- `example` が未設定/空のときはスキップ（誤って空文字を有効扱いしない）。
- id: `bnd:<source>:<group>:<field>:normal`。
- 実装: `boundary.ts` の `deriveBoundaryCases` 先頭に追加（example があれば push）。

### 2-2. format検証（kind=boundary, インフラのみ）

`FieldConstraint.format` がある文字列項目に対し、有効/無効の検証ケースを生成。

- format→ {valid, invalid} マップ（`format.ts`）:
  | format | valid | invalid |
  |---|---|---|
  | `email` | `user@example.com` | `not-an-email` |
  | `date` | `2026-05-26` | `2026-13-99` |
  | `date-time` | `2026-05-26T00:00:00Z` | `notadatetime` |
  | `uuid` | `123e4567-e89b-12d3-a456-426614174000` | `xxxx` |
- 生成: `label = 'format:<fmt>:valid'`/`:invalid`、expectValid 対応。
- **現 openapi.yaml は string format 未使用 → 生成0件**（将来フィールド追加時に有効）。openapi-adapter が `prop.format` を読み、deriver に渡すフックを用意する。

### 2-3. pairwise（kind=combination → `combination.cases.json`）

各グループ（`item`, `login`）について、項目ごとに2値 `{valid, invalid}` を用意し **全ペア網羅(all-pairs)** のレコードを生成。

- 項目別の値:
  - valid = `example`
  - invalid = 代表1値（型/制約から決定）: 文字列長 → `maxLength+1` の長さ / 数値 → `minimum-1`（無ければ `maximum+1`）/ enum → `'__invalid_enum__'` / pattern → `'!!'`。フォールバックは型既定の無効値。
- アルゴリズム: 単純な all-pairs（貪欲法）。N項目×2値の全ペアを被覆する最小に近いレコード集合。
- 各レコード: `payload = { field: value, ... }`（全項目）、`expectValid = 全項目がvalidのときのみ true`、`label = 'all-valid'` または `'invalid:<最初の無効項目>'`。
- id: `cmb:<group>:<連番>`。
- 出力: 新ファイル `tests/cases/combination.cases.json`。

### 2-4. API異常系（kind=api-error → `doc.cases.json`、ドキュメント項目のみ）

OpenAPI の `paths` から operations を読み、規約で異常系を導出（`apiError.ts`）。**自動実行はしない**（doc項目のみ）。

- 規約:
  - **401**: 保護対象 operation（`login` 以外 = items系/search）を未認証で呼ぶ → 401 期待。
  - **404**: path に `{id}` を持つ operation（getItem/updateItem/deleteItem）に不明 id → 404 期待。
  - **422**: requestBody を持つ operation（createItem/updateItem）に不正 body → 422 期待（バリデーション）。
- 各々 `DocItem{ id:'api:<op>:<status>', source:'openapi-op', kind:'api-error', group, description, precondition, action, expected }` として `doc.cases.json` に追記。
- OpenAPIに4xx定義は無いため、これは**規約ベースの観点**。実行（MSWハンドラ＋テスト）はスコープ外（将来）。

---

## 3. ファイル構成（作成・変更）

```
frontend/scripts/gen-cases/
  types.ts          # 変更: format追加, CombinationCase, DocItem kind 'api-error'
  boundary.ts       # 変更: normal + format 派生を追加
  format.ts         # 新規: format→{valid,invalid} マップ
  pairwise.ts       # 新規: all-pairs 組み合わせ生成
  openapi-adapter.ts# 変更: prop.format を読む
  operations.ts     # 新規: openapi paths から operation 一覧（api-error用）
  apiError.ts       # 新規: operations → api-error DocItem 規約導出
  cli.ts            # 変更: combination/api-error を組み立て・combination.cases.json 書き出し
frontend/tests/
  unit/genBoundary.unit.spec.ts   # 変更: normal/format 検証追加
  unit/genPairwise.unit.spec.ts   # 新規: all-pairs網羅 + expectValid
  unit/genApiError.unit.spec.ts   # 新規: operations→api-error 導出
  cases/boundary.spec.ts          # 変更: normal も実行（zod field検証）
  cases/combination.spec.ts       # 新規: combination を zod完全スキーマで実測
  cases/combination.cases.json    # 生成物（コミット対象, 既存cases.jsonに倣う）
```

---

## 4. データフロー

```
openapi.yaml ─┬─ openapi-adapter(constraints, +format) ─┐
              └─ operations.ts (paths→ops) ──── apiError.ts ─┐
field-spec CSV ─ csv-adapter(constraints) ───────┐          │
                                                  ▼          ▼
                          boundary.ts (境界値+normal+format)  │
                          pairwise.ts (combination)           │
                                                  │           │
   cli.ts ──────────────────────────────────────┴───────────┘
     ├─ boundary.cases.json   (boundary + normal + format)
     ├─ combination.cases.json(pairwise records)
     ├─ doc.cases.json        (operation/state + api-error)
     └─ reconcile.md          (変更なし)
```

---

## 5. テスト戦略（TDD）

- `genBoundary.unit.spec.ts`（変更）: `normal`（example→有効1件）と format（email等→valid/invalid）の派生を検証。
- `genPairwise.unit.spec.ts`（新規）: 全ペア網羅（各項目値ペアが少なくとも1レコードに出現）、`expectValid` が「全項目valid時のみtrue」になる。
- `genApiError.unit.spec.ts`（新規）: items系→401、`{id}`op→404、body op→422 が導出され、login は401対象外。
- `cases/combination.spec.ts`（新規・データ駆動）: 各 combination レコードの `payload` を zod 完全スキーマ（`itemInputSchema`/`loginSchema`）で `safeParse` し、`success === expectValid` を assert。
- `cases/boundary.spec.ts`（変更）: `normal` ケースも既存と同様に zod field 検証に流す。
- api-error は **doc項目のみ**（実行テストなし）。`genApiError.unit.spec` で生成のみ担保。

---

## 6. 成功基準

1. `npm run gen:cases` が `boundary.cases.json`（+normal）/ `combination.cases.json`（pairwise）/ `doc.cases.json`（+api-error）を生成する。
2. 各 group（item/login）で正常系代表値ケースが出る（example由来）。
3. combination が all-pairs を満たし、`combination.spec.ts` が全レコードで `success===expectValid` 緑。
4. api-error が 401/404/422 観点として `doc.cases.json` に載る（自動実行なし）。
5. format フックが実装され、format 付きフィールドがあれば valid/invalid を生成する（現スキーマでは0件で問題なし）。
6. 既存の `npm run test:unit` が引き続き緑（境界値56＋既存ユニット、回帰なし）。

---

## 7. スコープ外（YAGNI）

- API異常系の実行（MSW異常ハンドラ＋Vitest/E2E）。
- pairwise の3値以上 / n-wise（all-pairs=2-wise のみ）。
- format 用フィールドの openapi.yaml への追加（インフラのみ）。
- 単体テスト項目書ジェネレータ（= 次サイクル **B**、別spec）。
- IT確認書への自動充填（別途）。
