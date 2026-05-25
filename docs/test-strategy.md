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

## 結果の確認

各テストの結果の保存先と確認方法は Storybook の **Test Strategy / 6. 結果の確認・レポート保存先**
（`frontend/src/docs/14-results-and-reports.mdx`）にまとめる。要点:

- **e2e / visual**: HTMLレポート `frontend/playwright-report/` → `npx playwright show-report`（http://localhost:9323）
- **CT / unit / browser**: ターミナル出力のみ（`-- --reporter=verbose|list` で詳細）
- `playwright-report` / `test-results` は gitignore。visual基準画像は `tests/visual/*-snapshots/`（git管理）

詳細な層定義・ツール比較・採用理由は Storybook の Test Strategy を参照。
設計の根拠は `docs/superpowers/specs/2026-05-25-test-strategy-rework-android-catalog-design.md`。
