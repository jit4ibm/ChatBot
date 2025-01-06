'use strict';

var errors_cjs = require('../../errors.cjs');
var object_cjs = require('../../internals/helpers/object.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function getErrorSafe(data) {
  const error = object_cjs.getProp(data, [
    "error"
  ], data);
  if (error instanceof errors_cjs.FrameworkError) {
    return errors_cjs.FrameworkError.ensure(error).explain();
  }
}
__name(getErrorSafe, "getErrorSafe");

exports.getErrorSafe = getErrorSafe;
//# sourceMappingURL=get-error-safe.cjs.map
//# sourceMappingURL=get-error-safe.cjs.map