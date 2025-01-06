import { FrameworkError } from '../errors.js';
import * as R from 'remeda';
import { doNothing, toCamelCase } from 'remeda';
import { Retryable } from '../internals/helpers/retryable.js';
import { Serializable } from '../internals/serializable.js';
import { Task } from 'promise-based-task';
import { Cache, WeakRefKeyFn, ObjectHashKeyFn } from '../cache/decoratorCache.js';
import { NullCache } from '../cache/nullCache.js';
import { toJsonSchema, validateSchema, createSchemaValidator } from '../internals/helpers/schema.js';
import { validate } from '../internals/helpers/general.js';
import { z, ZodSchema } from 'zod';
import { Emitter } from '../emitter/emitter.js';
import { RunContext } from '../context.js';
import { shallowCopy } from '../serializer/utils.js';
import { INSTRUMENTATION_ENABLED } from '../instrumentation/config.js';
import { createTelemetryMiddleware } from '../instrumentation/create-telemetry-middleware.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}
__name(_ts_decorate, "_ts_decorate");
function _ts_metadata(k, v) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
__name(_ts_metadata, "_ts_metadata");
class ToolError extends FrameworkError {
  static {
    __name(this, "ToolError");
  }
}
class ToolInputValidationError extends ToolError {
  static {
    __name(this, "ToolInputValidationError");
  }
  validationErrors;
  constructor(message, validationErrors = []) {
    super(message, []);
    this.validationErrors = validationErrors;
  }
}
class ToolOutput extends Serializable {
  static {
    __name(this, "ToolOutput");
  }
  toString() {
    return this.getTextContent();
  }
}
class StringToolOutput extends ToolOutput {
  static {
    __name(this, "StringToolOutput");
  }
  result;
  ctx;
  constructor(result = "", ctx) {
    super(), this.result = result, this.ctx = ctx;
    this.result = result ?? "";
  }
  static {
    this.register();
  }
  isEmpty() {
    return !this.result;
  }
  getTextContent() {
    return this.result.toString();
  }
  createSnapshot() {
    return {
      result: this.result,
      ctx: this.ctx
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}
_ts_decorate([
  Cache({
    cacheKey: WeakRefKeyFn.from((self) => [
      self.result
    ])
  }),
  _ts_metadata("design:type", Function),
  _ts_metadata("design:paramtypes", []),
  _ts_metadata("design:returntype", String)
], StringToolOutput.prototype, "getTextContent", null);
class JSONToolOutput extends ToolOutput {
  static {
    __name(this, "JSONToolOutput");
  }
  result;
  ctx;
  constructor(result, ctx) {
    super(), this.result = result, this.ctx = ctx;
  }
  static {
    this.register();
  }
  isEmpty() {
    return !this.result || R.isEmpty(this.result);
  }
  getTextContent() {
    return JSON.stringify(this.result);
  }
  createSnapshot() {
    return {
      result: this.result,
      ctx: this.ctx
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}
class Tool extends Serializable {
  static {
    __name(this, "Tool");
  }
  cache;
  options;
  static contextKeys = {
    Memory: Symbol("Memory")
  };
  constructor(...args) {
    super();
    const [options] = args;
    this.options = options ?? {};
    this.cache = options?.cache ? options.cache : new NullCache();
  }
  toError(e, context) {
    if (e instanceof ToolError) {
      Object.assign(e.context, context);
      return e;
    } else {
      return new ToolError(`Tool "${this.name}" has occurred an error!`, [
        e
      ], {
        context
      });
    }
  }
  run(input, options = {}) {
    input = shallowCopy(input);
    options = shallowCopy(options);
    return RunContext.enter(this, {
      signal: options?.signal,
      params: [
        input,
        options
      ]
    }, async (run) => {
      const meta = {
        input,
        options
      };
      let errorPropagated = false;
      try {
        input = Object.assign({
          ref: input
        }, {
          ref: await this.parse(input)
        }).ref;
        const output = await new Retryable({
          executor: /* @__PURE__ */ __name(async () => {
            errorPropagated = false;
            await run.emitter.emit("start", {
              ...meta
            });
            return this.cache.enabled ? await this._runCached(input, options, run) : await this._run(input, options, run);
          }, "executor"),
          onError: /* @__PURE__ */ __name(async (error) => {
            errorPropagated = true;
            await run.emitter.emit("error", {
              error: this.toError(error, meta),
              ...meta
            });
            if (this.options.fatalErrors?.some((cls) => error instanceof cls)) {
              throw error;
            }
          }, "onError"),
          onRetry: /* @__PURE__ */ __name(async (_, error) => {
            await run.emitter.emit("retry", {
              ...meta,
              error: this.toError(error, meta)
            });
          }, "onRetry"),
          config: {
            ...this._createRetryOptions(options?.retryOptions),
            signal: options?.signal
          }
        }).get();
        await run.emitter.emit("success", {
          output,
          ...meta
        });
        return output;
      } catch (e) {
        const error = this.toError(e, meta);
        if (!errorPropagated) {
          await run.emitter.emit("error", {
            error,
            options,
            input
          });
        }
        throw error;
      } finally {
        await run.emitter.emit("finish", null);
      }
    }).middleware(INSTRUMENTATION_ENABLED ? createTelemetryMiddleware() : doNothing());
  }
  async _runCached(input, options, run) {
    const key = ObjectHashKeyFn({
      input,
      options: R.omit(options ?? {}, [
        "signal",
        "retryOptions"
      ])
    });
    const cacheEntry = await this.cache.get(key);
    if (cacheEntry !== void 0) {
      return cacheEntry;
    }
    const task = new Task();
    await this.cache.set(key, task);
    this._run(input, options, run).then((req) => task.resolve(req)).catch(async (err) => {
      void task.reject(err);
      await this.cache.delete(key);
    });
    return task;
  }
  async clearCache() {
    await this.cache.clear();
  }
  async getInputJsonSchema() {
    return toJsonSchema(await this.inputSchema());
  }
  static isTool(value) {
    return value instanceof Tool && "name" in value && "description" in value;
  }
  _createRetryOptions(...overrides) {
    const defaultOptions = {
      maxRetries: 0,
      factor: 1
    };
    return R.pipe([
      defaultOptions,
      this.options.retryOptions,
      ...overrides
    ], R.filter(R.isTruthy), R.map((input) => {
      const options = {
        maxRetries: input.maxRetries ?? defaultOptions.maxRetries,
        factor: input.factor ?? defaultOptions.maxRetries
      };
      return R.pickBy(options, R.isDefined);
    }), R.mergeAll);
  }
  async parse(input) {
    const schema = await this.inputSchema();
    if (schema) {
      validateSchema(schema, {
        context: {
          tool: this.constructor.name,
          hint: `To do post-validation override the '${this.validateInput.name}' method.`,
          schema,
          isFatal: true,
          isRetryable: false
        }
      });
    }
    const copy = shallowCopy(input);
    this.preprocessInput(copy);
    this.validateInput(schema, copy);
    return copy;
  }
  // eslint-disable-next-line unused-imports/no-unused-vars
  preprocessInput(rawInput) {
  }
  validateInput(schema, rawInput) {
    const validator = createSchemaValidator(schema);
    const success = validator(rawInput);
    if (!success) {
      throw new ToolInputValidationError(
        [
          `The received tool input does not match the expected schema.`,
          `Input Schema: "${JSON.stringify(toJsonSchema(schema))}"`,
          `Validation Errors: ${JSON.stringify(validator.errors)}`
        ].join("\n"),
        // ts doesn't infer that when success is false `validator.errors` is defined
        validator.errors
      );
    }
  }
  createSnapshot() {
    return {
      name: this.name,
      description: this.description,
      cache: this.cache,
      options: shallowCopy(this.options),
      emitter: this.emitter
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
  pipe(tool, mapper) {
    return new DynamicTool({
      name: this.name,
      description: this.description,
      options: this.options,
      inputSchema: this.inputSchema(),
      handler: /* @__PURE__ */ __name(async (input, options, run) => {
        const selfOutput = await this.run(input, options);
        const wrappedInput = mapper(input, selfOutput, options, run);
        return await tool.run(wrappedInput);
      }, "handler")
    });
  }
  extend(schema, mapper, overrides = {}) {
    return new DynamicTool({
      name: overrides?.name || this.name,
      description: overrides?.name || this.description,
      options: shallowCopy(this.options),
      inputSchema: schema,
      handler: /* @__PURE__ */ __name(async (input, options, run) => {
        const wrappedInput = mapper(input, options, run);
        return await this.run(wrappedInput, options);
      }, "handler")
    });
  }
}
class DynamicTool extends Tool {
  static {
    __name(this, "DynamicTool");
  }
  static {
    this.register();
  }
  _inputSchema;
  handler;
  inputSchema() {
    return this._inputSchema;
  }
  constructor(fields) {
    validate(fields, z.object({
      name: z.string({
        message: "Tool must have a name"
      }).refine((val) => /^[a-zA-Z0-9\-_]+$/.test(val), {
        message: "Tool name must only have -, _, letters or numbers"
      }),
      description: z.string({
        message: "Tool must have a description"
      }).refine((val) => val && val !== "", {
        message: "Tool must have a description"
      }),
      inputSchema: z.union([
        z.instanceof(ZodSchema),
        z.object({}).passthrough()
      ], {
        message: "Tool must have a schema"
      }),
      handler: z.function(),
      options: z.object({}).passthrough().optional()
    }));
    super(...[
      fields.options
    ]);
    this.name = fields.name;
    this.description = fields.description;
    this._inputSchema = fields.inputSchema;
    this.handler = fields.handler;
    this.emitter = Emitter.root.child({
      namespace: [
        "tool",
        "dynamic",
        toCamelCase(this.name)
      ],
      creator: this
    });
  }
  _run(arg, options, run) {
    return this.handler(arg, options, run);
  }
  createSnapshot() {
    return {
      ...super.createSnapshot(),
      handler: this.handler,
      _inputSchema: this._inputSchema
    };
  }
  loadSnapshot({ handler, ...snapshot }) {
    super.loadSnapshot(snapshot);
    Object.assign(this, {
      handler
    });
  }
}

export { DynamicTool, JSONToolOutput, StringToolOutput, Tool, ToolError, ToolInputValidationError, ToolOutput };
//# sourceMappingURL=base.js.map
//# sourceMappingURL=base.js.map