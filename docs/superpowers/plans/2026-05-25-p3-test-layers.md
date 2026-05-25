# P3 テスト5層＋比較 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`).

**Goal:** テストの5層（L1ロジック/L2コンポーネント/L3レイアウト・ビジュアル回帰/L4 E2E/L5 Androidスモーク）を整え、L2（Vitest browser mode vs Playwright CT）とL5（Maestro vs Appium）の比較を実施し、比較レポートと test-strategy 文書を残す。スクショ（画面表示テスト）はL3のPlaywrightビジュアル回帰で実現し、ベースラインをgit管理する。

**Architecture:** 既存のVitest(L1)/Playwright(L4)を土台に、L3はPlaywright `toHaveScreenshot`（アニメ無効・MSW決定的データでブレを排除）でページのビジュアル回帰。L2はPlaywright Component Testingで実装し、Vitest browser modeは可否を検証して比較レポートに記録（vitest 0.34のbrowser modeは未成熟なため、実情を正直に文書化）。L5はMaestro flow＋Appium雛形＋npmスクリプト＋手順を整備（実機/エミュレータ必須のため自動実行はローカル環境依存・手動）。

**Tech Stack:** Playwright（E2E/CT/visual）/ Vitest / Maestro（YAML flow）/ Appium（WebdriverIO or appium client・雛形）/ Storybook（軽め・任意）

前提（P1/P2/P4で確定）:
- Playwright 設定 `frontend/playwright.config.ts`（webServer=vite:5173, baseURL, chromium）。E2E: smoke/login-flow/scan-flow（全緑）。
- 画面: /login, /tabs/tab1(Items), /tabs/tab2(Search), /tabs/tab3(Settings), /items/:id, /items/new, /items/:id/edit, /scan。MSWで決定的データ（Coffee/Sandwich/Notebook）。認証は非永続（リロードで/loginへ）。
- Vitest 79テスト緑（include `tests/**/*.spec.ts`、exclude `tests/e2e/**`）。
- Android: `frontend/android/`（Capacitor 5, target SDK 33, appId com.example.ionicvueorval）。

---

## ファイル構成（P3で作成）

```
frontend/
  tests/visual/                         # L3 Playwrightビジュアル回帰（別Playwrightプロジェクト or 同testDir）
    visual.spec.ts
    visual.spec.ts-snapshots/           # 生成ベースライン（git管理）
  playwright.config.ts                  # visual用プロジェクト/設定を追加
  tests/ct/                             # L2 Playwright Component Testing
    ItemListItem.spec.ts
  playwright-ct.config.ts               # CT専用設定
  playwright/index.html  playwright/index.ts  # CTマウント用
  src/components/ItemListItem.vue        # L2/L3対象の小コンポーネント（抽出）
  tests/browser/                        # L2 Vitest browser mode（試行）
    ItemListItem.browser.spec.ts
  vitest.browser.config.ts              # browser mode設定（試行・別config）
  e2e/item-crud.spec.ts                 # L4 追加フロー
  android-tests/                        # L5
    maestro/items-smoke.yaml
    appium/items.smoke.test.mjs
    README.md
  package.json                          # scripts: test:visual, test:ct, test:browser, test:android:* 等
docs/
  test-strategy.md
  tool-comparison-L2.md
  tool-comparison-L5.md
```

---

## Task 1: 小コンポーネント抽出 ＋ L3 ビジュアル回帰（Playwright screenshots）

**Files:** `frontend/src/components/ItemListItem.vue`, `frontend/src/views/TabItemsPage.vue`(差替), `frontend/tests/visual/visual.spec.ts`, `frontend/playwright.config.ts`, `frontend/package.json`

