# L5 Android スモーク ツール比較: Maestro vs Appium

対象レイヤ: **L5（Android 実機/エミュレータ・スモーク）**
対象アプリ: Capacitor 5 の **WebView アプリ**（Ionic Vue を `dist` として内包）
ターゲット: Android 13 (API 33)、appId `com.example.ionicvueorval`

> 注: L5 は実機/エミュレータ前提のため**手動実行・環境依存**で、本リポジトリには
> 設定・スクリプト・手順のみを収録（自動 CI ではない）。設定は
> [`../frontend/android-tests/`](../frontend/android-tests/)、データ依存の制約は
> その `README.md`（MSW は DEV ビルドのみ）を参照。

---

## 結論（先に）

**スモークの主目的（起動確認・1〜2画面の可視確認・スクショ証跡）には Maestro を推奨。**
YAML が簡潔で導入が軽く、Capacitor WebView でもテキスト基準のアサートが書きやすい。
**Appium は CI 親和性・WebView の DOM セレクタ（`data-testid`）精緻な操作・他言語/他基盤との統合**が要るときの選択肢。本PoCの「スモーク＋手動スクショ」用途では Maestro が費用対効果で上回る。

いずれも前提として **MSW をビルドに含めるか、到達可能なバックエンドが必要**（本番ビルドにモックが無いため。`android-tests/README.md` 参照）。

---

## 観点別比較

| 観点 | Maestro | Appium (+ WebdriverIO/UiAutomator2) |
|---|---|---|
| **導入の容易さ** | ◎ 単一バイナリ + YAML。サーバ常駐不要 | △ Appium サーバ + driver(uiautomator2) + chromedriver 整合が必要 |
| **WebView (Capacitor) 対応** | ○ テキスト基準で安定。`data-testid` 等の DOM 属性はネイティブマッチャに露出しにくい | ◎ WebView コンテキストへ切替えれば CSS/`data-testid` で DOM を精緻に操作 |
| **スクリプト記述量** | ◎ 宣言的 YAML。短い | △ コード（JS/各言語）。ボイラープレート多め |
| **要素特定の精度** | ○ テキスト/座標中心。複雑な DOM 操作は不得手 | ◎ セレクタ・待機・複雑操作に強い |
| **安定性** | ○ 自動リトライ/待機が組み込み | △ chromedriver/driver バージョン整合に左右されやすい |
| **CI 親和性** | ○（Maestro Cloud は**有料**。ローカル/自前 CI は無料） | ◎ 自前 CI・Selenium グリッド等と統合しやすい（OSS） |
| **スクショ取得** | ◎ `takeScreenshot` 一行 | ○ `saveScreenshot()` |
| **学習コスト** | ◎ 低い（YAML） | △ Appium/WDIO の概念とセットアップ |
| **コスト** | 本体 OSS・無料（Cloud のみ有料、本PoCでは未使用） | OSS・無料 |

（コスト方針: 有料クラウド層（Maestro Cloud 等）は使わない。ローカル/自前で完結させる。）

---

## Capacitor WebView 特有の留意点

- **コンテキスト切替**: Capacitor アプリはネイティブシェル内に WebView を持つ。Appium は
  `getContexts()` → `WEBVIEW_com.example.ionicvueorval` へ `switchContext` して初めて DOM 操作が可能。
- **`data-testid` の露出差**: WebView 内の DOM 属性は、Appium（DOM コンテキスト）からは
  CSS セレクタで参照できるが、Maestro のネイティブマッチャからは見えにくい
  → Maestro flow は**可視テキスト**（"Login" / "Sign in" / "Coffee"）で書く。
- **データ依存**: 本番ビルドに MSW が無いため、ログイン以降のフローは MSW-in-build か
  バックエンドが前提（`android-tests/README.md`）。スモークの最小確認は「ログイン画面の描画」。

---

## 使い分け指針（本PoC）

- **素早い起動スモーク＋スクショ証跡**（手動・少数画面） → **Maestro**。
- **WebView DOM を `data-testid` で厳密に操作／CI に組み込みたい／既存 Selenium 資産と統合** → **Appium**。

L2（コンポーネント）比較は [`tool-comparison-L2.md`](./tool-comparison-L2.md)、5層全体の方針は
[`test-strategy.md`](./test-strategy.md) を参照。
