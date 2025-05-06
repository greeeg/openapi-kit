import { existsSync, lstatSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'

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
  mkdirSync(path.dirname(outputFilePath), { recursive: true })
  writeFileSync(outputFilePath, fileContent, 'utf-8')
}
