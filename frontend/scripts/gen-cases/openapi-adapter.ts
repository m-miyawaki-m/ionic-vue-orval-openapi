import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import type { FieldConstraint, FieldType } from './types'

interface OaProperty {
  type?: string
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  enum?: string[]
  pattern?: string
  format?: string
  example?: string | number
}

interface OaSchema {
  type?: string
  required?: string[]
  properties?: Record<string, OaProperty>
}

interface OaDoc {
  components?: {
    schemas?: Record<string, OaSchema>
  }
}

const SCHEMA_GROUP_MAP: Record<string, string> = {
  ItemInput: 'item',
  LoginRequest: 'login',
}

export function loadOpenapiConstraints(): FieldConstraint[] {
  const yamlPath = path.resolve(process.cwd(), '../openapi/openapi.yaml')
  const raw = fs.readFileSync(yamlPath, 'utf-8')
  const doc = yaml.load(raw) as OaDoc

  const schemas = doc?.components?.schemas ?? {}
  const result: FieldConstraint[] = []

  for (const [schemaName, group] of Object.entries(SCHEMA_GROUP_MAP)) {
    const schema = schemas[schemaName]
    if (!schema || !schema.properties) continue

    for (const [field, prop] of Object.entries(schema.properties)) {
      const constraint: FieldConstraint = {
        group,
        field,
        type: (prop.type ?? 'string') as FieldType,
        required: schema.required?.includes(field) ?? false,
        minimum: prop.minimum,
        maximum: prop.maximum,
        minLength: prop.minLength,
        maxLength: prop.maxLength,
        enumValues: prop.enum,
        pattern: prop.pattern,
        format: prop.format,
        example: prop.example ?? '',
      }
      result.push(constraint)
    }
  }

  return result
}
