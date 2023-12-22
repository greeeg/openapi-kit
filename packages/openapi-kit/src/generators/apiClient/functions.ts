import { OpenAPIV3 } from 'openapi-types'

import { Operation, isParameterObject } from '../../utils/openAPI'
import { toValidIdentifier } from '../../utils/typescript'

export const buildParamsInterface = (
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
    `interface ${operationName}Params extends Params {`,
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

export const buildFunction = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  httpMethod,
  operation,
  path,
}: Operation) => {
  const firstResponseName = Object.keys(operation.responses ?? {}).at(0)
  const type = firstResponseName
    ? `Paths.${pascalCaseOperationId}.Responses.${toValidIdentifier(
        firstResponseName,
      )}`
    : 'unknown'

  return [
    `const ${camelCaseOperationId} = async (params: ${pascalCaseOperationId}Params): Promise<APIClientResponse<${type}, unknown>> => {`,
    `  const response = await fetch(`,
    `    createUrl({`,
    `      baseUrl: config.baseUrl,`,
    `      path: createPath("${path}", params.pathParams),`,
    `      pathParams: params.pathParams,`,
    `      queryParams: params.queryParams`,
    `    }),`,
    `    {`,
    `      method: "${httpMethod}",`,
    ...(operation.requestBody ? [`body: JSON.stringify(params.body),`] : []),
    `      headers: {`,
    `        "Content-Type": "application/json",`,
    `        ...headers`,
    `      },`,
    `      ...configRest`,
    `    }`,
    `  )`,
    `  const data = await response.json().catch(() => null)`,
    `  if (!response.ok) {`,
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
  `  ].join("/");`,
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
