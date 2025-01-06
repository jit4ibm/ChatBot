'use strict';

var zod = require('zod');
var zodToJsonSchema = require('zod-to-json-schema');
var ajv = require('ajv');
var addFormats = require('ajv-formats');
var string_cjs = require('./string.cjs');
var errors_cjs = require('../../errors.cjs');
var jsonrepair = require('jsonrepair');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var addFormats__default = /*#__PURE__*/_interopDefault(addFormats);

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function validateSchema(schema, errorOptions) {
  if (schema && schema instanceof zod.ZodEffects) {
    throw new errors_cjs.ValueError("zod effects (refine, superRefine, transform, ...) cannot be converted to JSONSchema!", [], errorOptions);
  }
}
__name(validateSchema, "validateSchema");
function toJsonSchema(schema, options) {
  validateSchema(schema);
  if (schema instanceof zod.ZodType) {
    return zodToJsonSchema.zodToJsonSchema(schema, options);
  }
  return schema;
}
__name(toJsonSchema, "toJsonSchema");
function createSchemaValidator(schema, options) {
  const jsonSchema = toJsonSchema(schema);
  const ajv$1 = new ajv.Ajv({
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
  addFormats__default.default.default(ajv$1);
  return ajv$1.compile(jsonSchema);
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
        const { outer } = string_cjs.findFirstPair(input, pair) ?? {
          outer: input
        };
        return JSON.parse(jsonrepair.jsonrepair(outer));
      } else {
        return JSON.parse(jsonrepair.jsonrepair(input));
      }
    }
  } catch {
    return null;
  }
}
__name(parseBrokenJson, "parseBrokenJson");

exports.createSchemaValidator = createSchemaValidator;
exports.parseBrokenJson = parseBrokenJson;
exports.toJsonSchema = toJsonSchema;
exports.validateSchema = validateSchema;
//# sourceMappingURL=schema.cjs.map
//# sourceMappingURL=schema.cjs.map