#!/usr/bin/env node
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import {
  generateAPIClient,
  generateMockData,
  generateReactQueryHooks,
  generateTypeDefinitions,
  parseDocument,
} from '../src'
import { createDirectory, fileExists } from '../src/utils/fileSystem'

interface RunOptions {
  openAPIFilePath: string
  outputDirectoryPath: string
  prettyOutput: boolean
}

const run = async ({
  openAPIFilePath,
  outputDirectoryPath,
  prettyOutput,
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

  generateTypeDefinitions(document, {
    outputFilePath: typeDefinitionsOutputFilePath,
    prettyOutput,
  })
  generateAPIClient(document, {
    outputFilePath: apiClientOutputFilePath,
    typeDefinitionsImportPath,
    prettyOutput,
  })
  generateMockData(document, {
    outputFilePath: mockOutputFilePath,
    typeDefinitionsImportPath,
    prettyOutput,
  })
  generateReactQueryHooks(document, {
    outputFilePath: reactQueryHooksOutputFilePath,
    typeDefinitionsImportPath,
    apiClientImportPath,
    prettyOutput,
  })
}

yargs(hideBin(process.argv))
  .command(
    'generate',
    'Generate API client, React Query hooks and TypeScript definitions',
    {
      file: {
        alias: 'f',
        type: 'string',
        describe: 'Path to OpenAPI specification file',
        demandOption: true,
      },
      outputDir: {
        alias: 'o',
        type: 'string',
        describe: 'Output directory',
        demandOption: true,
      },
      prettyOutput: {
        type: 'boolean',
        default: false,
        describe: 'Wether or not the output should be formatted using Prettier',
        demandOption: false,
      },
    },
    (argv) => {
      if (!fileExists(argv.file)) {
        console.log(`Invalid "${argv.file}" OpenAPI specification file path`)
        return
      }

      const directoryCreated = createDirectory(argv.outputDir)
      if (!directoryCreated) {
        console.log(
          `An error ocurred while checking output directory "${argv.outputDir}"`,
        )
        return
      }

      run({
        openAPIFilePath: argv.file,
        outputDirectoryPath: argv.outputDir,
        prettyOutput: argv.prettyOutput,
      }).catch(() => {
        console.log('An error ocurred')
        process.exit(1)
      })
    },
  )
  .help()
  .parse()
