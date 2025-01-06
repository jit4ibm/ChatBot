'use strict';

var util = require('util');
var R = require('remeda');

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

var util__default = /*#__PURE__*/_interopDefault(util);
var R__namespace = /*#__PURE__*/_interopNamespace(R);

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class FrameworkError extends AggregateError {
  static {
    __name(this, "FrameworkError");
  }
  isFatal = false;
  isRetryable = true;
  context;
  constructor(message = "Framework error has occurred.", errors = [], options = {}) {
    super(errors || [], message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, AggregateError);
    if (R__namespace.isBoolean(options?.isFatal)) {
      this.isFatal = options?.isFatal;
    }
    if (R__namespace.isBoolean(options?.isRetryable)) {
      this.isRetryable = options.isRetryable;
    }
    this.context = options?.context ?? {};
  }
  hasFatalError() {
    if (this.isFatal) {
      return true;
    }
    for (const err of this.traverseErrors()) {
      if (err instanceof FrameworkError && err.isFatal) {
        return true;
      }
    }
    return false;
  }
  *traverseErrors() {
    for (const error of this.errors) {
      yield error;
      if (error instanceof FrameworkError) {
        yield* error.traverseErrors();
      }
    }
  }
  getCause() {
    const errors = Array.from(this.traverseErrors());
    return errors.at(-1) ?? this;
  }
  explain() {
    const output = [];
    for (const [index, error] of [
      this,
      ...this.traverseErrors()
    ].entries()) {
      const offset = `  `.repeat(2 * index);
      output.push(`${offset}${error.toString()}`);
      if (error.cause) {
        output.push(`${offset}Cause: ${error.cause.toString()}`);
      }
    }
    return output.join("\n");
  }
  dump() {
    return util__default.default.inspect(this, {
      compact: false,
      depth: Infinity
    });
  }
  static ensure(error) {
    return error instanceof FrameworkError ? error : new FrameworkError("Framework error has occurred.", [
      error
    ]);
  }
  static isInstanceOf(error) {
    return error instanceof FrameworkError;
  }
  static isAbortError(error) {
    return error instanceof AbortError || error instanceof Error && error?.name === "AbortError";
  }
  static isRetryable(error) {
    if (error instanceof FrameworkError) {
      return error.isRetryable;
    }
    return !FrameworkError.isAbortError(error);
  }
}
class NotImplementedError extends FrameworkError {
  static {
    __name(this, "NotImplementedError");
  }
  constructor(message = "Not implemented!", errors) {
    super(message, errors, {
      isFatal: true,
      isRetryable: false
    });
  }
}
class ValueError extends FrameworkError {
  static {
    __name(this, "ValueError");
  }
  constructor(message = "Provided value is not supported!", errors = [], options) {
    super(message, errors, options);
  }
}
class AbortError extends FrameworkError {
  static {
    __name(this, "AbortError");
  }
  constructor(message = "Operation has been aborted!", errors = [], options) {
    super(message, errors, options);
  }
}

exports.AbortError = AbortError;
exports.FrameworkError = FrameworkError;
exports.NotImplementedError = NotImplementedError;
exports.ValueError = ValueError;
//# sourceMappingURL=errors.cjs.map
//# sourceMappingURL=errors.cjs.map