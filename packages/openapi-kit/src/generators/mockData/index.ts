import { capitalize } from 'lodash'

import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { formatOutput } from '../../utils/format'
import {
  getOperations,
  isResponseObject,
  isSchemaObject,
} from '../../utils/openAPI'
import { toTypeName, toValidIdentifier } from '../../utils/typescript'
import { generateMock } from './functions'
import { MockDataGeneratorOptions } from './types'

export const generateMockData = async (
  document: OpenAPIDocument,
  { outputPath, typeDefinitionsImportPath }: MockDataGeneratorOptions,
) => {
  const operations = getOperations(document)
  const lines: string[] = [
    `import { Paths } from "${typeDefinitionsImportPath}";`,
  ]

  operations.forEach(({ operation, pascalCaseOperationId, httpMethod }) => {
    const responsesToMock = Object.entries(operation.responses)

    for (const [name, response] of responsesToMock) {
      if (!isResponseObject(response) || !response.content) {
        return
      }

      const schema = response.content['application/json'].schema
      if (!schema || !isSchemaObject(schema)) {
        return
      }

      const mockName = `${pascalCaseOperationId}Response${capitalize(
        toValidIdentifier(name),
      )}`

      const type = `Paths.${pascalCaseOperationId}.Responses.${toTypeName(
        name,
      )}`

      lines.push(
        `export const ${mockName}: ${type} = ${JSON.stringify(
          generateMock(schema),
        )}`,
      )
    }
  })

  const fileContent = await formatOutput(lines.join('\n'))
  writeFile(outputPath, fileContent)
}
