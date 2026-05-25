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
  format?: string
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

export interface CombinationCase {
  id: string                        // 'cmb:<group>:<nnn>'
  group: string
  kind: 'combination'
  payload: Record<string, unknown>  // 全項目のフルレコード
  expectValid: boolean              // 全項目が有効なときのみ true
  label: string                     // 'all-valid' | 'invalid:<field>'
}

export interface DocItem {
  id: string
  source: 'event-spec' | 'store-spec' | 'openapi-op'
  kind: 'operation' | 'state' | 'api-error'
  group: string
  description: string
  precondition: string
  action: string
  expected: string
}
