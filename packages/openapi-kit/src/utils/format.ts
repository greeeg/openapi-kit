import * as prettier from 'prettier'

export const formatOutput = async (content: string) => {
  const formattedContent = await prettier.format(content, {
    semi: false,
    parser: 'babel-ts',
  })

  return formattedContent
}
