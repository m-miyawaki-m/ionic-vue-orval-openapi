import { ref } from 'vue'
import type { ScannerAdapter, ScanResult } from '../scanner/types'

export function useScanner(adapter: ScannerAdapter) {
  const scanning = ref(false)
  const lastCode = ref<string | null>(null)
  const error = ref<unknown>(null)

  async function scan(): Promise<ScanResult> {
    scanning.value = true; error.value = null
    try {
      const r = await adapter.scan()
      lastCode.value = r.code
      return r
    } catch (e) {
      error.value = e
      throw e
    } finally {
      scanning.value = false
    }
  }
  return { scanning, lastCode, error, scan }
}
