'use strict';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function findUniqueKey(baseKey, map) {
  let key = baseKey;
  for (let i = 1; map.has(key); i++) {
    key = baseKey.concat(String(i));
  }
  return key;
}
__name(findUniqueKey, "findUniqueKey");

exports.findUniqueKey = findUniqueKey;
//# sourceMappingURL=map.cjs.map
//# sourceMappingURL=map.cjs.map