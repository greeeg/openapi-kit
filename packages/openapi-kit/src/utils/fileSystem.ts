import fs from 'fs'

export const writeFile = (outputPath: string, fileContent: string) => {
  fs.writeFileSync(outputPath, fileContent, 'utf-8')
}
