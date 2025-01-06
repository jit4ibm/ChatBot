import { ZodEffects, ZodType } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { findFirstPair } from './string.js';
import { ValueError } from '../../errors.js';
import { jsonrepair } from 'jsonrepair';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function validateSchema(schema, errorOptions) {
  if (schema && schema instanceof ZodEffects) {
    throw new ValueError("zod effects (refine, superRefine, transform, ...) cannot be converted to JSONSchema!", [], errorOptions);
  }
}
__name(validateSchema, "validateSchema");
function toJsonSchema(schema, options) {
  validateSchema(schema);
  if (schema instanceof ZodType) {
    return zodToJsonSchema(schema, options);
  }
  return schema;
}
__name(toJsonSchema, "toJsonSchema");
function createSchemaValidator(schema, options) {
  const jsonSchema = toJsonSchema(schema);
  const ajv = new Ajv({
    coerceTypes: "array",
    useDefaults: true,
    strict: false,
    strictSchema: false,
    strictTuples: true,
    strictNumbers: true,
    strictTypes: true,
    strictRequired: true,
    parseDate: true,
    allowDate: true,
    allowUnionTypes: true,
    ...options
  });
  addFormats.default(ajv);
  return ajv.compile(jsonSchema);
}
__name(createSchemaValidator, "createSchemaValidator");
function parseBrokenJson(input, options) {
  input = (input ?? "")?.trim();
  try {
    try {
      return JSON.parse(input);
    } catch {
      const pair = options?.pair;
      if (pair) {
        const { outer } = findFirstPair(input, pair) ?? {
          outer: input
        };
        return JSON.parse(jsonrepair(outer));
      } else {
        return JSON.parse(jsonrepair(input));
      }
    }
  } catch {
    return null;
  }
}
__name(parseBrokenJson, "parseBrokenJson");

export { createSchemaValidator, parseBrokenJson, toJsonSchema, validateSchema };
//# sourceMappingURL=schema.js.map
//# sourceMappingURL=schema.js.map