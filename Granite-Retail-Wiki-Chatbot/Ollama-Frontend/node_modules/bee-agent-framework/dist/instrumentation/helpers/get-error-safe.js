import { FrameworkError } from '../../errors.js';
import { getProp } from '../../internals/helpers/object.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function getErrorSafe(data) {
  const error = getProp(data, [
    "error"
  ], data);
  if (error instanceof FrameworkError) {
    return FrameworkError.ensure(error).explain();
  }
}
__name(getErrorSafe, "getErrorSafe");

export { getErrorSafe };
//# sourceMappingURL=get-error-safe.js.map
//# sourceMappingURL=get-error-safe.js.map