# テスト戦略 練り直し設計書 — Android公式戦略アンカー + 動くカタログ

- 日付: 2026-05-25
- 位置づけ: 既存 `docs/test-strategy.md`（5層カバレッジ中心）の**練り直し**。
- 動機: 本PoCの本来目的「**テスト自動化アプローチの比較**」に戦略の軸を合わせ直す。比較を副産物から主役へ。
- コスト方針: すべてローカル完結・OSS無料。有料クラウド層（Chromatic / Cypress Cloud / Maestro Cloud）は使わない。

## 0. 狙い（3点）

1. **Android公式の推奨テスト戦略**（developer.android.com/training/testing/fundamentals/strategies）に沿って層を再定義する。
2. アプリ製造時の**設計成果物（概要設計／詳細設計）を、どの層・どのツールで検証するか**にマッピングする（既存 spec §7 の "テスト利用" 一覧を発展）。
3. **複数候補があるツールは厚く比較し、採用理由を残し、動く実例を見せる**。見せる仕組みは **Storybook（Docs/MDX）をハブ**にする。

> 「厚め」は本設計の第一級要件。単一採用の層でも「なぜそれか／不採用にした代替とその理由」まで書く。

---

## 1. 概念フレーム — Android 5層 ↔ 本PoC（Web/Capacitor）読み替え

Android公式は **5層のテストピラミッド**を定義する（割合の数字は示さず「ピラミッド形＝小規模多数・大規模少数」を強調）。
分類軸: **スコープ / ネットワークアクセス / 実行環境 / 忠実度 / ビルド種別 / 実行契機**。

| Android層 | 定義（スコープ/環境/契機） | 本PoCの相当 | ツール | WebView読み替え・注記 |
|---|---|---|---|---|
| **Unit** | 単一関数/クラス・ネット無・ローカル(JVM)・全コミット | ロジック単体・境界値 | Vitest(jsdom) + `gen:cases` | JVM単体に相当。zod検証 / composable / store |
| **Component** | UI部品・ローカル(Robolectric/Emu)・全コミット・**UI挙動＋ビジュアル回帰** | 部品の描画(挙動)＋見た目 | 挙動: Playwright CT / Vitest browser（比較）<br>見た目: Playwright `toHaveScreenshot` | Androidは"ボタンのスクショテスト"をComponentに含む → **現状のL2(挙動)+L3(見た目)はここに統合** |
| **Functional** | 2+部品の連携・モック・pre-merge・画面状態管理 | 単一〜数画面の連携フロー | Playwright（MSWでモック） | RobolectricでなくブラウザDOM。MSWで決定的化 |
| **Application** | アプリ全体・**デプロイ可能バイナリ**・mocked/staging/prod・post-merge | 全画面通しE2E | Playwright E2E（dev build, MSW）/ Maestro(エミュ) | "deployable binary"=Capacitor WebViewビルド。本番ビルドはMSW無しのため要 MSW-in-build（§5既知制約） |
| **Release Candidate** | リリース(最適化)ビルド・本番サーバ・複数実機・pre-release・重要ジャーニー/性能 | 実機での重要導線 | Maestro / Appium（実機・release build） | 本PoCは手動・環境依存。本番API未実装ゆえ"本番サーバ"は代替（MSW-in-build or backend） |

設計上の要点:
- **L2+L3 → Component層に統合**（カタログ上は1層、内部で「挙動 / 見た目」に分割）。
- **上位層は契機（pre-merge / post-merge / pre-release）とビルド種別（debug / release）で区別**するのがAndroid流。現状の曖昧さをここで明確化する。
- 本PoCは Capacitor WebView アプリのため、Android純正の Robolectric/Espresso ではなく Vitest/Playwright/Maestro/Appium に読み替える。**この読み替え自体が「一般的なフロント+Androidアプリ」への適用例**として価値を持つ。

---

## 2. 成果物 × 検証マトリクス（§7連携）

既存 spec §7 の概要設計／詳細設計の各成果物に「検証層・ツール・比較/実例」を紐づける。
このマトリクスがカタログの中核ページ（`01-artifact-matrix.mdx`）になる。

### 2-1. 概要設計

| 成果物 | 何を規定 | 検証層 | ツール | 比較/実例 |
|---|---|---|---|---|
| API一覧（OpenAPI由来） | エンドポイント契約 | Unit | OpenAPI→zod + `gen:cases` | 生成（単一） |
| 画面遷移図（puml） | 画面間遷移 | Functional/Application | Playwright | — |
| 画面一覧 | 画面ID/URL | Application | Playwright（導線） | — |
| 利用端末・HW構成 | 実機/カメラ/スキャナ | Release Candidate | Maestro/Appium ＋ 手動エビデンス | 比較◎ |

### 2-2. 詳細設計

