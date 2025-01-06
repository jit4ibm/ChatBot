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

export { findUniqueKey };
//# sourceMappingURL=map.js.map
//# sourceMappingURL=map.js.map