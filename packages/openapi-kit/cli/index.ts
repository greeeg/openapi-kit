#!/usr/bin/env node
import path from 'path'
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import {
  generateAPIClient,
  generateReactQueryHooks,
  generateTypeDefinitions,
  parseDocument,
} from '../src'
import { directoryExists, fileExists } from '../src/utils/fileSystem'

interface RunOptions {
  openAPIFilePath: string
  outputDirectoryPath: string
}

const run = async ({ openAPIFilePath, outputDirectoryPath }: RunOptions) => {
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
  const typeDefinitionsOutputPath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    typeDefinitionsFileName,
  )
  const apiClientFileName = 'apiClient.ts'
  const apiClientImportPath = `./${apiClientFileName.replace('.ts', '')}`
  const apiClientOutputPath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    apiClientFileName,
  )
  const reactQueryHooksFileName = 'reactQuery.tsx'
  const reactQueryHooksOutputPath = path.resolve(
    process.cwd(),
    outputDirectoryPath,
    reactQueryHooksFileName,
  )

  generateTypeDefinitions(document, { outputPath: typeDefinitionsOutputPath })
  generateAPIClient(document, {
    outputPath: apiClientOutputPath,
    typeDefinitionsImportPath,
  })
  generateReactQueryHooks(document, {
    outputPath: reactQueryHooksOutputPath,
    typeDefinitionsImportPath,
    apiClientImportPath,
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
    },
    (argv) => {
      if (!fileExists(argv.file)) {
        console.log(`Invalid "${argv.file}" OpenAPI specification file path`)
        return
      }

      if (!directoryExists(argv.outputDir)) {
        console.log(`Invalid "${argv.outputDir}" output directory path`)
        return
      }

      run({ openAPIFilePath: argv.file, outputDirectoryPath: argv.outputDir })
        .then(() => {
          console.log('Done')
        })
        .catch(() => {
          console.log('An error ocurred')
          process.exit(1)
        })
    },
  )
  .help()
  .parse()
