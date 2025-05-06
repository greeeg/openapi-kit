#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'

import { createDirectory, fileExists } from '../src/utils/fileSystem'
import { getGenerationOptions } from './functions'
import { run } from './run'

const y = yargs(hideBin(process.argv))

y.command(
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
    types: {
      type: 'boolean',
      default: false,
      describe: 'Generate types',
      demandOption: false,
    },
    apiClient: {
      type: 'boolean',
      default: false,
      describe: 'Generate API client',
      demandOption: false,
    },
    mockData: {
      type: 'boolean',
      default: false,
      describe: 'Generate mock data',
      demandOption: false,
    },
    reactQuery: {
      type: 'boolean',
      default: false,
      describe: 'Generate `react-query` hooks & provider',
      demandOption: false,
    },
  },
  (argv) => {
    const {
      file,
      outputDir,
      prettyOutput,
      types,
      apiClient,
      mockData,
      reactQuery,
    } = argv

    if (!fileExists(file)) {
      console.log(`Invalid "${file}" OpenAPI specification file path`)
      process.exit(1)
    }

    const directoryCreated = createDirectory(outputDir)
    if (!directoryCreated) {
      console.log(
        `An error ocurred while checking output directory "${outputDir}"`,
      )
      process.exit(1)
    }

    const generationOptions = getGenerationOptions({
      types,
      apiClient,
      mockData,
      reactQuery,
    })

    run({
      openAPIFilePath: file,
      outputDirectoryPath: outputDir,
      prettyOutput,
      generationOptions,
    }).catch(() => {
      console.log('An error ocurred')
      process.exit(1)
    })
  },
)
  .help()
  .parse()
