'use strict';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
const DEFAULT_IGNORE_KEYS = [
  "emitter",
  "logger",
  "tokens",
  "createdBy",
  "client"
];
function traceSerializer({ ignored_keys = [] }) {
  const mergedIgnoreKeys = /* @__PURE__ */ new Set([
    ...DEFAULT_IGNORE_KEYS,
    ...ignored_keys
  ]);
  return (body) => JSON.stringify(body, /* @__PURE__ */ (() => {
    return (key, value) => {
      if (mergedIgnoreKeys.has(key) || key.startsWith("_")) {
        return;
      }
      return value;
    };
  })());
}
__name(traceSerializer, "traceSerializer");

exports.traceSerializer = traceSerializer;
//# sourceMappingURL=trace-serializer.cjs.map
//# sourceMappingURL=trace-serializer.cjs.map