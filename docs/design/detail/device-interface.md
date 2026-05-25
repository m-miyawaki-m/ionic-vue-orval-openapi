# デバイス抽象化I/F設計（詳細設計）

カメラOCR・外付けスキャナを**抽象インターフェース＋アダプタ**で実装分離。連携方式/OCRエンジンが未定でも
アプリ本体はインターフェースのみに依存し、テストでは fake に差し替える（spec §4-1, §5-3）。

## スキャナ（`src/scanner/`）

```ts
// types.ts
export interface ScanResult { code: string; format: 'qr' | 'barcode' }
export interface ScannerAdapter {
  scan(): Promise<ScanResult>   // 1回読取。未接続/失敗時は例外
  isAvailable(): Promise<boolean>
}
```

- `useScanner(adapter)` がこの I/F のみに依存（`composables/useScanner.ts`）。
- 実装差し替え: HID / メーカSDK / Bluetooth（`overview/device-hardware.md` の比較）。本PoCは `fakeScannerAdapter.ts`。
- fake: 固定の `ScanResult` を返す（or 例外で失敗系を再現）→ L1/L2/L4 を自動化。

## カメラOCR（`src/ocr/`）

```ts
// types.ts
export interface OcrResult { text: string }
export interface OcrAdapter {
  recognize(image?: unknown): Promise<OcrResult>  // 引数なしはカメラ起動を想定
  isAvailable(): Promise<boolean>
}
```

- `useOcr(adapter)` がこの I/F のみに依存（`composables/useOcr.ts`）。
- 実装差し替え: OCRエンジン未定（`fakeOcrAdapter.ts` が「画像→期待テキスト」を固定）。
- fake で認識ロジック/画面反映を自動テスト。実認識精度は ML 依存のため実機・手動エビデンス。

## テスト方式（再掲, spec §5-3）

| 方式 | スキャナ | カメラOCR | 自動/手動 |
|---|---|---|---|
| fakeアダプタ差し替え（L1/L2/L4） | ◎ | ◎ | 自動 |
| OCRゴールデン（入出力固定） | – | ◎ | 自動 |
| エミュレータ・スモーク（L5） | ✕（外付け不可） | △（画面確認のみ） | 自動 |
| 実機手動＋エビデンス | ◎ | ◎ | 手動 |

設計意図: 「実装が未定でも設計・テストを進める」ための境界。`isAvailable()` で対応端末/接続有無を表現し、UIは
待機/読取中/成功/失敗/未接続 を出し分ける（`architecture/state-scan.puml`）。
