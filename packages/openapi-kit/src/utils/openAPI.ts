import RefParser from '@apidevtools/json-schema-ref-parser'
import get from 'lodash/get'
import { OpenAPIV3, OpenAPIV3_1 } from 'openapi-types'

import {
  OpenAPIArraySchemaObject,
  OpenAPIDocument,
  OpenAPINonArraySchemaObject,
  OpenAPISchemaObject,
} from '../types'
import { fileExists } from './fileSystem'
import { toTypeName, toValidIdentifier } from './typescript'

export const isSchemaObject = (
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.SchemaObject,
): response is OpenAPIV3.SchemaObject => {
  return !('$ref' in response)
}

export const isParameterObject = (
  param: OpenAPIV3.ReferenceObject | OpenAPIV3.ParameterObject,
): param is OpenAPIV3.ParameterObject => {
  return !!(param as OpenAPIV3.ParameterObject).name
}

export const isResponseObject = (
  response: OpenAPIV3.ReferenceObject | OpenAPIV3.ResponseObject,
): response is OpenAPIV3.ResponseObject => {
  return !('$ref' in response)
}

export const isRefObject = (
  response:
    | OpenAPIV3.ReferenceObject
    | OpenAPIV3.SchemaObject
    | OpenAPIV3_1.ReferenceObject
    | OpenAPIV3_1.SchemaObject,
): response is OpenAPIV3.ReferenceObject | OpenAPIV3_1.ReferenceObject => {
  return '$ref' in response
}

export const isArraySchemaObject = (
  schemaObject: OpenAPISchemaObject,
): schemaObject is OpenAPIArraySchemaObject => {
  return 'items' in schemaObject
}

export const isNonArraySchemaObject = (
  schemaObject: OpenAPISchemaObject,
): schemaObject is OpenAPINonArraySchemaObject => {
  return !('items' in schemaObject)
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
  if (!fileExists(filePath)) {
    return null
  }

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
  if (!fileExists(filePath)) {
    return null
  }

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

const httpMethods = Object.values(OpenAPIV3.HttpMethods)

export interface Operation {
  path: string
  httpMethod: OpenAPIV3.HttpMethods
  operation: OpenAPIV3.OperationObject
  camelCaseOperationId: string
  pascalCaseOperationId: string
}

export const getOperations = (document: OpenAPIDocument) => {
  const operations: Operation[] = []

  for (const [path, properties = {}] of Object.entries(document.paths ?? {})) {
    for (const httpMethod of httpMethods) {
      const operation = properties[httpMethod]
      if (!operation || !operation.operationId) {
        continue
      }

      const camelCaseOperationId = toValidIdentifier(operation.operationId)
      const pascalCaseOperationId = toTypeName(operation.operationId)

      operations.push({
        path,
        httpMethod,
        operation,
        camelCaseOperationId,
        pascalCaseOperationId,
      })
    }
  }

  return operations
}
