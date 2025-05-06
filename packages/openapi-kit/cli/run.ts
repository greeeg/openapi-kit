import path from 'path'

import {
  generateAPIClient,
  generateMockData,
  generateReactQueryHooks,
  generateTypeDefinitions,
  parseDocument,
} from '../src'
import { GenerationOptions } from './types'

interface RunOptions {
  openAPIFilePath: string
  outputDirectoryPath: string
  generationOptions: GenerationOptions
}

export const run = async ({
  openAPIFilePath,
  outputDirectoryPath,
  generationOptions: { types, apiClient, mockData, reactQuery },
}: RunOptions) => {
  const filePath = path.resolve(process.cwd(), openAPIFilePath)
  const document = await parseDocument(filePath)
  if (!document) {
    console.log(
      `OpenAPI document at "${filePath}" could not be parsed. Make sure it exists & is valid.`,
    )
    return
  }

  const typeDefinitionsFileName = 'typeDefinitions.ts'
  const typeDefinitionsImportPath = `./${typeDefinitionsFileName.replace(
    '.ts',
    '',
  )}`
  const typeDefinitionsOutputFilePath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    typeDefinitionsFileName,
  )
  const apiClientFileName = 'apiClient.ts'
  const apiClientImportPath = `./${apiClientFileName.replace('.ts', '')}`
  const apiClientOutputFilePath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    apiClientFileName,
  )
  const mockDataFileName = 'mockData.ts'
  const mockOutputFilePath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    mockDataFileName,
  )
  const reactQueryHooksFileName = 'reactQuery.tsx'
  const reactQueryHooksOutputFilePath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    reactQueryHooksFileName,
  )

  if (types) {
    generateTypeDefinitions(document, {
      outputFilePath: typeDefinitionsOutputFilePath,
    })
  }

  if (apiClient) {
    generateAPIClient(document, {
      outputFilePath: apiClientOutputFilePath,
      typeDefinitionsImportPath,
    })
  }

  if (mockData) {
    generateMockData(document, {
      outputFilePath: mockOutputFilePath,
      typeDefinitionsImportPath,
    })
  }

  if (reactQuery) {
    generateReactQueryHooks(document, {
      outputFilePath: reactQueryHooksOutputFilePath,
      typeDefinitionsImportPath,
      apiClientImportPath,
    })
  }
}