| 成果物 | 何を規定 | 検証層 | ツール | 比較/実例 |
|---|---|---|---|---|
| 画面項目定義書（csv） | 入力検証・境界値 | Unit | Vitest + `gen:cases` | 単一 |
| イベント定義書（csv） | 操作→結果/遷移 | Functional | Playwright | — |
| ストア定義書（csv） | 状態遷移 | Unit | Vitest | 単一 |
| バリデーション定義 | 入力規則・エラー文言 | Unit | Vitest（zod） | 単一 |
| コンポーネント定義 | props/emits・見た目 | Component | 挙動: CT vs Vitest browser ／ 見た目: Playwright visual | **比較◎** |
| 画面レイアウト定義 | レイアウト・見た目 | Component(visual) | Playwright visual ＋（代替候補は§3） | **比較** |
| コンポーネントツリー | 画面→子部品階層 | Component | Storybook カタログ（設計書として） | — |
| シーケンス図（puml） | フロー導線 | Application | Playwright E2E / Maestro | — |
| 状態遷移図（puml） | 状態 | Unit/Functional | Vitest / Playwright | — |
| ルーティング定義 | path/guard/params | Functional | Playwright（route guard） | — |
| デバイス抽象I/F | useScanner/useOcr | Unit/Component/Functional | fakeアダプタ ＋ Vitest/Playwright | — |
| OCR項目マッピング | 認識テキスト→項目 | Unit | Vitest（ゴールデン） | — |
| エラーハンドリング方針 | 例外/権限拒否/失敗表示 | Functional | Playwright（異常系） | — |

「実機HW（カメラOCR実認識・外付けスキャナー実連携）」は自動化スコープ外＝**手動＋エビデンス**（spec §5-3を踏襲）。

---

## 3. ツール比較 + 採用理由（厚め・本設計の本命）

### 3-0. 共通の比較観点（軸）

> **導入容易さ / 忠実度（実環境への近さ）/ 実行速度 / 安定性(flakiness) / CI親和性 / 証跡力(スクショ等) / 学習コスト / コスト（無料前提）**

各層に **(1)比較表 (2)採用理由の文章 (3)動く実例（リンク/埋め込み）** を必ず付ける。
既存 `tool-comparison-L2.md` / `tool-comparison-L5.md` の内容は `90-tool-comparison.mdx` に吸収・拡充し、元ファイルはハブへのポインタにする（単一ソース化）。

### 3-1. Unit層 — 採用: Vitest（+ gen:cases）

| 候補 | 導入 | 速度 | Vite統合 | エコシステム | コスト | 評価 |
|---|---|---|---|---|---|---|
| **Vitest**（採用） | ◎ | ◎ | ◎ | ◎ | 無料 | Vite前提の本構成に最適 |
| Jest | ○ | △ | △(別トランスパイル) | ◎ | 無料 | Vite/ESM/TS統合で不利 |
| node:test | ○ | ○ | △ | △ | 無料 | アサーション/モック周辺が薄い |

採用理由: Viteと同一トランスフォーム経路で速く、`test.each` のデータ駆動が `gen:cases` の境界値JSONと相性良。jsdomで composable/store/zod を高速検証。

### 3-2. Component層（挙動）— 採用: Playwright CT（主）/ Vitest browser（比較対象として併設）

| 候補 | 導入 | 忠実度(実ブラウザ) | Ionic対応 | 証跡(部品スクショ) | 安定性 | コスト | 評価 |
|---|---|---|---|---|---|---|---|
| **Playwright CT**（推奨） | △ | ◎ | ○(IonicVue登録要) | ◎(toHaveScreenshot) | ○ | 無料 | 部品単位の見た目回帰が組込み |
| Vitest browser mode | ○ | ◎ | ○(plugins:[IonicVue]) | ✕(0.34に部品スクショ無) | △(0.34実験的) | 無料 | L1資産流用可だが見た目証跡が弱い |
| Vue Test Utils単体(jsdom) | ◎ | ✕(疑似DOM) | △ | ✕ | ◎ | 無料 | 忠実度低・Web Components描画不可 |

採用理由（厚め）: 両ランナーとも基本描画は緑（検証済み）。差は**部品単位のビジュアル回帰の組込み有無**。証跡を重視する本PoCでは Playwright CT を主推奨。Vitest browser modeは「L1と同じ `@vue/test-utils` で書けるが 0.34 では部品スクショが無い」点を**動く比較として残す**価値があるため併設。

### 3-3. Component層（見た目）— 採用: Playwright `toHaveScreenshot`

