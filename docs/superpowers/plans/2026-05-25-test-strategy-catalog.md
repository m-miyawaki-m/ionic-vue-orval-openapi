# テスト戦略カタログ（Android 5層 + Storybookハブ）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 既存テストを「Android公式5層」に再アンカーし直し、各層のツール比較・採用理由・動く実例を一望できる **Storybook Docs(MDX) カタログ**を作る。

**Architecture:** 戦略の単一ソースを `frontend/src/docs/*.mdx` に置き、Storybookの Docs として表示する。Component層は既存storyを生埋め込み、上位層（E2E/visual/Android）は実行コマンド＋committed済みスクショで見せる。設計ソースは承認済み spec `docs/superpowers/specs/2026-05-25-test-strategy-rework-android-catalog-design.md`（以下「spec」）。各MDXの**表・散文本体はspecの該当節を移植**し、本計画では**MDXの機構（Meta/import/Canvas/画像）と検証手順を完全に**示す。

**Tech Stack:** Storybook 10（`@storybook/vue3-vite` + `@storybook/addon-docs`）/ MDX / Vite 5 / 既存の Vitest・Playwright・Maestro/Appium 資産（変更しない）。

**前提（確定事実）:**
- MDXの doc ブロックは `@storybook/addon-docs/blocks` から import（`@storybook/blocks` は非依存）。
- 既存storyは `frontend/src/components/ItemListItem.stories.ts`（`Drink` / `Food` / `LongName`）。
- committed済みビジュアルbaseline: `frontend/tests/visual/visual.spec.ts-snapshots/login-visual-win32.png`, `items-visual-win32.png`（実アプリのログイン画面・一覧画面のスクショ）。
- `.storybook/main.ts` の現状 stories glob: `["../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"]`、addons: `["@storybook/addon-docs"]`。
- コマンド: `npm run build-storybook`（全MDXをコンパイル＝壊れたMDXで失敗）/ `npm run storybook`（dev確認）/ 既存 `test:unit|test:ct|test:browser|test:e2e|test:visual` と `build`。
- **コードのディレクトリ名・テストコードは変更しない**（spec §5 YAGNI）。作業は `frontend/.storybook/`・`frontend/src/docs/`・`docs/` のみ。

---

## ファイル構成（このプランで作成・変更）

```
frontend/
  .storybook/main.ts                 # 変更: stories glob に ../src/docs/**/*.mdx を追加
  src/docs/                          # 新規: カタログ本体（MDX・戦略の単一ソース）
    00-overview.mdx                  # Android5層モデル + 分類軸 + 本PoC読み替え（spec §1）
    01-artifact-matrix.mdx           # 成果物×検証マトリクス（spec §2）
    10-unit.mdx                      # Unit層: 採用理由 + 実行コマンド（spec §3-1）
    11-component.mdx                 # Component層: storyを生埋め込み + 比較（spec §3-2,3-3）
    12-functional-application.mdx    # Functional/Application層（spec §3-4）
    13-release-candidate.mdx         # RC/Android層（spec §3-5）
    90-tool-comparison.mdx           # 比較サマリ+採用理由 全部+Storybook自身（spec §3 全体,3-6）
    assets/
      login.png                      # = login-visual-win32.png の複製（カタログ用）
      items.png                      # = items-visual-win32.png の複製（カタログ用）
docs/
  test-strategy.md                   # 変更: ハブへのポインタ + ディレクトリ規約/コマンド一覧へスリム化
  tool-comparison-L2.md              # 変更: 90-tool-comparison.mdx へのポインタに短縮
  tool-comparison-L5.md              # 変更: 同上
```

各MDXは「**戦略の単一ソース**」。`docs/*.md` は人間がgitで読む索引・ポインタに退避（単一ソース化）。

---

## Task 1: StorybookでMDXを有効化し、Overviewページを作る

**Files:**
- Modify: `frontend/.storybook/main.ts`
- Create: `frontend/src/docs/00-overview.mdx`

- [ ] **Step 1: stories glob に MDX を追加**

`frontend/.storybook/main.ts` の `stories` 配列を次に変更（既存の1要素に1行追加）:

```ts
  "stories": [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
```

- [ ] **Step 2: Overview MDX を作成**

`frontend/src/docs/00-overview.mdx` を作成。先頭は必ず以下の Meta ブロック（タイトルでDocsツリーに出る）。本文は **spec §0「狙い」と §1「概念フレーム」の表（Android5層↔本PoC読み替え）と分類軸**をそのまま移植する:

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Test Strategy/0. Overview" />

