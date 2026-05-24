import type { ScannerAdapter, ScanResult } from './types'

export function createFakeScannerAdapter(result: ScanResult = { code: 'ABCD0001', format: 'qr' }): ScannerAdapter {
  return {
    async scan() { return result },
    async isAvailable() { return true },
  }
}