- [ ] **Step 1: 再利用コンポーネント抽出** — `frontend/src/components/ItemListItem.vue` を作成（props: `item: Item`）。`ion-item`＋`ion-label`（name/category/price）を描画。`data-testid="item-row"`。`TabItemsPage.vue` の `v-for` 内をこのコンポーネントに置換（`@click` で詳細遷移は親で `router.push`、もしくは `emit('select', item.id)` を親で受ける）。`emit('select')` 方式を推奨。
- [ ] **Step 2: 既存ユニット/ E2E が緑のまま** を確認（`npm run test:unit`、`npm run test:e2e`）。差替で壊れていないこと。
- [ ] **Step 3: visual用Playwright設定** — `frontend/playwright.config.ts` に visual 用の project を追加するか、`testDir` を `./tests` にして `tests/visual` と `tests/e2e` の両方を拾い、project で振り分ける。シンプルには `testMatch` を使い、既存e2eと visual を同一configの別project化。最小実装: 既存configの `projects` に加え、visualは同じchromiumで可。`toHaveScreenshot` の既定で `tests/visual/visual.spec.ts-snapshots/` にベースライン保存。
  - 安定化: テスト内で `await page.emulateMedia({ reducedMotion: 'reduce' })` と、`toHaveScreenshot(..., { animations: 'disabled' })` を使用。MSWで data 決定的。
- [ ] **Step 4: ビジュアルテスト** `frontend/tests/visual/visual.spec.ts`:
```ts
import { test, expect } from '@playwright/test'

async function login(page) {
  await page.goto('/login')
  await page.getByTestId('login-username').locator('input').fill('demo')
  await page.getByTestId('login-password').locator('input').fill('password1')
  await page.getByTestId('login-submit').click()
  await expect(page.getByTestId('items-list')).toBeVisible()
}

test('login page visual', async ({ page }) => {
  await page.goto('/login')
  await expect(page.getByTestId('login-submit')).toBeVisible()
  await expect(page).toHaveScreenshot('login.png', { animations: 'disabled' })
})

test('items list visual', async ({ page }) => {
  await login(page)
  await expect(page.getByText('Coffee')).toBeVisible()
  await expect(page).toHaveScreenshot('items.png', { animations: 'disabled' })
})
```
- [ ] **Step 5: ベースライン生成** — `npx playwright test tests/visual --update-snapshots` でベースラインを作成。再実行 `npx playwright test tests/visual` で差分ゼロ（緑）を確認。
- [ ] **Step 6: スクリプト** — `package.json` に `"test:visual": "playwright test tests/visual"`。e2e の `test:e2e` が visual を二重実行しないよう、`test:e2e` を `playwright test tests/e2e` に絞る（visualは別）。
- [ ] **Step 7: ベースラインをコミット** — `tests/visual/**/*.png` を git 追加（バイナリ）。`git add -A && git commit -m "test(p3-L3): playwright visual regression for login & items, baselines committed"`
- 注: ベースラインはOS/レンダラ依存（Windows/chromium）。CIで再生成が必要な旨は test-strategy に記載（後続Task）。

---

## Task 2: L2 コンポーネントテスト比較（Playwright CT ＋ Vitest browser mode 試行）

**Files:** `frontend/playwright-ct.config.ts`, `frontend/playwright/index.html`, `frontend/playwright/index.ts`, `frontend/tests/ct/ItemListItem.spec.ts`, `frontend/vitest.browser.config.ts`, `frontend/tests/browser/ItemListItem.browser.spec.ts`, `frontend/package.json`, `docs/tool-comparison-L2.md`

- [ ] **Step 1: Playwright CT 導入** — `npm i -D @playwright/experimental-ct-vue`。`playwright-ct.config.ts`（`@playwright/experimental-ct-vue` の defineConfig、testDir `./tests/ct`）、`playwright/index.html`＋`playwright/index.ts`（Ionic Vue を使うコンポーネントは IonicVue プラグイン登録が必要: index.ts で `import { IonicVue } from '@ionic/vue'` 等。CT の `beforeMount` フックで `app.use(IonicVue)` を設定）。
- [ ] **Step 2: CT テスト** `frontend/tests/ct/ItemListItem.spec.ts` — `mount(ItemListItem, { props: { item: {...} } })` し、name/price が表示されることを assert、必要なら `toHaveScreenshot` でコンポーネント単体のスクショ。
- [ ] **Step 3: 実行** — `npx playwright test -c playwright-ct.config.ts`（CTはchromiumを利用）。緑を確認。`package.json` に `"test:ct": "playwright test -c playwright-ct.config.ts"`。
  - うまく動かない場合（Ionic web componentsの登録等で詰まる場合）は、原因と回避（または不可）を比較レポートに記録し、CTテストは最小（プレーンなコンポーネントに差し替え可）にしてよい。BLOCKEDにはせず、知見を残すことが目的。