| 候補 | 導入 | 決定性 | baseline管理 | コスト | 評価 |
|---|---|---|---|---|---|
| **Playwright visual**（採用） | ○ | ◎(animations:disabled + MSW) | ローカルgit管理 | 無料 | E2Eと同ツールチェーンで一貫 |
| Storybook + Chromatic | ◎ | ◎ | クラウド | **有料** | コスト方針で除外 |
| jest-image-snapshot | ○ | ○ | ローカル | 無料 | Jet前提・別途ブラウザ駆動が必要 |
| Loki / reg-suit | △ | ○ | ローカル/CI | 無料 | Storybook連携前提・構成が増える |

採用理由: MSW決定的データ＋アニメ無効でブレを排除し、baselineをgitに置いて無料・ローカル完結。E2E(Playwright)と同系で学習コスト最小。**baselineのOS/レンダラ依存はCIで再生成が必要**な旨を明記（既知）。

### 3-4. Functional / Application層 — 採用: Playwright（E2E）

| 候補 | 導入 | 並列/速度 | WebView/Capacitor | 証跡 | CI親和性 | コスト | 評価 |
|---|---|---|---|---|---|---|---|
| **Playwright**（採用） | ◎ | ◎ | ○(Web)/△(実機は別) | ◎ | ◎ | 無料 | 並列・トレース・スクショが強い |
| Cypress | ◎ | △(無料は並列制約) | △ | ◎ | ○ | 無料(Cloudは有料) | 並列/タブ制約、Cloud誘導 |
| WebdriverIO | △ | ○ | ◎(Appium連携) | ○ | ○ | 無料 | 設定重め（ただしL5 Appiumで一部活用） |
| Nightwatch | △ | ○ | △ | ○ | ○ | 無料 | エコシステム小 |

採用理由: 既にL1〜L3でPlaywright/Viteに揃っており、MSWで決定的なFunctional/Applicationフローを並列・高速・高証跡で回せる。Cypressは無料での並列制約とCloud誘導を避けたい。

### 3-5. Release Candidate層（Android実機）— 採用: Maestro vs Appium（両方を動く比較として保持）

| 候補 | 導入 | WebView(Capacitor)対応 | 記述量 | 安定性 | CI親和性 | 証跡 | コスト | 評価 |
|---|---|---|---|---|---|---|---|---|
| **Maestro**（スモーク推奨） | ◎ | ○(テキスト基準) | ◎(YAML) | ○ | ○(Cloudは有料/ローカル無料) | ◎ | 無料 | 起動スモーク+スクショに最適 |
| **Appium**(+WDIO) | △ | ◎(WEBVIEW切替でDOM操作) | △(コード) | △(driver整合) | ◎ | ○ | 無料 | 厳密なDOM操作/CI統合向き |
| Espresso | – | ✕(ネイティブ専用) | – | – | – | – | 無料 | WebViewアプリに不向き → 除外 |
| Detox | – | ✕(React Native向け) | – | – | – | – | 無料 | スタック不一致 → 除外 |

採用理由: スモーク＋スクショ証跡は Maestro が費用対効果で上。厳密なDOM操作/CI統合は Appium。**両方を動く比較として残す**（既存L5資産を発展）。共通制約: 本番ビルドにMSW無し → MSW-in-build か backend が前提（§1注記）。

### 3-6. 見せる仕組み（カタログ基盤）— 採用: Storybook

Storybookは**テストランナーではなく**「コンポーネント・ワークベンチ／リビング設計書／カタログ」。Android層に**ゲートとしては乗らず**、**Component層に隣接する設計・確認の補助**かつ**戦略全体を見せるハブ**として二重の役割を持つ。

| 候補 | 導入 | 忠実度 | Docs/MDX | addonエコシステム | Vue3-Vite | コスト | 評価 |
|---|---|---|---|---|---|---|---|
| **Storybook**（採用） | △(重い/init侵入的) | ◎ | ◎(autodocs/MDX) | ◎ | ◎ | 無料(Chromatic不使用) | カタログ＋設計書として最有力 |
| Histoire | ◎(軽量/Vueネイティブ) | ◎ | ○ | △(小規模) | ◎ | 無料 | MDX/Docs/addon弱・開発停滞気味 |
| VitePress等のMDX単体 | ◎ | ✕(部品が生で動かない) | ◎ | – | – | 無料 | "動く"を満たせない |
| カタログ無し | – | – | – | – | – | – | リビング設計書価値を失う |

採用理由（厚め）: 業界標準でautodocs/MDXとaddonが厚く「設計書＋カタログ」を1か所に統合でき、Vue3+Viteを公式サポート、ローカル完結・無料（有料Chromatic addonは除去済み）。既に導入・馴致済み（v10 init が `vitest.config` をworkspace化する侵入と重さがあったが `addon-docs` のみへ整理し `vitest.config` を復元する手当て済み）。再構築コストが小さい。

不採用理由: Histoireは軽量だがMDX/Docs/addonが弱くメンテ停滞気味。VitePress単体は部品が生で動かず「動くリファレンス集」を満たさない（Storybook内で補助的にMDXは使う）。

