import generator, { JsonSchema, parseSchema } from '@anttiviljami/dtsgenerator'

import { OpenAPIDocument } from '../../types'
import { writeFile } from '../../utils/fileSystem'
import { TypeDefinitionsGeneratorOptions } from './types'

export const generateTypeDefinitions = async (
  document: OpenAPIDocument,
  { outputFilePath }: TypeDefinitionsGeneratorOptions,
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

  writeFile(
    outputFilePath,
    result.replace(/declare namespace/g, 'export declare namespace'),
  )
}
