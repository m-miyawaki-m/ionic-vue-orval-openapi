import { describe, it, expect } from 'vitest'
import { useOcr } from '../../src/composables/useOcr'
import { createFakeOcrAdapter } from '../../src/ocr/fakeOcrAdapter'

describe('useOcr', () => {
  it('returns recognized text via injected adapter', async () => {
    const { lastText, recognize, recognizing } = useOcr(createFakeOcrAdapter('HELLO'))
    expect(recognizing.value).toBe(false)
    const r = await recognize()
    expect(r.text).toBe('HELLO')
    expect(lastText.value).toBe('HELLO')
  })
  it('captures error when adapter throws', async () => {
    const failing = { async recognize() { throw new Error('no camera') }, async isAvailable() { return false } }
    const { recognize, error } = useOcr(failing)
    await expect(recognize()).rejects.toThrow()
    expect(error.value).toBeTruthy()
  })
})