# テスト戦略カタログ — Android公式5層アンカー

本カタログの狙い（spec §0 を移植）。

## Android 5層モデル ↔ 本PoC（Web/Capacitor）読み替え

（spec §1 の「Android層 / 定義 / 本PoCの相当 / ツール / WebView読み替え」表をそのまま移植。
分類軸: スコープ / ネットワーク / 実行環境 / 忠実度 / ビルド種別 / 実行契機 も併記。
要点（L2+L3→Component統合、上位は契機/ビルドで3分割）も移植。）
```

- [ ] **Step 3: build-storybook で検証**

Run: `cd frontend; npm run build-storybook`
Expected: `Storybook build completed successfully`（MDXのimport/構文エラーが無いこと）。失敗時は Meta import が `@storybook/addon-docs/blocks` であることを再確認。

- [ ] **Step 4: dev でレンダリング確認**

Run: `cd frontend; npm run storybook`（バックグラウンド可）。ブラウザ `http://localhost:6006/` のサイドバーに **Test Strategy / 0. Overview** が表示され、5層表が描画されることを目視。確認後サーバ停止。

- [ ] **Step 5: コミット**

```bash
git add frontend/.storybook/main.ts frontend/src/docs/00-overview.mdx
git commit -m "docs(catalog): enable MDX docs + Test Strategy overview (Android 5-layer)"
```

---

## Task 2: カタログ用スクショアセットを用意

**Files:**
- Create: `frontend/src/docs/assets/login.png`（複製）
- Create: `frontend/src/docs/assets/items.png`（複製）

- [ ] **Step 1: committed baseline を assets に複製**

```bash
mkdir -p frontend/src/docs/assets
cp "frontend/tests/visual/visual.spec.ts-snapshots/login-visual-win32.png" "frontend/src/docs/assets/login.png"
cp "frontend/tests/visual/visual.spec.ts-snapshots/items-visual-win32.png" "frontend/src/docs/assets/items.png"
```

- [ ] **Step 2: 存在確認**

Run: `ls frontend/src/docs/assets/`
Expected: `items.png  login.png`

- [ ] **Step 3: コミット**

```bash
git add frontend/src/docs/assets/login.png frontend/src/docs/assets/items.png
git commit -m "docs(catalog): add curated screenshot assets (reuse visual baselines)"
```

---

## Task 3: 成果物 × 検証マトリクスページ

**Files:**
- Create: `frontend/src/docs/01-artifact-matrix.mdx`

- [ ] **Step 1: MDX を作成**

`frontend/src/docs/01-artifact-matrix.mdx`。本文は **spec §2「成果物 × 検証マトリクス」の 2-1（概要設計）と 2-2（詳細設計）の表をそのまま移植**:

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Test Strategy/1. 成果物×検証マトリクス" />

# 成果物 × 検証マトリクス

設計成果物（概要設計／詳細設計, 仕様 §7）を「検証層・ツール・比較/実例」に対応づける。

## 概要設計
（spec §2-1 の表を移植）

## 詳細設計
（spec §2-2 の表を移植）

実機HW（カメラOCR実認識・外付けスキャナー実連携）は自動化スコープ外＝手動＋エビデンス。
```

- [ ] **Step 2: build-storybook 検証**

Run: `cd frontend; npm run build-storybook`
Expected: build成功。

- [ ] **Step 3: コミット**

```bash
git add frontend/src/docs/01-artifact-matrix.mdx
git commit -m "docs(catalog): artifact x verification matrix page"
```

---

## Task 4: Unit層ページ

**Files:**
- Create: `frontend/src/docs/10-unit.mdx`

- [ ] **Step 1: MDX を作成**

`frontend/src/docs/10-unit.mdx`。本文は **spec §3-1 の比較表＋「候補ごとの判断」をそのまま移植**し、実行コマンドとサンプルを併記:

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Test Strategy/2. Unit層" />

# Unit層（ロジック単体・境界値）

- スコープ/契機: 単一関数/クラス・ネット無・ローカル(jsdom)・全コミット
- 採用: **Vitest**（+ `gen:cases` の境界値データ駆動）

## 比較と採用理由
（spec §3-1 の表と「候補ごとの判断」を移植）

## 動かす
```bash
npm run test:unit      # tests/unit + tests/cases（境界値）
npm run gen:cases      # 設計ソース → cases.json 再生成
```
```