- [ ] **Step 4: Vitest browser mode 試行** — `npm i -D @vitest/browser webdriverio`（or playwright provider: `@vitest/browser` + `playwright`）。`vitest.browser.config.ts`（`test.browser.enabled=true, name:'chromium', provider:'playwright'`）。`tests/browser/ItemListItem.browser.spec.ts` で同コンポーネントをマウント（@vue/test-utils or testing-library）。`npx vitest run -c vitest.browser.config.ts` を試行。
  - vitest 0.34 の browser mode は実験的で API/プロバイダ要件が厳しい。**動作しない/不安定なら、それ自体が比較結果**。エラー要旨を記録し、深追いしない。`package.json` に `"test:browser": "vitest run -c vitest.browser.config.ts"`（動く場合のみ意味を持つ）。
- [ ] **Step 5: 比較レポート** `docs/tool-comparison-L2.md` — 観点表（導入の容易さ / Ionicコンポーネント対応 / スクショ可否 / 速度 / 安定性 / 学習コスト / 結論推奨）で Playwright CT と Vitest browser mode を比較。実際に遭遇した事象（成功/制約/エラー）を具体的に記載。推奨を明示（例: 本PoCではL2はPlaywright CTを推奨、等）。
- [ ] **Step 6: 検証＋コミット** — CTが緑（or 制約を文書化）、`npm run test:unit`/`test:e2e`/`test:visual` が壊れていない。`git commit -m "test(p3-L2): playwright CT and vitest browser-mode comparison with report"`

---

## Task 3: Storybook（軽め・コンポーネント設計書）※ベストエフォート

**Files:** `frontend/.storybook/*`, `frontend/src/components/ItemListItem.stories.ts`, `frontend/package.json`, （必要なら）`docs/` 追記

- [ ] **Step 1: Storybook 初期化** — `npx storybook@latest init --type vue3 --builder vite --yes`（非対話）。Vite5/Vue3 構成。インストールが重い・対話が出る場合は `--yes` と環境変数で抑制。
- [ ] **Step 2: 余計なサンプル削除** — 生成される `src/stories/` のデモは削除（YAGNI）。`ItemListItem.stories.ts` を作成し、`item` props違いで2-3 story（食品/飲料/長い名前）。Ionicコンポーネントを使うため、`.storybook/preview.ts` で IonicVue を setup（`setup((app)=>app.use(IonicVue))`、CSS import）。
- [ ] **Step 3: 起動確認** — `npm run storybook` が起動しstoriesが表示される（ビルド `npm run build-storybook` が通る）こと。`package.json` の storybook スクリプトを確認。
- [ ] **Step 4: コミット** — `git commit -m "docs(p3): light Storybook with ItemListItem stories as component catalog"`
- **重要:** Storybook の init がバージョン衝突等で破綻し時間を要する場合は、深追いせず **クリーンに中止**（生成物を revert）し、`docs/test-strategy.md`（Task5）に「Storybookは将来追加（本PoCではPlaywright視覚回帰で代替）」と記録する。BLOCKEDにしないこと。何を試し何が起きたかを残す。

---

## Task 4: L5 Android スモーク（Maestro / Appium 比較・設定と手順）

**Files:** `frontend/android-tests/maestro/items-smoke.yaml`, `frontend/android-tests/appium/items.smoke.test.mjs`, `frontend/android-tests/README.md`, `frontend/package.json`, `docs/tool-comparison-L5.md`

実機/エミュレータ前提のため、本環境では自動実行できない。**設定・スクリプト・実行手順を整備**し、実行可否は手順に明記する。

