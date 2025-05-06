import { OpenAPIV3 } from 'openapi-types'

import {
  Operation,
  getResponseType,
  hasOperationParameters,
} from '../../utils/openAPI'
import { ReactQueryGeneratorOptions } from './types'

const buildQueryParamsInterface = (
  operationName: string,
  operation: OpenAPIV3.OperationObject,
): string[] => {
  const { has, inBody, inPath, inQuery, requestBodyType } =
    hasOperationParameters(operation)

  if (!has) {
    return []
  }

  return [
    `export interface ${operationName}Parameters {`,
    ...(inPath ? [`  pathParams: Paths.${operationName}.PathParameters,`] : []),
    ...(inQuery
      ? [`  queryParams: Paths.${operationName}.QueryParameters,`]
      : []),
    ...(inBody
      ? [
          requestBodyType === 'formData'
            ? `  body: FormData,`
            : `  body: Paths.${operationName}.RequestBody,`,
        ]
      : []),
    `}`,
  ]
}

const buildQueryKeyFunction = ({
  operation,
  pascalCaseOperationId,
  camelCaseOperationId,
}: Pick<
  Operation,
  'camelCaseOperationId' | 'pascalCaseOperationId' | 'operation'
>): string[] => {
  const { has } = hasOperationParameters(operation)

  if (!has) {
    return [
      `export const get${pascalCaseOperationId}QueryKey = () => {`,
      `  return ['${camelCaseOperationId}']`,
      `}`,
    ]
  }

  return [
    `export const get${pascalCaseOperationId}QueryKey = (parameters?: ${pascalCaseOperationId}Parameters | Partial<${pascalCaseOperationId}Parameters> | SkipToken) => {`,
    `  return parameters ? ['${camelCaseOperationId}', parameters] : ['${camelCaseOperationId}']`,
    `}`,
  ]
}

export const buildQuery = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  operation,
}: Operation) => {
  const { has } = hasOperationParameters(operation)
  const responseType = getResponseType({ operation, pascalCaseOperationId })

  return [
    ...buildQueryParamsInterface(pascalCaseOperationId, operation),
    ``,
    ...buildQueryKeyFunction({
      camelCaseOperationId,
      pascalCaseOperationId,
      operation,
    }),
    ``,
    `export const use${pascalCaseOperationId} = (`,
    ...(has
      ? [`  parameters: ${pascalCaseOperationId}Parameters | SkipToken,`]
      : []),
    `  options?: Omit<UseQueryOptions<${responseType}, unknown>,`,
    `    'queryKey' | 'queryFn'`,
    `  >`,
    `) => {`,
    `  const apiClient = useAPIClient()`,
    ...(has
      ? [`  const queryKey = get${pascalCaseOperationId}QueryKey(parameters)`]
      : [`  const queryKey = get${pascalCaseOperationId}QueryKey()`]),
    ``,
    `  return useQuery<${responseType}, unknown>({`,
    `    queryKey,`,
    ...(has
      ? [`    queryFn: parameters !== skipToken ? async () => {`]
      : [`    queryFn: async () => {`]),
    `      const response = await apiClient.${camelCaseOperationId}(`,
    ...(has ? ['        parameters'] : []),
    `      )`,
    ``,
    `      if (!response.ok) {`,
    `        return Promise.reject(response)`,
    `      }`,
    ``,
    `      return response.data`,
    ...(has ? [`    } : skipToken,`] : [`    },`]),
    `    ...options`,
    `  })`,
    `}`,
    ``,
    `export const useLazy${pascalCaseOperationId} = (`,
    ...(has
      ? [`  parameters: Partial<${pascalCaseOperationId}Parameters>,`]
      : []),
    `  options?: Omit<UseQueryOptions<${responseType}, unknown>,`,
    `    'queryKey' | 'queryFn'`,
    `  >`,
    `) => {`,
    `  const apiClient = useAPIClient()`,
    ...(has
      ? [`  const queryKey = get${pascalCaseOperationId}QueryKey(parameters)`]
      : [`  const queryKey = get${pascalCaseOperationId}QueryKey()`]),
    ``,
    `  return useQuery<${responseType}, unknown>({`,
    `    queryKey,`,
    `    queryFn: async () => {`,
    `      const response = await apiClient.${camelCaseOperationId}(`,
    ...(has
      ? [`        parameters as ${pascalCaseOperationId}Parameters`]
      : []),
    `      )`,
    ``,
    `      if (!response.ok) {`,
    `        return Promise.reject(response)`,
    `      }`,
    ``,
    `      return response.data`,
    `    },`,
    `    enabled: false,`,
    `    ...options`,
    `  })`,
    `}`,
    ``,
  ]
}

export const buildMutation = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  operation,
}: Operation) => {
  const { has } = hasOperationParameters(operation)
  const responseType = getResponseType({ operation, pascalCaseOperationId })

  return [
    ...buildQueryParamsInterface(pascalCaseOperationId, operation),
    ``,
    `export const use${pascalCaseOperationId} = (`,
    `  options?: UseMutationOptions<`,
    `    ${responseType},`,
    `    unknown,`,
    `    ${pascalCaseOperationId}Parameters`,
    `  >`,
    `) => {`,
    `  const apiClient = useAPIClient();`,
    ``,
    `  return useMutation<`,
    `    ${responseType},`,
    `    unknown,`,
    `    ${pascalCaseOperationId}Parameters`,
    `  >({`,
    ...(has
      ? [
          `    mutationFn: async (variables: ${pascalCaseOperationId}Parameters) => {`,
          `      const response = await apiClient.${camelCaseOperationId}(variables);`,
        ]
      : [
          `    mutationFn: async () => {`,
          `      const response = await apiClient.${camelCaseOperationId}();`,
        ]),
    ``,
    `      if (!response.ok) {`,
    `        return Promise.reject(response);`,
    `      }`,
    ``,
    `      return response.data;`,
    `    },`,
    `    ...options`,
    `  });`,
    `};`,
    ``,
  ]
}

export const getHeaderLines = ({
  typeDefinitionsImportPath,
  apiClientImportPath,
}: Pick<
  ReactQueryGeneratorOptions,
  'typeDefinitionsImportPath' | 'apiClientImportPath'
>) => [
  `import { createContext, useContext, ReactNode, useMemo } from "react";`,
  ``,
  `import {`,
  `  useQuery,`,
  `  useMutation,`,
  `  UseMutationOptions,`,
  `  UseQueryOptions,`,
  `  skipToken,`,
  `  SkipToken,`,
  `} from "@tanstack/react-query";`,
  ``,
  `import { Paths } from "${typeDefinitionsImportPath}"`,
  `import { APIClientConfig, APIClient, getAPIClient } from "${apiClientImportPath}";`,
  ``,
  `interface APIClientContext {`,
  `  client: APIClient;`,
  `}`,
  ``,
  `const apiClientContext = createContext<APIClientContext>(null!);`,
  ``,
  `interface APIClientProviderProps {`,
  `  config: APIClientConfig;`,
  `  children: ReactNode;`,
  `}`,
  ``,
  `export const APIClientProvider = ({`,
  `  children,`,
  `  config`,
  `}: APIClientProviderProps) => {`,
  `  const value = useMemo(`,
  `    () => ({`,
  `      client: getAPIClient(config)`,
  `    }),`,
  `    [config]`,
  `  );`,
  ``,
  `  return (`,
  `    <apiClientContext.Provider value={value}>`,
  `      {children}`,
  `    </apiClientContext.Provider>`,
  `  );`,
  `};`,
  ``,
  `export const useAPIClient = () => useContext(apiClientContext).client;`,
  ``,
]