- [ ] **Step 2: build-storybook 検証**

Run: `cd frontend; npm run build-storybook`
Expected: build成功。

- [ ] **Step 3: コミット**

```bash
git add frontend/src/docs/10-unit.mdx
git commit -m "docs(catalog): unit layer page"
```

---

## Task 5: Component層ページ（storyを生埋め込み）

**Files:**
- Create: `frontend/src/docs/11-component.mdx`

- [ ] **Step 1: MDX を作成（story生埋め込み + 比較 + 画像）**

`frontend/src/docs/11-component.mdx`。`Canvas` で既存storyを生表示し、見た目セクションで baseline 画像を埋め込む。比較本文は **spec §3-2（挙動）と §3-3（見た目）の表＋判断を移植**:

```mdx
import { Meta, Canvas } from '@storybook/addon-docs/blocks'
import * as ItemListItemStories from '../components/ItemListItem.stories'
import itemsShot from './assets/items.png'

<Meta title="Test Strategy/3. Component層" />

# Component層（部品の挙動＋見た目）

Androidは「ボタンのスクショテスト」をComponent層に含む → 本PoCの「挙動(L2)」と「見た目(L3)」をここに統合。

## 動く実例（部品をそのまま表示）

<Canvas of={ItemListItemStories.Drink} />
<Canvas of={ItemListItemStories.LongName} />

## 挙動の比較（Playwright CT vs Vitest browser mode）
（spec §3-2 の表と「候補ごとの判断」を移植）

```bash
npm run test:ct        # Playwright CT
npm run test:browser   # Vitest browser mode
```

## 見た目の比較（ビジュアル回帰）
（spec §3-3 の表と「候補ごとの判断」を移植）

baseline 例（一覧画面・committed）:

<img src={itemsShot} alt="items list visual baseline" width={320} />

```bash
npm run test:visual    # Playwright toHaveScreenshot（baselineはgit管理・OS依存）
```
```

- [ ] **Step 2: build-storybook 検証**

Run: `cd frontend; npm run build-storybook`
Expected: build成功（story import と png import が解決できること）。

- [ ] **Step 3: dev でレンダリング確認**

Run: `cd frontend; npm run storybook`。**Test Strategy / 3. Component層** ページに ItemListItem（Coffee 等）が**生で描画**され、baseline画像が表示されることを目視。確認後停止。

- [ ] **Step 4: コミット**

```bash
git add frontend/src/docs/11-component.mdx
git commit -m "docs(catalog): component layer page with live story embed + visual baseline"
```

---

## Task 6: Functional / Application層ページ

**Files:**
- Create: `frontend/src/docs/12-functional-application.mdx`

- [ ] **Step 1: MDX を作成**

`frontend/src/docs/12-functional-application.mdx`。比較本文は **spec §3-4 を移植**。E2Eスクショとして items 画像を埋め込み、Application層の MSW-in-build 注意（spec §1注記・§7）を明記:

```mdx
import { Meta } from '@storybook/addon-docs/blocks'
import itemsShot from './assets/items.png'

<Meta title="Test Strategy/4. Functional / Application層" />

# Functional / Application層（画面連携 〜 全画面通しE2E）

- Functional: 2+部品連携・モック・pre-merge
- Application: アプリ全体・デプロイ可能バイナリ・post-merge（"binary"=Capacitorビルド）

## 比較と採用理由
（spec §3-4 の表と「候補ごとの判断」を移植）

## 動かす
```bash
npm run test:e2e       # smoke / login-flow / scan-flow / item-crud
```

E2E到達画面の例:

<img src={itemsShot} alt="items list (e2e reached)" width={320} />

> Application層の注意: 本番Androidビルドは MSW が動かない（`import.meta.env.DEV` 分岐）。
> データ依存の確認は MSW-in-build か backend が前提（`frontend/android-tests/README.md`）。
```

- [ ] **Step 2: build-storybook 検証**

Run: `cd frontend; npm run build-storybook`
Expected: build成功。

- [ ] **Step 3: コミット**

```bash
git add frontend/src/docs/12-functional-application.mdx
git commit -m "docs(catalog): functional/application layer page"
```

---

## Task 7: Release Candidate（Android）層ページ

**Files:**
- Create: `frontend/src/docs/13-release-candidate.mdx`

- [ ] **Step 1: MDX を作成**

