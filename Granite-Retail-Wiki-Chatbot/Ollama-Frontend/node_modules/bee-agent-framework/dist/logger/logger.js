import { pino } from 'pino';
import { FrameworkError } from '../errors.js';
import { Serializable } from '../internals/serializable.js';
import { Cache } from '../cache/decoratorCache.js';
import { parseEnv } from '../internals/env.js';
import { z } from 'zod';
import { isTruthy } from 'remeda';
import { shallowCopy } from '../serializer/utils.js';
import { stdout } from 'node:process';
import * as url from 'node:url';
import path from 'node:path';

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
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
class LoggerError extends FrameworkError {
  static {
    __name(this, "LoggerError");
  }
}
const LoggerLevel = {
  DEBUG: "debug",
  ERROR: "error",
  FATAL: "fatal",
  INFO: "info",
  TRACE: "trace",
  WARN: "warn",
  SILENT: "silent"
};
class Logger extends Serializable {
  static {
    __name(this, "Logger");
  }
  input;
  raw;
  info;
  warn;
  fatal;
  error;
  debug;
  trace;
  silent;
  static {
    this.register();
  }
  get level() {
    return this.raw.level;
  }
  set level(value) {
    this.raw.level = value;
  }
  constructor(input, raw) {
    super(), this.input = input;
    this.raw = raw;
    this.init();
  }
  static of(input) {
    return new Logger(input);
  }
  init() {
    const parent = this.raw || Logger.root.raw;
    const instance = parent.child({
      ...this.input.bindings,
      name: this.input.name ?? this.input.bindings?.name
    }, {
      ...this.input.raw,
      level: this.input.level ?? this.input.raw?.level
    });
    this.raw = instance;
    this.info = instance.info.bind(instance);
    this.warn = instance.warn.bind(instance);
    this.fatal = instance.fatal.bind(instance);
    this.error = instance.error.bind(instance);
    this.debug = instance.debug.bind(instance);
    this.trace = instance.trace.bind(instance);
    this.silent = instance.silent.bind(instance);
  }
  static get root() {
    return new Logger(Logger.defaults, Logger.createRaw(Logger.defaults));
  }
  static get defaults() {
    return {
      name: void 0,
      pretty: parseEnv.asBoolean("BEE_FRAMEWORK_LOG_PRETTY", false),
      bindings: {},
      level: parseEnv("BEE_FRAMEWORK_LOG_LEVEL", z.nativeEnum(LoggerLevel).default(LoggerLevel.INFO))
    };
  }
  child(input) {
    const name = [
      this.input.name,
      input?.name
    ].filter(isTruthy).join(".");
    return new Logger({
      ...this.input,
      level: this.level,
      ...input,
      name,
      bindings: {
        name
      }
    }, this.raw);
  }
  createSnapshot() {
    return {
      input: shallowCopy(this.input),
      level: this.raw.level
    };
  }
  loadSnapshot({ level, ...extra }) {
    Object.assign(this, extra);
    this.init();
    this.raw.level = level;
  }
  static createRaw(options, stream) {
    const defaults = Logger.defaults;
    const isPretty = defaults.pretty;
    const targetStream = stream ?? (isPretty ? pino.destination(stdout) : void 0);
    return pino({
      ...isPretty && {
        transport: {
          target: path.join(__dirname, "pretty.js"),
          options: {
            messageKey: "message",
            nestedKey: void 0,
            errorKey: "error",
            colorize: true,
            sync: true,
            singleLine: parseEnv.asBoolean("BEE_FRAMEWORK_LOG_SINGLE_LINE", false)
          }
        }
      },
      messageKey: "message",
      nestedKey: defaults.pretty ? void 0 : "payload",
      errorKey: "error",
      timestamp: true,
      name: defaults.name,
      level: defaults.level,
      ...options,
      formatters: {
        bindings: /* @__PURE__ */ __name(({ pid: _, hostname: __, ...others }) => {
          return others;
        }, "bindings"),
        log: /* @__PURE__ */ __name((record) => {
          return record;
        }, "log"),
        level: /* @__PURE__ */ __name((label) => {
          return {
            level: label.toUpperCase()
          };
        }, "level"),
        ...options?.formatters
      }
    }, targetStream);
  }
}
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", void 0),
  _ts_metadata("design:paramtypes", [])
], Logger, "root", null);
_ts_decorate([
  Cache(),
  _ts_metadata("design:type", Object),
  _ts_metadata("design:paramtypes", [])
], Logger, "defaults", null);

export { Logger, LoggerError, LoggerLevel };
//# sourceMappingURL=logger.js.map
//# sourceMappingURL=logger.js.map