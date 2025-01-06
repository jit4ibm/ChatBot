'use strict';

var pino = require('pino');
var errors_cjs = require('../errors.cjs');
var serializable_cjs = require('../internals/serializable.cjs');
var decoratorCache_cjs = require('../cache/decoratorCache.cjs');
var env_cjs = require('../internals/env.cjs');
var zod = require('zod');
var remeda = require('remeda');
var utils_cjs = require('../serializer/utils.cjs');
var node_process = require('node:process');
var url = require('node:url');
var path = require('node:path');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var url__namespace = /*#__PURE__*/_interopNamespace(url);
var path__default = /*#__PURE__*/_interopDefault(path);

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var getImportMetaUrl = /* @__PURE__ */ __name(() => typeof document === "undefined" ? new URL(`file:${__filename}`).href : document.currentScript && document.currentScript.src || new URL("main.js", document.baseURI).href, "getImportMetaUrl");
var importMetaUrl = /* @__PURE__ */ getImportMetaUrl();
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
const __dirname$1 = path__default.default.dirname(url__namespace.fileURLToPath(importMetaUrl));
class LoggerError extends errors_cjs.FrameworkError {
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
class Logger extends serializable_cjs.Serializable {
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
      pretty: env_cjs.parseEnv.asBoolean("BEE_FRAMEWORK_LOG_PRETTY", false),
      bindings: {},
      level: env_cjs.parseEnv("BEE_FRAMEWORK_LOG_LEVEL", zod.z.nativeEnum(LoggerLevel).default(LoggerLevel.INFO))
    };
  }
  child(input) {
    const name = [
      this.input.name,
      input?.name
    ].filter(remeda.isTruthy).join(".");
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
      input: utils_cjs.shallowCopy(this.input),
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
    const targetStream = stream ?? (isPretty ? pino.pino.destination(node_process.stdout) : void 0);
    return pino.pino({
      ...isPretty && {
        transport: {
          target: path__default.default.join(__dirname$1, "pretty.js"),
          options: {
            messageKey: "message",
            nestedKey: void 0,
            errorKey: "error",
            colorize: true,
            sync: true,
            singleLine: env_cjs.parseEnv.asBoolean("BEE_FRAMEWORK_LOG_SINGLE_LINE", false)
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
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", void 0),
  _ts_metadata("design:paramtypes", [])
], Logger, "root", null);
_ts_decorate([
  decoratorCache_cjs.Cache(),
  _ts_metadata("design:type", Object),
  _ts_metadata("design:paramtypes", [])
], Logger, "defaults", null);

exports.Logger = Logger;
exports.LoggerError = LoggerError;
exports.LoggerLevel = LoggerLevel;
//# sourceMappingURL=logger.cjs.map
//# sourceMappingURL=logger.cjs.map