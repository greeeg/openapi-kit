import { OpenAPIV3 } from 'openapi-types'

import {
  Operation,
  getResponseType,
  hasOperationParameters,
} from '../../utils/openAPI'

export const buildParamsInterface = (
  operationName: string,
  operation: OpenAPIV3.OperationObject,
): string[] => {
  const { has, inBody, inPath, inQuery } = hasOperationParameters(operation)

  if (!has) {
    return []
  }

  return [
    `interface ${operationName}Params extends Params {`,
    ...(inPath ? [`pathParams: Paths.${operationName}.PathParameters,`] : []),
    ...(inQuery
      ? [`queryParams: Paths.${operationName}.QueryParameters,`]
      : []),
    ...(inBody ? [`body: Paths.${operationName}.RequestBody,`] : []),
    `}`,
  ]
}

export const buildFunction = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  httpMethod,
  operation,
  path,
}: Operation) => {
  const { has, inBody, inPath, inQuery } = hasOperationParameters(operation)
  const params = has ? `params: ${pascalCaseOperationId}Params` : ''
  const type = getResponseType({ operation, pascalCaseOperationId })

  return [
    `const ${camelCaseOperationId} = async (${params}): Promise<APIClientResponse<${type}, unknown>> => {`,
    `  const response = await fetch(`,
    `    createUrl({`,
    `      baseUrl: config.baseUrl,`,
    ...(inPath
      ? [
          `path: createPath("${path}", params.pathParams),`,
          'pathParams: params.pathParams,',
        ]
      : [`path: createPath("${path}"),`]),
    ...(inQuery ? [`queryParams: params.queryParams,`] : []),
    `    }),`,
    `    {`,
    `      method: "${httpMethod}",`,
    ...(inBody ? [`body: JSON.stringify(params.body),`] : []),
    `      headers: {`,
    `        "Content-Type": "application/json",`,
    `        ...headers`,
    `      },`,
    `      ...configRest`,
    `    }`,
    `  )`,
    `  const data = await response.json().catch(() => null)`,
    `  if (!response.ok) {`,
    `    onError?.(response.status, response)`,
    `    return {`,
    `      ok: false,`,
    `      statusCode: response.status,`,
    `      error: data`,
    `    }`,
    `  }`,
    ``,
    `  return {`,
    `    ok: true,`,
    `    statusCode: response.status,`,
    `    data`,
    `  }`,
    `}`,
  ]
}

export const getHeaderLines = (typeDefinitionsImportPath: string) => [
  `import queryString from "query-string";`,
  `import { Paths } from "${typeDefinitionsImportPath}";`,
  ``,
  `export interface APIClientSuccessResponse<DataType> {`,
  `  ok: true`,
  `  statusCode: number`,
  `  data: DataType`,
  `}`,
  ``,
  `export interface APIClientErrorResponse<ErrorType> {`,
  `  ok: false`,
  `  statusCode: number`,
  `  error: ErrorType`,
  `}`,
  ``,
  `export type APIClientResponse<DataType, ErrorType> =`,
  `  | APIClientSuccessResponse<DataType>`,
  `  | APIClientErrorResponse<ErrorType>`,
  ``,
  `export interface APIClientConfig extends Omit<RequestInit, "method"> {`,
  `  baseUrl: string;`,
  `  onError?: (statusCode: number, response: Response) => void;`,
  `}`,
  ``,
  `const createPath = (path: string, pathParams?: object): string => {`,
  `  if (!pathParams) {`,
  `    return path;`,
  `  }`,
  ``,
  `  return Object.entries(pathParams).reduce<string>((acc, [key, value]) => {`,
  `    return acc`,
  '      .replace(new RegExp(`{${key}}`, "gi"), value.toString())',
  '      .replace(new RegExp(`:${key}`, "gi"), value.toString());',
  `  }, path);`,
  `};`,
  ``,
  `interface CreateUrlParams {`,
  `  baseUrl: string;`,
  `  path: string;`,
  `  pathParams?: object;`,
  `  queryParams?: object;`,
  `}`,
  ``,
  `const createUrl = ({`,
  `  baseUrl,`,
  `  path,`,
  `  pathParams,`,
  `  queryParams`,
  `}: CreateUrlParams): string => {`,
  `  const fullUrl = [`,
  `    baseUrl,`,
  `    createPath(path, pathParams)`,
  `  ].join("");`,
  `  const query = queryParams`,
  `    ? queryString.stringify(queryParams, { arrayFormat: "comma" })`,
  `    : "";`,
  `  return [fullUrl, query].filter(Boolean).join("?");`,
  `};`,
  ``,
  `interface Params {`,
  `  pathParams?: object;`,
  `  queryParams?: object;`,
  `  body?: object;`,
  `}`,
]
