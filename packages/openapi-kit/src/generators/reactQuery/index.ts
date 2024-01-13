import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { formatOutput } from '../../utils/format'
import { getOperations } from '../../utils/openAPI'
import { buildMutation, buildQuery, getHeaderLines } from './functions'
import { ReactQueryGeneratorOptions } from './types'

export const generateReactQueryHooks = async (
  document: OpenAPIDocument,
  {
    outputFilePath,
    typeDefinitionsImportPath,
    apiClientImportPath,
    prettyOutput = false,
  }: ReactQueryGeneratorOptions,
) => {
  const lines: string[] = [
    ...getHeaderLines({ apiClientImportPath, typeDefinitionsImportPath }),
  ]
  const operations = getOperations(document)

  operations
    .filter((operation) => operation.httpMethod === 'get')
    .forEach((operation) => {
      lines.push(...buildQuery(operation))
    })

  operations
    .filter((operation) => operation.httpMethod !== 'get')
    .forEach((operation) => {
      lines.push(...buildMutation(operation))
    })

  lines.push('')

  const fileContent = await formatOutput(lines.join('\n'), prettyOutput)

  writeFile(outputFilePath, fileContent)
}
