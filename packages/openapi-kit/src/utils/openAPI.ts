import RefParser from '@apidevtools/json-schema-ref-parser'
import get from 'lodash/get'
import { OpenAPIV3 } from 'openapi-types'

import { OpenAPIDocument } from '../types'

export const isSchemaObject = (
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
): response is OpenAPIV3.SchemaObject => {
  return !('$ref' in response)
}

const normalizeSchema = (schema: OpenAPIDocument): OpenAPIDocument => {
  const clonedSchema: OpenAPIDocument = JSON.parse(JSON.stringify(schema))
  const paths = clonedSchema.paths ?? {}

  // doesn't generate parameters correctly if they are $refs to Parameter Objects
  // so we resolve them here
  for (const path in paths) {
    const pathItem = paths[path]
    for (const method in pathItem) {
      // @ts-expect-error
      const operation = pathItem[method as Method]
      if (operation.parameters) {
        // @ts-expect-error
        operation.parameters = operation.parameters.map((parameter) => {
          if ('$ref' in parameter) {
            const refPath = parameter.$ref.replace('#/', '').replace(/\//g, '.')
            const resolvedParameter = get(clonedSchema, refPath)
            return resolvedParameter ?? parameter
          }
          return parameter
        })
      }
    }
  }

  // make sure schema is plain JSON with no metadata
  return JSON.parse(JSON.stringify(clonedSchema))
}

export const parseDocument = async (
  filePath: string,
): Promise<OpenAPIDocument | null> => {
  try {
    const bundledSchemaWithInternalRefs = (await RefParser.bundle(
      filePath,
    )) as OpenAPIDocument
    return normalizeSchema(bundledSchemaWithInternalRefs)
  } catch (error) {
    console.error('An error occurred while parsing OpenAPI document', error)

    return null
  }
}

export const dereferenceDocument = async (
  filePath: string,
): Promise<OpenAPIDocument | null> => {
  try {
    const bundledSchemaWithInternalRefs = (await RefParser.dereference(
      filePath,
    )) as OpenAPIDocument
    return normalizeSchema(bundledSchemaWithInternalRefs)
  } catch (error) {
    console.error('An error occurred while parsing OpenAPI document', error)

    return null
  }
}
