import { describe, it, expect } from 'vitest'
import { useScanner } from '../../src/composables/useScanner'
import { createFakeScannerAdapter } from '../../src/scanner/fakeScannerAdapter'

describe('useScanner', () => {
  it('returns scanned code via injected adapter', async () => {
    const { lastCode, scan, scanning } = useScanner(createFakeScannerAdapter({ code: 'ZZZZ9999', format: 'barcode' }))
    expect(scanning.value).toBe(false)
    const r = await scan()
    expect(r.code).toBe('ZZZZ9999')
    expect(lastCode.value).toBe('ZZZZ9999')
  })
  it('captures error when adapter throws', async () => {
    const failing = { async scan() { throw new Error('no device') }, async isAvailable() { return false } }
    const { scan, error } = useScanner(failing)
    await expect(scan()).rejects.toThrow()
    expect(error.value).toBeTruthy()
  })
})
