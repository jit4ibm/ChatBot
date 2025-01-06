'use strict';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function narrowTo(value, fn) {
  if (typeof fn === "function") {
    return fn(value);
  }
  return fn;
}
__name(narrowTo, "narrowTo");

exports.narrowTo = narrowTo;
//# sourceMappingURL=types.cjs.map
//# sourceMappingURL=types.cjs.map