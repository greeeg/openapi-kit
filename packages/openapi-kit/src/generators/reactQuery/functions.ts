import { OpenAPIV3 } from 'openapi-types'
import * as ts from 'typescript'

import { Operation, isParameterObject } from '../../utils/openAPI'
import { toValidIdentifier } from '../../utils/typescript'
import { ReactQueryGeneratorOptions } from './types'

export const buildQueryParamsInterface = (
  operationName: string,
  operation: OpenAPIV3.OperationObject,
): string[] => {
  const hasPathParameters = !!operation.parameters
    ?.filter(isParameterObject)
    .some((param) => param.in === 'path')
  const hasQueryParameters = !!operation.parameters
    ?.filter(isParameterObject)
    .some((param) => param.in === 'query')
  const hasBodyParameters = !!operation.requestBody

  return [
    `export interface ${operationName}Parameters {`,
    ...(hasPathParameters
      ? [`pathParams: Paths.${operationName}.PathParameters,`]
      : []),
    ...(hasQueryParameters
      ? [`queryParams: Paths.${operationName}.QueryParameters,`]
      : []),
    ...(hasBodyParameters ? [`body: Paths.${operationName}.RequestBody,`] : []),
    `}`,
  ]
}

export const buildQuery = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  operation,
}: Operation) => {
  const firstResponseName = Object.keys(operation.responses ?? {}).at(0)
  const responseType = firstResponseName
    ? `Paths.${pascalCaseOperationId}.Responses.${toValidIdentifier(
        firstResponseName,
      )}`
    : 'unknown'

  return [
    ...buildQueryParamsInterface(pascalCaseOperationId, operation),
    ``,
    `export const get${pascalCaseOperationId}QueryKey = (parameters?: ${pascalCaseOperationId}Parameters | Partial<${pascalCaseOperationId}Parameters>) => {`,
    `  return parameters ? ['${camelCaseOperationId}', parameters] : ['${camelCaseOperationId}']`,
    `}`,
    ``,
    `export const use${pascalCaseOperationId} = (`,
    `  parameters: ${pascalCaseOperationId}Parameters,`,
    `  options?: Omit<UseQueryOptions<${responseType}, unknown>,`,
    `    'queryKey' | 'queryFn'`,
    `  >`,
    `) => {`,
    `  const apiClient = useAPIClient()`,
    `  const queryKey = get${pascalCaseOperationId}QueryKey(parameters)`,
    ``,
    `  return useQuery<${responseType}, unknown>({`,
    `    queryKey,`,
    `    queryFn: async () => {`,
    `      const response = await apiClient.${camelCaseOperationId}(`,
    `        parameters`,
    `      )`,
    ``,
    `      if (!response.ok) {`,
    `        return Promise.reject(response)`,
    `      }`,
    ``,
    `      return response.data`,
    `    },`,
    `    ...options`,
    `  })`,
    `}`,
    ``,
    `export const useLazy${pascalCaseOperationId} = (`,
    `  parameters: Partial<${pascalCaseOperationId}Parameters>,`,
    `  options?: Omit<UseQueryOptions<${responseType}, unknown>,`,
    `    'queryKey' | 'queryFn'`,
    `  >`,
    `) => {`,
    `  const apiClient = useAPIClient()`,
    `  const queryKey = get${pascalCaseOperationId}QueryKey(parameters)`,
    ``,
    `  return useQuery<${responseType}, unknown>({`,
    `    queryKey,`,
    `    queryFn: async () => {`,
    `      const response = await apiClient.${camelCaseOperationId}(`,
    `        parameters as ${pascalCaseOperationId}Parameters`,
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
  ]
}

export const buildMutation = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  operation,
}: Operation) => {
  const firstResponseName = Object.keys(operation.responses ?? {}).at(0)
  const responseType = firstResponseName
    ? `Paths.${pascalCaseOperationId}.Responses.${toValidIdentifier(
        firstResponseName,
      )}`
    : 'unknown'

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
    `    mutationFn: async (variables: ${pascalCaseOperationId}Parameters) => {`,
    `      const response = await apiClient.${camelCaseOperationId}(variables);`,
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
