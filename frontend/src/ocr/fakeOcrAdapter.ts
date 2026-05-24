import type { OcrAdapter, OcrResult } from './types'

export function createFakeOcrAdapter(text = 'ABCD1234'): OcrAdapter {
  return {
    async recognize() { return { text } },
    async isAvailable() { return true },
  }
}
