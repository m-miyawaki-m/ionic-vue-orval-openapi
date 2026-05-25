# L2 コンポーネントテスト ランナー比較: Playwright CT vs Vitest browser mode

対象レイヤ: **L2（コンポーネント単体テスト）**
比較日: 2026-05-25 / 検証環境: Windows 11, chromium（Playwright同梱）
対象コンポーネント: `frontend/src/components/ItemListItem.vue`（同一コンポーネントを両ランナーで検証）

検証バージョン:

| パッケージ | バージョン |
|---|---|
| `@playwright/experimental-ct-vue` / `@playwright/test` | 1.60.0 |
| `@vitest/browser` / `vitest` | 0.34.6 |
| `@vue/test-utils` | 2.4.10 |
| `@ionic/vue` | 8.8.8 |

---

## 結論（先に）

**本PoCのL2は Playwright CT を推奨**。理由は、コンポーネント単体での**ビジュアル回帰（スクリーンショット）が組み込みで使え**、L3（Playwrightビジュアル回帰）とツールチェーンが揃うため。
ただし計画時の想定（「Vitest browser mode は vitest 0.34 で未成熟＝動かない可能性、それ自体が比較結果」）に反し、**両ランナーとも基本のレンダリング検証は緑**で動作した。Vitest browser mode は L1 ユニットと同じ `vitest` + `@vue/test-utils` を流用できる利点があり、**挙動のみを見る軽量なコンポーネントテストには十分実用的**。スクショ証跡が不要なケースの選択肢として残す。

---

## 実測結果

| | Playwright CT | Vitest browser mode |
|---|---|---|
| テスト結果 | ✅ 1 passed | ✅ 1 passed |
| 実行時間（合計） | 約 2.4s | 約 2.77s |
| テスト本体 | 640ms | 21ms（collect 1.25s） |
| 実行コマンド | `npm run test:ct` | `npm run test:browser` |

どちらも同じ assertion（`Coffee` と `350` が描画される）で緑。Ionic の Web Components を含むコンポーネントが、両ランナーで実ブラウザ（chromium）上に問題なくマウントできた。

---

## 観点別比較

| 観点 | Playwright CT (1.60) | Vitest browser mode (0.34) |
|---|---|---|
| **導入の容易さ** | △〜○ 専用 config + `playwright/index.{html,ts}`（マウント用ホスト）が必要。既存 Playwright 資産を流用できる | ○ `vitest.browser.config.ts` 1枚 + provider 指定のみ。L1 の vitest 設定を踏襲できる |
| **Ionic コンポーネント対応** | ○ `playwright/index.ts` の `beforeMount` フックで `app.use(IonicVue)` + `core.css` を登録すれば動作 | ○ マウント時に `global.plugins:[IonicVue]` を渡せば動作 |
| **スクショ（ビジュアル回帰）** | ◎ `expect(component).toHaveScreenshot()` がコンポーネント単位で組み込み。L3 と同方式 | ✕ 0.34 ではコンポーネント単位の組み込みスクショ assertion なし（provider 経由の手動撮影に限られる） |
| **速度** | ○ テスト本体は速いが、専用 Vite ビルド/ブラウザ起動のオーバーヘッドあり | ○ 同等。collect（Vite 変換）に時間がかかる |
| **既存資産の再利用** | ○ Playwright API（`mount`/`expect`/locator）が E2E・L3 と共通 | ◎ L1 ユニットの `@vue/test-utils`（`wrapper.text()` 等）をそのまま流用 |
| **安定性／成熟度** | ○ "experimental" 表記だが広く使われ安定。props はランナー↔ブラウザ境界をまたぐためシリアライズ可能である必要あり | △ vitest 0.34 の browser mode は実験的。基本動作は緑だが API 表面は未成熟（後継 1.x/2.x/3.x で大きく変化）。本PoCは L1 と揃えて 0.34 にピン留め |
| **学習コスト** | ○ Playwright を一式覚える（E2E と共通なので追加コスト小） | ◎ vitest + @vue/test-utils を既に使っていれば追加学習ほぼ不要 |

---

## 検証で得た具体的な知見（ハマりどころ）

- **IonicVue の登録は必須**。両ランナーとも未登録だと `ion-*` が解決されず描画されない。
  - Playwright CT: `frontend/playwright/index.ts` の `beforeMount(({ app }) => app.use(IonicVue))` + `import '@ionic/vue/css/core.css'`。
  - Vitest browser mode: `mount(Comp, { global: { plugins: [IonicVue] } })`。
- **Playwright CT のビルドキャッシュ**は `frontend/playwright/.cache/` に出力される（生成物なので `.gitignore` 済み）。`playwright/index.{html,ts}` 自体はホスト定義のソースで**コミット対象**。
- **Vitest browser mode は Playwright provider を使うと chromium を共有**でき、追加ブラウザ取得は不要だった（`provider: 'playwright'`）。
- 計画時の悲観的想定（browser mode が動かない可能性）は外れ、**0.34 でも最小ケースは緑**。ただしスクショ機能の欠如という明確な差は残る。

---

## 使い分け指針（本PoC）

- **コンポーネントの見た目を証跡（スクショ）として残したい** → Playwright CT（L3 と同じツールチェーンで一貫）。
- **挙動だけを素早く検証したい／L1 ユニットの延長で書きたい** → Vitest browser mode（ただし 0.34 の実験的位置づけに留意）。

L5（Android スモーク）の Maestro vs Appium 比較は [`tool-comparison-L5.md`](./tool-comparison-L5.md)、5層全体の方針は [`test-strategy.md`](./test-strategy.md) を参照。
