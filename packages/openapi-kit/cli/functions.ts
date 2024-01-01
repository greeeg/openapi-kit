import { GenerationOptions } from './types'

/**
 * If user did not specify any generation preferences,
 * generate all of them.
 */
export const getGenerationOptions = (
  choices: GenerationOptions,
): GenerationOptions => {
  const { types, apiClient, mockData, reactQuery } = choices

  if (!types && !apiClient && !mockData && !reactQuery) {
    return {
      types: true,
      apiClient: true,
      mockData: true,
      reactQuery: true,
    }
  }

  const generationOptions: GenerationOptions = {
    types,
    apiClient,
    mockData,
    reactQuery,
  }

  if (apiClient || mockData || reactQuery) {
    // Types are used by all of these
    generationOptions.types = true
  }

  if (reactQuery) {
    // API client is used by react-query hooks & provider
    generationOptions.apiClient = true
  }

  return generationOptions
}
