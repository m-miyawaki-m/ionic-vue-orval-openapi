import { ref } from 'vue'
import type { OcrAdapter, OcrResult } from '../ocr/types'

export function useOcr(adapter: OcrAdapter) {
  const recognizing = ref(false)
  const lastText = ref<string | null>(null)
  const error = ref<unknown>(null)

  async function recognize(image?: unknown): Promise<OcrResult> {
    recognizing.value = true; error.value = null
    try {
      const r = await adapter.recognize(image)
      lastText.value = r.text
      return r
    } catch (e) {
      error.value = e
      throw e
    } finally {
      recognizing.value = false
    }
  }
  return { recognizing, lastText, error, recognize }
}
