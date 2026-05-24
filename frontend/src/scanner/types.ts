export interface ScanResult { code: string; format: 'qr' | 'barcode' }
export interface ScannerAdapter {
  /** 1回のスキャンを行い結果を返す。未接続/失敗時は例外。 */
  scan(): Promise<ScanResult>
  isAvailable(): Promise<boolean>
}