線引き: Storybookは CT/Visual の**置き換えではなく補完**。回帰の合否判定は引き続きPlaywright系。**将来オプション** `@storybook/test-runner`（Playwright駆動でstoryをスモーク/a11y/インタラクション化）は比較項目として記載のみ・本PoCでは保留(YAGNI)。**stories＝部品実例の単一ソース**で、カタログが見せ、必要ならCTがマウントするフィクスチャとして再利用。

---

## 4. Storybookハブの具体構成

Storybook Docs（MDX）に「Test Strategy」セクションを作り、**戦略の単一ソース**にする。

```
frontend/src/docs/                 # 新規・ハブ本体（MDX）
  00-overview.mdx                  # ピラミッド/Android5層/分類軸/本PoC読み替え（第1章）
  01-artifact-matrix.mdx           # 成果物×検証マトリクス（第2章, §7対応）
  10-unit.mdx                      # 定義/契機 + 採用理由 + 実行コマンド + サンプル
  11-component.mdx                 # storiesを生埋め込み + CT/browser比較 + visual baseline画像
  12-functional-application.mdx    # E2E手順 + e2e/visualスクショ + 比較
  13-release-candidate.mdx         # Maestro/Appium手順 + Androidスクショ + MSW-in-build注意
  90-tool-comparison.mdx           # 比較サマリ+採用理由（厚め・L2/L5吸収）+ Storybook自身の比較
  assets/                          # 上位層の代表スクショ（数枚を厳選コミット）
frontend/src/components/ItemListItem.stories.ts   # 既存＝実例の単一ソース
frontend/.storybook/main.ts        # stories globに src/docs/**/*.mdx を追加
docs/test-strategy.md              # スリム化（ハブへのポインタ＋ディレクトリ規約/コマンド一覧）
docs/tool-comparison-L2.md         # → 90-tool-comparison.mdx へのポインタに短縮
docs/tool-comparison-L5.md         # → 同上
```

役割分担:
- **Component層ページは実コンポーネントを生で表示**（autodocs/stories）。
- **上位層（E2E/visual/Android）は生実行できない** → **実行コマンド＋厳選スクショ埋め込み**で見せる（正直に明記）。visual baselineは既にgit管理ゆえそのまま埋め込み可。Android用は代表数枚を `assets/` にコミット。
- **コードのディレクトリ名・コマンドは変えない**（壊さない）。Android層への対応づけはカタログ上の概念マッピングに留める。
- `.storybook/main.ts` の `stories` に `../src/docs/**/*.mdx` を追加（init既定にあったmdx globを再投入）。

---

## 5. スコープ / YAGNI

**やる**:
- MDXハブ新設（見せる仕組み）。
- 戦略をAndroid5層へ再アンカー。`docs/test-strategy.md` をスリム化。
- 層ごとの厚い比較＋採用理由（L2/L5を吸収・拡充、Storybook自身も比較）。
- 成果物×検証マトリクス（§7連携）。
- Component storiesの生埋め込み＋上位層の代表スクショをコミット。

**やらない（YAGNI）**:
- テストディレクトリ改名・コード移動。
- `@storybook/test-runner` 導入（比較に名前のみ記載）。
- 比較を埋めるためだけの新ランナー追加（単一層の比較は文章の採用理由で、新規実行コードは足さない。動く比較は既存のComponent・Androidのみ）。
- Chromatic 等の有料層。
- CI構築（設定例の提示に留める）。

---

## 6. 成功基準（この練り直しの完了定義）

1. `npm run storybook` / `npm run build-storybook` で「Test Strategy」Docsセクションが表示・ビルドできる。
2. Overview に Android 5層モデル＋分類軸＋本PoC読み替え表が載る。
3. 成果物×検証マトリクスが §7 の概要/詳細成果物と対応して載る。
4. 各層に「厚い比較表＋採用理由＋動く実例（Component生埋め込み or コマンド＋スクショ）」が揃う。
5. Storybook自身の比較・採用理由が `90-tool-comparison.mdx` に載る。
6. `tool-comparison-L2/L5.md` がMDXへ吸収され、元は短いポインタになっている。
7. `docs/test-strategy.md` がハブへのポインタ＋ディレクトリ規約/コマンドにスリム化される。
8. 既存の自動テスト（unit/ct/browser/e2e/visual）と `build` が引き続き緑（回帰なし）。

---

## 7. 留意点・既知制約（再掲）

- L5 Android はMSWが本番ビルドで動かない → データ依存の確認は MSW-in-build か backend が前提（`frontend/android-tests/README.md`）。
- ビジュアルbaselineはOS/レンダラ依存（Windows+chromium生成）。CI実行時は当該環境で再生成が必要。
- `npm run lint` は eslint 未導入で現状動かない（P1からの既存ギャップ・本設計のスコープ外）。
</content>
