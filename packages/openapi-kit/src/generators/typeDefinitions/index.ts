import generator, { JsonSchema, parseSchema } from '@anttiviljami/dtsgenerator'

import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { formatOutput } from '../../utils/format'
import { TypeDefinitionsGeneratorOptions } from './types'

export const generateTypeDefinitions = async (
  document: OpenAPIDocument,
  { outputPath }: TypeDefinitionsGeneratorOptions,
) => {
  const schema = parseSchema(document as JsonSchema)

  const result = await generator({
    contents: [schema],
  })

  const fileContent = await formatOutput(
    result.replace(/declare namespace/g, 'export declare namespace'),
  )

  writeFile(outputPath, fileContent)
}
