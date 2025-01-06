import util from 'util';
import * as R from 'remeda';

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
    if (R.isBoolean(options?.isFatal)) {
      this.isFatal = options?.isFatal;
    }
    if (R.isBoolean(options?.isRetryable)) {
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
    return util.inspect(this, {
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

export { AbortError, FrameworkError, NotImplementedError, ValueError };
//# sourceMappingURL=errors.js.map
//# sourceMappingURL=errors.js.map