`frontend/src/docs/13-release-candidate.mdx`。比較本文は **spec §3-5 を移植**。Android実機スクショは未取得のため、items画像を**正直なキャプション付き**で代用し、手順は `android-tests/README.md` を参照:

```mdx
import { Meta } from '@storybook/addon-docs/blocks'
import itemsShot from './assets/items.png'

<Meta title="Test Strategy/5. Release Candidate (Android)" />

# Release Candidate層（Android実機スモーク・手動/環境依存）

- スコープ/契機: リリースビルド・実機・pre-release・重要ジャーニー
- 採用: **Maestro**（スモーク）＋ **Appium**（DOM精密）の動く比較

## 比較と採用理由
（spec §3-5 の表と「候補ごとの判断」を移植）

## 動かす（手動・要エミュレータ/実機）
```bash
npm run test:android:maestro
npm run test:android:appium
```
手順とデータ依存（MSW-in-build要）は `frontend/android-tests/README.md` を参照。

## 画面イメージ（暫定）

<img src={itemsShot} alt="WebView preview (web render). Real emulator/device shot to be captured on hardware." width={320} />

> 注: 上は Web レンダリングの代用。実機/エミュレータのスクショはハードウェア上で取得・差し替え予定。
```

- [ ] **Step 2: build-storybook 検証**

Run: `cd frontend; npm run build-storybook`
Expected: build成功。

- [ ] **Step 3: コミット**

```bash
git add frontend/src/docs/13-release-candidate.mdx
git commit -m "docs(catalog): release-candidate (android) layer page"
```

---

## Task 8: ツール比較サマリページ（L2/L5を吸収）

**Files:**
- Create: `frontend/src/docs/90-tool-comparison.mdx`

- [ ] **Step 1: MDX を作成**

`frontend/src/docs/90-tool-comparison.mdx`。本文は **spec §3 全体（3-0 観点軸 〜 3-6 Storybook自身の比較）を集約移植**。各層の比較表＋候補ごとの判断＋Storybookの二重役割と採用/不採用理由を1ページに集約:

```mdx
import { Meta } from '@storybook/addon-docs/blocks'

<Meta title="Test Strategy/9. ツール比較・採用理由（総覧）" />

# ツール比較・採用理由（総覧）

共通の比較観点: 導入容易さ / 忠実度 / 実行速度 / 安定性 / CI親和性 / 証跡力 / 学習コスト / コスト（無料前提）。

（spec §3-1 〜 §3-6 の各比較表と「候補ごとの判断」を移植。Storybook自身の比較・採用理由・線引きも含む。）

> 実際に動かして検証しているのは Component（CT/browser）と Android（Maestro/Appium）。
> 他候補は机上比較（採用/不採用理由）として記載。
```

- [ ] **Step 2: build-storybook 検証**

Run: `cd frontend; npm run build-storybook`
Expected: build成功。

- [ ] **Step 3: コミット**

```bash
git add frontend/src/docs/90-tool-comparison.mdx
git commit -m "docs(catalog): consolidated tool-comparison page (absorbs L2/L5 + storybook)"
```

---

## Task 9: 既存 .md をハブへのポインタにスリム化（単一ソース化）

**Files:**
- Modify: `docs/test-strategy.md`（全置換）
- Modify: `docs/tool-comparison-L2.md`（全置換）
- Modify: `docs/tool-comparison-L5.md`（全置換）

- [ ] **Step 1: `docs/test-strategy.md` をスリム化**

全文を次に置換（ハブへのポインタ＋ディレクトリ規約＋コマンド一覧のみ残す）:

