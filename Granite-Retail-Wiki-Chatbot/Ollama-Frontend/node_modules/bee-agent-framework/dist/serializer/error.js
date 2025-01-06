import { FrameworkError } from '../errors.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class SerializerError extends FrameworkError {
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

export { SerializerError };
//# sourceMappingURL=error.js.map
//# sourceMappingURL=error.js.map