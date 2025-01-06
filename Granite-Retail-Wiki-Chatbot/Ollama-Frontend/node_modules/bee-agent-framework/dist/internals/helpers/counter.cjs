'use strict';

var serializable_cjs = require('../serializable.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class RetryCounter extends serializable_cjs.Serializable {
  static {
    __name(this, "RetryCounter");
  }
  ErrorClass;
  remaining;
  maxRetries;
  lastError;
  finalError;
  constructor(maxRetries = 0, ErrorClass) {
    super(), this.ErrorClass = ErrorClass;
    this.maxRetries = maxRetries;
    this.remaining = maxRetries;
  }
  use(error) {
    if (this.finalError) {
      throw this.finalError;
    }
    this.lastError = error ?? this.lastError;
    this.remaining--;
    if (this.remaining < 0) {
      this.finalError = new this.ErrorClass(`Maximal amount of global retries (${this.maxRetries}) has been reached.`, this.lastError ? [
        this.lastError
      ] : void 0, {
        isFatal: true,
        isRetryable: false
      });
      throw this.finalError;
    }
  }
  createSnapshot() {
    return {
      remaining: this.remaining,
      maxRetries: this.maxRetries,
      lastError: this.lastError,
      finalError: this.finalError,
      ErrorClass: this.ErrorClass
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}

exports.RetryCounter = RetryCounter;
//# sourceMappingURL=counter.cjs.map
//# sourceMappingURL=counter.cjs.map