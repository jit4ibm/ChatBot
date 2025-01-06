import * as R from 'remeda';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function isPrimitive(value) {
  return R.isString(value) || R.isNumber(value) || R.isBoolean(value) || R.isNullish(value) || R.isSymbol(value);
}
__name(isPrimitive, "isPrimitive");

export { isPrimitive };
//# sourceMappingURL=guards.js.map
//# sourceMappingURL=guards.js.map