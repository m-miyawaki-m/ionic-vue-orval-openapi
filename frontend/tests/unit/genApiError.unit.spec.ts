import { describe, it, expect } from 'vitest'
import { deriveApiErrors, type ApiOperation } from '../../scripts/gen-cases/apiError'

const ops: ApiOperation[] = [
  { operationId: 'login', method: 'post', path: '/auth/login', tag: 'auth', hasBody: true, hasIdParam: false },
  { operationId: 'listItems', method: 'get', path: '/items', tag: 'items', hasBody: false, hasIdParam: false },
  { operationId: 'createItem', method: 'post', path: '/items', tag: 'items', hasBody: true, hasIdParam: false },
  { operationId: 'getItem', method: 'get', path: '/items/{id}', tag: 'items', hasBody: false, hasIdParam: true },
  { operationId: 'updateItem', method: 'put', path: '/items/{id}', tag: 'items', hasBody: true, hasIdParam: true },
  { operationId: 'deleteItem', method: 'delete', path: '/items/{id}', tag: 'items', hasBody: false, hasIdParam: true },
]

describe('deriveApiErrors', () => {
  const items = deriveApiErrors(ops)
  it('全て kind=api-error / source=openapi-op', () => {
    expect(items.length).toBeGreaterThan(0)
    expect(items.every((i) => i.kind === 'api-error' && i.source === 'openapi-op')).toBe(true)
  })
  it('保護op(items系)に401、login(auth)には401を出さない', () => {
    expect(items.some((i) => i.id === 'api:listItems:401')).toBe(true)
    expect(items.some((i) => i.id === 'api:login:401')).toBe(false)
  })
  it('{id}op に404', () => {
    expect(items.some((i) => i.id === 'api:getItem:404')).toBe(true)
    expect(items.some((i) => i.id === 'api:listItems:404')).toBe(false)
  })
  it('body付きitems op(create/update)に422、getItemには出さない', () => {
    expect(items.some((i) => i.id === 'api:createItem:422')).toBe(true)
    expect(items.some((i) => i.id === 'api:getItem:422')).toBe(false)
  })
})
