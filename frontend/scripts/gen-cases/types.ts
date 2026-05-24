export type FieldType = 'string' | 'integer' | 'number'

export interface FieldConstraint {
  group: string          // 'item' | 'login'（論理エンティティ）
  field: string          // 'name' 等
  type: FieldType
  required: boolean
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enumValues?: string[]
  pattern?: string
  example: string | number // 妥当な代表値（pattern/enum検証の有効例にも使う）
}

export interface BoundaryCase {
  value: unknown          // 境界値（absent の場合は __ABSENT__）
  expectValid: boolean
  label: string           // 'minLength-1', 'enum:food' 等
}

export const ABSENT = '__ABSENT__' as const

export interface CaseRecord {
  id: string
  source: 'openapi' | 'field-spec'
  kind: 'boundary'
  group: string
  field: string
  value: unknown
  expectValid: boolean
  label: string
}

export interface DocItem {
  id: string
  source: 'event-spec' | 'store-spec'
  kind: 'operation' | 'state'
  group: string
  description: string
  precondition: string
  action: string
  expected: string
}
