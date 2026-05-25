# L5 Android スモークテスト（Maestro / Appium）

実機 or エミュレータが必須のため、**自動 CI ではなく手動実行**です。本ディレクトリは
設定・スクリプト・手順を提供し、実行可否は各自の環境に依存します。
ツール選定の比較は [`../../docs/tool-comparison-L5.md`](../../docs/tool-comparison-L5.md) を参照。

## ⚠️ データ依存（最重要）

このアプリの MSW モックは **Vite の DEV ビルドでのみ起動**します
（`src/main.ts` が `import.meta.env.DEV` で分岐）。
`npx cap run android` は本番 `dist` を載せるため、**モックバックエンドが無く**、
ログイン（`POST /api/auth/login`）も一覧取得（`GET /api/items`）も失敗します。

そのため、`assertVisible: "Coffee"` / `items-list` の表示確認には次のいずれかが必要です:

1. **MSW をビルドに含める**（推奨・最小）— 例: `VITE_ENABLE_MSW` フラグを導入し
   `main.ts` の分岐を `if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MSW)` に変更、
   `VITE_ENABLE_MSW=1 npm run build` でビルド。
2. **到達可能なバックエンドを用意**して `capacitor.config.ts` の `server.url` を
   `http://10.0.2.2:<port>`（エミュレータからホストを指す既定アドレス）に向ける。

上記が無い場合、スモークで意味があるのは「**ログイン画面が描画される**（`Login` / `Sign in` 可視）」までです。

## 前提（共通）

- Android Studio + **Android 13 (API 33) AVD**（本PoCのターゲット）
- アプリのビルドとインストール:
  ```bash
  npm run build
  npx cap sync android
  npx cap run android        # エミュレータ/実機にインストール・起動
  ```
- appId: `com.example.ionicvueorval` / Activity: `.MainActivity`

## Maestro

WebView 内では `data-testid` がネイティブマッチャに露出しにくいため、**テキスト基準**で操作します。

```bash
# インストール（Windows PowerShell）
#   iwr https://get.maestro.mobile.dev | bash    # WSL/bash 環境
#   または公式手順: https://maestro.mobile.dev/getting-started/installing-maestro
maestro test android-tests/maestro/items-smoke.yaml
```

スクショは `android-tests/screenshots/items-screen.png` に保存されます（gitignore 済み）。

## Appium

WebView コンテキストへ切替後は CSS / `data-testid` セレクタが使えます。

```bash
npm i -D webdriverio
npm i -g appium
appium driver install uiautomator2
appium                       # 別ターミナルでサーバ起動（:4723）
node android-tests/appium/items.smoke.test.mjs
```

スクショは `android-tests/screenshots/items-screen.png` に保存されます（gitignore 済み）。

## npm スクリプト

```bash
npm run test:android:maestro   # maestro test ...
npm run test:android:appium    # node android-tests/appium/items.smoke.test.mjs
```

どちらも実機/エミュレータと各ツールの導入が前提で、未導入環境では失敗します。
