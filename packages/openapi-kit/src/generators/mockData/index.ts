import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { getOperations, isResponseObject } from '../../utils/openAPI'
import { toTypeName } from '../../utils/typescript'
import { generateMock, logResolvedRefsCallStackExceeded } from './functions'
import { MockDataGeneratorOptions } from './types'

export const generateMockData = async (
  document: OpenAPIDocument,
  { outputFilePath, typeDefinitionsImportPath }: MockDataGeneratorOptions,
) => {
  const operations = getOperations(document)
  const lines: string[] = [
    `import { Paths } from "${typeDefinitionsImportPath}";`,
    ``,
  ]

  let resolvedRefs: Record<string, number> = {}

  operations.forEach(({ operation, pascalCaseOperationId }) => {
    const responsesToMock = Object.entries(operation.responses)

    for (const [name, response] of responsesToMock) {
      if (!isResponseObject(response) || !response.content) {
        return
      }

      const schema = response.content['application/json']?.schema
      if (!schema) {
        return
      }

      const mockName = `${pascalCaseOperationId}Response${toTypeName(name)}`
      const type = `Paths.${pascalCaseOperationId}.Responses.${toTypeName(
        name,
      )}`

      lines.push(
        `export const ${mockName}: ${type} = ${JSON.stringify(
          generateMock(schema, document, resolvedRefs),
        )}`,
      )
    }
  })

  lines.push('')

  writeFile(outputFilePath, lines.join('\n'))
  logResolvedRefsCallStackExceeded(resolvedRefs)
}
