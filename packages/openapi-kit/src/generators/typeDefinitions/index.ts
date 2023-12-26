import generator, { JsonSchema, parseSchema } from '@anttiviljami/dtsgenerator'

import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { formatOutput } from '../../utils/format'
import { TypeDefinitionsGeneratorOptions } from './types'

export const generateTypeDefinitions = async (
  document: OpenAPIDocument,
  { outputFilePath, prettyOutput = false }: TypeDefinitionsGeneratorOptions,
) => {
  const schema = parseSchema(document as JsonSchema)

  const result = await generator({
    contents: [schema],
  }).catch((err) => {
    console.error('Could not generate type definitions', String(err))
    return null
  })

  if (!result) {
    return
  }

  const fileContent = await formatOutput(
    result.replace(/declare namespace/g, 'export declare namespace'),
    prettyOutput,
  )

  writeFile(outputFilePath, fileContent)
}
