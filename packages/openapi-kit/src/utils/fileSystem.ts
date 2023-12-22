import { existsSync, lstatSync, mkdirSync, outputFileSync } from 'fs-extra'

export const directoryExists = (directoryPath: string) => {
  try {
    return lstatSync(directoryPath).isDirectory()
  } catch (err) {
    // lstatSync throws an error if path doesn't exist
    return false
  }
}

export const createDirectory = (directoryPath: string): boolean => {
  try {
    mkdirSync(directoryPath, { recursive: true })
    return true
  } catch (err) {
    return false
  }
}

export const fileExists = (filePath: string): boolean => {
  return existsSync(filePath)
}

export const writeFile = (outputFilePath: string, fileContent: string) => {
  outputFileSync(outputFilePath, fileContent, 'utf-8')
}
