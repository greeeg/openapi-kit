import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { getOperations } from '../../utils/openAPI'
import {
  buildFunction,
  buildParamsInterface,
  getHeaderLines,
} from './functions'
import { APIClientGeneratorOptions } from './types'

export const generateAPIClient = async (
  document: OpenAPIDocument,
  { outputFilePath, typeDefinitionsImportPath }: APIClientGeneratorOptions,
) => {
  const lines: string[] = [...getHeaderLines(typeDefinitionsImportPath)]
  const operations = getOperations(document)

  operations.forEach((operation) => {
    lines.push(
      ...buildParamsInterface(
        operation.pascalCaseOperationId,
        operation.operation,
      ),
    )
  })

  lines.push(
    `export const getAPIClient = (config: APIClientConfig) => {`,
    `  const { baseUrl, onRequest, onError } = config;`,
  )

  operations.forEach((operation) => {
    lines.push(...buildFunction(operation))
  })

  lines.push(
    `  return {`,
    ...operations.map((operation) => `    ${operation.camelCaseOperationId},`),
    `  };`,
    `};`,
    '',
    'export type APIClient = ReturnType<typeof getAPIClient>',
    '',
  )

  writeFile(outputFilePath, lines.join('\n'))
}
