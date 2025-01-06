'use strict';

var errors_cjs = require('../errors.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class SerializerError extends errors_cjs.FrameworkError {
  static {
    __name(this, "SerializerError");
  }
  constructor(message, errors) {
    super(message, errors, {
      isFatal: true,
      isRetryable: false
    });
  }
}

exports.SerializerError = SerializerError;
//# sourceMappingURL=error.cjs.map
//# sourceMappingURL=error.cjs.map