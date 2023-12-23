import { faker } from '@faker-js/faker'

import { OpenAPISchemaObject } from '../../types'
import {
  isArraySchemaObject,
  isNonArraySchemaObject,
  isRefObject,
  isSchemaObject,
} from '../../utils/openAPI'

const getExampleOrFallback = (
  schema: OpenAPISchemaObject,
  fallback: () => unknown,
) => {
  if (schema.example) {
    return schema.example
  }

  return fallback()
}

const randomElementFromArray = <K>(array: K[]) => {
  return array[Math.floor(Math.random() * array.length)]
}

const randomArrayItemsCount = () => {
  return Math.round(Math.random()) + 1
}

const randomBoolean = () => Math.round(Math.random()) === 0

const randomNumber = (schema: OpenAPISchemaObject) => {
  return getExampleOrFallback(schema, () => {
    if (schema.format) {
      switch (schema.format) {
        case 'int32':
          return faker.number.int()
        case 'int64':
          return faker.number.int()
        case 'float':
          return faker.number.float()
        case 'double':
          return faker.number.float()
      }
    }

    return faker.number.float({ min: 0, max: 99999, precision: 0.1 })
  })
}

const randomString = (schema: OpenAPISchemaObject) => {
  return getExampleOrFallback(schema, () => {
    if (schema.enum) {
      return randomElementFromArray(schema.enum)
    }

    if (schema.format) {
      switch (schema.format) {
        case 'uuid':
          return faker.string.uuid()
        case 'uri':
          return faker.internet.url()
        case 'date':
          return faker.date.past().toISOString().split('T')[0]
        case 'date-time':
        case 'datetime':
          return faker.date.past().toISOString()
        case 'ipv6':
          return faker.internet.ipv6()
        case 'ipv4':
          return faker.internet.ipv4()
        case 'email':
          return faker.internet.email()
        case 'binary':
          return faker.string.binary()
      }
    }

    return faker.lorem.word()
  })
}

export const generateMock = (schema: OpenAPISchemaObject): unknown => {
  let object: unknown = {}

  if (isArraySchemaObject(schema)) {
    const itemShape = schema.items
    // @ts-expect-error
    if (!isSchemaObject(itemShape)) {
      return null
    }

    return Array.from({ length: randomArrayItemsCount() }).map(() =>
      generateMock(itemShape),
    )
  }

  // TODO: What to do with this?
  if (!isNonArraySchemaObject(schema)) {
    return null
  }

  if ('nullable' in schema && schema.nullable) {
    if (randomBoolean()) {
      return null
    }
  }

  if (schema.anyOf) {
    const validOptions = schema.anyOf.filter(
      (option) => !isRefObject(option),
    ) as OpenAPISchemaObject[]
    return generateMock(randomElementFromArray(validOptions))
  }

  if (schema.oneOf) {
    const validOptions = schema.oneOf.filter(
      (option) => !isRefObject(option),
    ) as OpenAPISchemaObject[]
    return generateMock(randomElementFromArray(validOptions))
  }

  if (schema.allOf) {
    const validOptions = schema.allOf.filter(
      (option) => !isRefObject(option),
    ) as OpenAPISchemaObject[]
    return validOptions.map((option) => generateMock(option))
  }

  switch (schema.type) {
    case 'string':
      object = randomString(schema)
      break
    case 'boolean':
      object = getExampleOrFallback(schema, () => randomBoolean())
      break
    case 'integer':
      object = getExampleOrFallback(schema, () =>
        faker.number.int({ min: 0, max: 99999 }),
      )
      break
    case 'number':
      object = randomNumber(schema)
      break
    case 'null':
      object = getExampleOrFallback(schema, () => null)
      break
    case 'object': {
      object = {}
      if (schema.properties) {
        for (const [propertyName, propertyValue] of Object.entries(
          schema.properties,
        )) {
          if (!isSchemaObject(propertyValue)) {
            continue
          }

          ;(object as Record<string, unknown>)[propertyName] =
            generateMock(propertyValue)
        }
      }
      break
    }
  }

  return object
}
