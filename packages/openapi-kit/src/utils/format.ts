import * as prettier from 'prettier'

export const formatOutput = async (content: string, shouldRun: boolean) => {
  if (!shouldRun) {
    return content
  }

  const formattedContent = await prettier.format(content, {
    semi: false,
    parser: 'babel-ts',
  })

  return formattedContent
}
