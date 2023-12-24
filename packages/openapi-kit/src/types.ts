import { Schema } from '@anttiviljami/dtsgenerator'
import type { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

export type OpenAPIDocument = OpenAPIV3.Document | OpenAPIV3_1.Document
export type OpenAPISchemaObject =
  | OpenAPIV3.SchemaObject
  | OpenAPIV3_1.SchemaObject
export type OpenAPIRefObject =
  | OpenAPIV3.ReferenceObject
  | OpenAPIV3_1.ReferenceObject
export type OpenAPINonArraySchemaObject =
  | OpenAPIV3.NonArraySchemaObject
  | OpenAPIV3_1.NonArraySchemaObject
export type OpenAPIArraySchemaObject =
  | OpenAPIV3.ArraySchemaObject
  | OpenAPIV3_1.ArraySchemaObject
export type OpenAPISchema = Schema