```markdown
# テスト戦略（インデックス）

戦略の本体（Android5層モデル・成果物×検証マトリクス・各層のツール比較と採用理由・動く実例）は
**Storybook の「Test Strategy」Docsセクション**を単一ソースとする。

## 見る
```bash
npm run storybook        # http://localhost:6006/ → サイドバー "Test Strategy"
npm run build-storybook  # 静的ビルド（storybook-static, gitignore）
```
ソースMDX: `frontend/src/docs/*.mdx`

## ディレクトリ規約（frontend/）
- `tests/unit` L1ロジック / `tests/cases` 生成境界値 / `tests/ct` L2 Playwright CT /
  `tests/browser` L2 Vitest browser / `tests/visual` L3ビジュアル(baseline git管理) /
  `tests/e2e` L4 E2E / `android-tests` L5 Maestro/Appium(手動)

## コマンド一覧
```bash
npm run test:unit            # Unit
npm run test:ct              # Component(挙動) Playwright CT
npm run test:browser         # Component(挙動) Vitest browser
npm run test:visual          # Component(見た目) ビジュアル回帰
npm run test:e2e             # Functional/Application E2E
npm run test:android:maestro # Release Candidate (手動/エミュ)
npm run test:android:appium  # Release Candidate (手動/エミュ)
npm run gen:cases            # 境界値ケース生成
npm run build                # 本番ビルド
```

詳細な層定義・ツール比較・採用理由は Storybook の Test Strategy を参照。
設計の根拠は `docs/superpowers/specs/2026-05-25-test-strategy-rework-android-catalog-design.md`。
```

- [ ] **Step 2: `docs/tool-comparison-L2.md` をポインタ化**

全文を次に置換:

```markdown
# L2（Component層）ツール比較 — 移動済み

このレポートは Storybook の **Test Strategy / 9. ツール比較・採用理由（総覧）** と
各層ページ（3. Component層）に統合されました（単一ソース化）。

- 見る: `npm run storybook` → サイドバー "Test Strategy"
- ソース: `frontend/src/docs/90-tool-comparison.mdx`, `frontend/src/docs/11-component.mdx`
```

- [ ] **Step 3: `docs/tool-comparison-L5.md` をポインタ化**

全文を次に置換:

```markdown
# L5（Release Candidate / Android層）ツール比較 — 移動済み

このレポートは Storybook の **Test Strategy / 9. ツール比較・採用理由（総覧）** と
各層ページ（5. Release Candidate (Android)）に統合されました（単一ソース化）。

- 見る: `npm run storybook` → サイドバー "Test Strategy"
- ソース: `frontend/src/docs/90-tool-comparison.mdx`, `frontend/src/docs/13-release-candidate.mdx`
```

- [ ] **Step 4: コミット**

```bash
git add docs/test-strategy.md docs/tool-comparison-L2.md docs/tool-comparison-L5.md
git commit -m "docs: slim test-strategy.md + fold L2/L5 comparison into storybook hub (single source)"
```

---

## Task 10: 全体検証（回帰なし）＋ハブ最終確認

**Files:** （検証のみ・必要なら微修正）

- [ ] **Step 1: 既存自動テストの回帰確認**

Run（各々 expected をすべて緑）:
```bash
cd frontend
npm run test:unit      # Expected: 79 passed（既存どおり）
npm run test:ct        # Expected: 1 passed
npm run test:browser   # Expected: 1 passed
npm run test:e2e       # Expected: 4 passed
npm run test:visual    # Expected: 2 passed
npm run build          # Expected: built（vue-tsc通過）
```

- [ ] **Step 2: カタログの最終ビルド＋目視**

Run: `cd frontend; npm run build-storybook`（Expected: build成功）。
Run: `cd frontend; npm run storybook` → サイドバー **Test Strategy** に 0〜9 の全ページが並び、3. Component層で部品が生描画、各層に比較表が出ることを目視。確認後停止。

- [ ] **Step 3: spec の成功基準を照合**

`docs/superpowers/specs/2026-05-25-test-strategy-rework-android-catalog-design.md` §6 の8項目をチェックリストとして確認（全て満たすこと）。未達があれば該当Taskに戻る。

- [ ] **Step 4: 仕上げコミット（あれば）**

```bash
git add -A
git commit -m "docs(catalog): final verification; test-strategy catalog complete"
```

---

## 完了確認（Done）

- [ ] Storybook の「Test Strategy」Docs に 0.Overview / 1.マトリクス / 2.Unit / 3.Component / 4.Functional・Application / 5.RC / 9.比較総覧 が並ぶ
- [ ] 3.Component層で ItemListItem が生描画＋baseline画像が表示
- [ ] 各層に厚い比較表＋採用理由（spec §3移植）が載る
- [ ] `docs/test-strategy.md` と `tool-comparison-L2/L5.md` がポインタにスリム化（単一ソース化）
- [ ] `build-storybook` 成功、既存 unit/ct/browser/e2e/visual と build が緑（回帰なし）

## 次の一手（任意・本プラン外）
- Android実機/エミュレータの実スクショ取得 → `13-release-candidate.mdx` の暫定画像を差し替え。
- `@storybook/test-runner` 導入の是非（story→スモーク/a11y）を比較・検証。