- [ ] **Step 1: Maestro flow** `frontend/android-tests/maestro/items-smoke.yaml`:
```yaml
appId: com.example.ionicvueorval
---
- launchApp
- assertVisible: "Login"
- tapOn:
    id: "login-username"     # WebView内のdata-testid参照は環境依存。テキスト/座標fallbackも記載
- inputText: "demo"
- tapOn:
    id: "login-password"
- inputText: "password1"
- tapOn: "Sign in"
- assertVisible: "Coffee"
- takeScreenshot: items-screen
```
（WebView/Capacitorでは要素IDの露出が限定的。テキストベースのassert/tapを主とし、IDは補助。コメントで注意を明記。）
- [ ] **Step 2: Appium 雛形** `frontend/android-tests/appium/items.smoke.test.mjs` — WebdriverIO/Appium で Android driver に接続し、WebViewコンテキストへ切替→ data-testid で操作→ スクショ、という骨子。実依存（appium server, uiautomator2, chromedriver）はコメントで前提を明記。動作はローカル環境依存。
- [ ] **Step 3: README（実行手順）** `frontend/android-tests/README.md` — 前提（Android Studio, Android 13 AVD, `npm run build` → `npx cap sync android` → `npx cap run android` でエミュレータ起動）、Maestro導入（`curl`/`powershell` インストール手順）、`maestro test android-tests/maestro/items-smoke.yaml` 実行、Appium導入（`npm i -g appium`, `appium driver install uiautomator2`）と実行手順、取得スクショの保存先。**自動CIではなく手動実行**である旨を明記。
- [ ] **Step 4: スクリプト** — `package.json` に `"test:android:maestro": "maestro test android-tests/maestro/items-smoke.yaml"` と `"test:android:appium": "node android-tests/appium/items.smoke.test.mjs"`（実行は環境依存）。
- [ ] **Step 5: 比較レポート** `docs/tool-comparison-L5.md` — Maestro vs Appium を観点表（導入容易さ / WebView(Capacitor)対応 / スクリプト記述量 / 安定性 / CI親和性 / スクショ取得 / 学習コスト / 結論）で比較。Capacitor WebViewアプリに対する各ツールの留意点（WebViewコンテキスト、要素特定）を記載。本PoCでの推奨を明示。
- [ ] **Step 6: コミット** — `git commit -m "test(p3-L5): maestro & appium android smoke setup, run docs, comparison report"`

---

## Task 5: L4 追加フロー ＋ test-strategy 文書 ＋ P3全体検証

**Files:** `frontend/tests/e2e/item-crud.spec.ts`, `docs/test-strategy.md`

- [ ] **Step 1: L4 CRUDフロー** `frontend/tests/e2e/item-crud.spec.ts` — login → tab1 → 新規ボタン(`items-new`) → フォーム入力(name/price/category/code) → 保存(`item-form-submit`) → 一覧へ戻る、を検証（MSW POST は id 999 を返す）。ion-input/ion-select 操作はP2のlogin-flowに倣う（shadow input）。
- [ ] **Step 2: test-strategy.md** `docs/test-strategy.md` — 5層の定義・対象・ツール・ディレクトリ規約・実行コマンド（`npm run test:unit|test:e2e|test:visual|test:ct|test:browser|gen:cases|test:android:*`）、決定的データ(MSW)方針、ビジュアルベースラインのOS依存とCI注意、L2/L5比較レポートへの参照、ハードウェア(L5)は手動である旨をまとめる。
- [ ] **Step 3: 全体検証** — `npm run test:unit`（全緑）, `npm run test:e2e`（smoke/login/scan/crud 緑）, `npm run test:visual`（緑）, `npm run test:ct`（緑 or 文書化）, `npm run build` 成功。
- [ ] **Step 4: コミット** — `git commit -m "test(p3): item CRUD e2e and test-strategy doc; P3 complete"`

---

## 完了確認（P3 Done）
- [ ] L3 ビジュアル回帰がローカルベースラインで差分検出（`npm run test:visual` 緑）
- [ ] L2 Playwright CT が動く（or 制約を比較レポートに記録）＋ Vitest browser mode 試行結果を記録、`tool-comparison-L2.md`
- [ ] L4 E2E（smoke/login/scan/crud）緑
- [ ] L5 Maestro/Appium の設定・手順・`tool-comparison-L5.md` 整備（実行は手動・環境依存）
- [ ] `test-strategy.md` 整備、全ユニット/ビルド緑
- [ ] Storybook は導入 or 文書化された判断あり

## 次: P5（Python仕様書/エビデンスツール）
