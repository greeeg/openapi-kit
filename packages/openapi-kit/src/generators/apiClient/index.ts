import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { formatOutput } from '../../utils/format'
import { getOperations } from '../../utils/openAPI'
import {
  buildFunction,
  buildParamsInterface,
  getHeaderLines,
} from './functions'
import { APIClientGeneratorOptions } from './types'

export const generateAPIClient = async (
  document: OpenAPIDocument,
  {
    outputFilePath,
    typeDefinitionsImportPath,
    prettyOutput = false,
  }: APIClientGeneratorOptions,
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
    `  const { baseUrl, headers, onError, ...configRest } = config;`,
  )

  operations.forEach((operation) => {
    lines.push(...buildFunction(operation))
  })

  lines.push(
    `  return {`,
    ...operations.map((operation) => `${operation.camelCaseOperationId},`),
    `  };`,
    `};`,
    '',
    'export type APIClient = ReturnType<typeof getAPIClient>',
  )

  const fileContent = await formatOutput(lines.join('\n'), prettyOutput)
  writeFile(outputFilePath, fileContent)
}
