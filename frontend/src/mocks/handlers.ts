import { http, HttpResponse } from 'msw'
import { itemsFixture } from './fixtures/items'

// 決定的なフィクスチャで主要GETを上書きする（生成 *.msw.ts はランダム例のため）
export const handlers = [
  http.get('/api/items', () => HttpResponse.json(itemsFixture)),
  http.get('/api/items/:id', ({ params }) => {
    const id = Number(params.id)
    const found = itemsFixture.find((i) => i.id === id)
    return found ? HttpResponse.json(found) : new HttpResponse(null, { status: 404 })
  }),
  http.get('/api/search', () => HttpResponse.json(itemsFixture)),
  http.post('/api/auth/login', () => HttpResponse.json({ token: 'mock-token-123' })),
]
