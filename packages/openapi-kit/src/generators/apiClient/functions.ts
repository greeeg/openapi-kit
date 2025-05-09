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
  const { has, inBody, inPath, inQuery, requestBodyType } =
    hasOperationParameters(operation)

  if (!has) {
    return []
  }

  return [
    `interface ${operationName}Params extends Params {`,
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
    ``,
  ]
}

export const buildFunction = ({
  pascalCaseOperationId,
  camelCaseOperationId,
  httpMethod,
  operation,
  path,
}: Operation) => {
  const { has, inBody, inPath, inQuery, requestBodyType } =
    hasOperationParameters(operation)
  const params = has ? `params: ${pascalCaseOperationId}Params` : ''
  const type = getResponseType({ operation, pascalCaseOperationId })

  return [
    `  const ${camelCaseOperationId} = async (${params}): Promise<APIClientResponse<${type}, unknown>> => {`,
    `    try {`,
    `      const config = await onRequest?.() || {};`,
    `      const response = await fetch(`,
    `        createUrl({`,
    `          baseUrl,`,
    ...(inPath
      ? [
          `          path: createPath("${path}", params.pathParams),`,
          '          pathParams: params.pathParams,',
        ]
      : [`          path: createPath("${path}"),`]),
    ...(inQuery ? [`          queryParams: params.queryParams,`] : []),
    `        }),`,
    `        {`,
    `          method: "${httpMethod}",`,
    ...(inBody
      ? [
          requestBodyType === 'formData'
            ? `          body: params.body,`
            : `          body: JSON.stringify(params.body),`,
        ]
      : []),
    `          headers: {`,
    ...(requestBodyType !== 'formData'
      ? [`            "Content-Type": "application/json",`]
      : []),
    `            ...config.headers`,
    `          },`,
    `          ...config`,
    `        }`,
    `      )`,
    ``,
    `      if (!response.ok) {`,
    `        throw new HTTPRequestError({ statusCode: response.status, response });`,
    `      }`,
    ``,
    `      const data = await response.json()`,
    ``,
    `      return {`,
    `        ok: true,`,
    `        statusCode: response.status,`,
    `        response,`,
    `        data`,
    `      }`,
    `    } catch (error) {`,
    `      onError?.(error)`,
    ``,
    `      return {`,
    `        ok: false,`,
    `        error,`,
    `      };`,
    `    }`,
    `  }`,
    ``,
  ]
}

export const getHeaderLines = (typeDefinitionsImportPath: string) => [
  `import queryString from "query-string";`,
  `import { Paths } from "${typeDefinitionsImportPath}";`,
  ``,
  `interface HTTPRequestErrorParams {`,
  `  statusCode: number;`,
  `  response: Response;`,
  `}`,
  ``,
  `export class HTTPRequestError extends Error {`,
  `  statusCode: number;`,
  `  response: Response;`,
  ``,
  `  static statusCodes: Record<number, string> = {`,
  `    200: "OK",`,
  `    201: "Created",`,
  `    202: "Accepted",`,
  `    203: "Non-Authoritative Information",`,
  `    204: "No Content",`,
  `    205: "Reset Content",`,
  `    206: "Partial Content",`,
  `    300: "Multiple Choices",`,
  `    301: "Moved Permanently",`,
  `    302: "Found",`,
  `    303: "See Other",`,
  `    304: "Not Modified",`,
  `    305: "Use Proxy",`,
  `    306: "Unused",`,
  `    307: "Temporary Redirect",`,
  `    400: "Bad Request",`,
  `    401: "Unauthorized",`,
  `    402: "Payment Required",`,
  `    403: "Forbidden",`,
  `    404: "Not Found",`,
  `    405: "Method Not Allowed",`,
  `    406: "Not Acceptable",`,
  `    407: "Proxy Authentication Required",`,
  `    408: "Request Timeout",`,
  `    409: "Conflict",`,
  `    410: "Gone",`,
  `    411: "Length Required",`,
  `    412: "Precondition Required",`,
  `    413: "Request Entry Too Large",`,
  `    414: "Request-URI Too Long",`,
  `    415: "Unsupported Media Type",`,
  `    416: "Requested Range Not Satisfiable",`,
  `    417: "Expectation Failed",`,
  `    418: "I'm a teapot",`,
  `    429: "Too Many Requests",`,
  `    500: "Internal Server Error",`,
  `    501: "Not Implemented",`,
  `    502: "Bad Gateway",`,
  `    503: "Service Unavailable",`,
  `    504: "Gateway Timeout",`,
  `    505: "HTTP Version Not Supported",`,
  `  };`,
  ``,
  `  constructor({ statusCode, response }: HTTPRequestErrorParams) {`,
  `    super(HTTPRequestError.statusCodes[statusCode] ?? "Unknown");`,
  `    this.name = "HTTPRequestError";`,
  `    this.statusCode = statusCode;`,
  `    this.response = response;`,
  `  }`,
  `}`,
  ``,
  `export interface APIClientSuccessResponse<DataType> {`,
  `  ok: true`,
  `  statusCode: number`,
  `  response: Response`,
  `  data: DataType`,
  `}`,
  ``,
  `export interface APIClientErrorResponse<ErrorType> {`,
  `  ok: false`,
  `  error: ErrorType`,
  `}`,
  ``,
  `export type APIClientResponse<DataType, ErrorType> =`,
  `  | APIClientSuccessResponse<DataType>`,
  `  | APIClientErrorResponse<ErrorType>`,
  ``,
  `export interface APIClientConfig {`,
  `  baseUrl: string;`,
  `  onError?: (error: unknown) => void;`,
  `  onRequest?: () => Promise<Omit<RequestInit, "method">>`,
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
  ``,
  `  const query = queryParams`,
  `    ? queryString.stringify(queryParams, { arrayFormat: "comma" })`,
  `    : "";`,
  ``,
  `  return [fullUrl, query].filter(Boolean).join("?");`,
  `};`,
  ``,
  `interface Params {`,
  `  pathParams?: object;`,
  `  queryParams?: object;`,
  `  body?: object;`,
  `}`,
  ``,
]
