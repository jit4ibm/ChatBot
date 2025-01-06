'use strict';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function removeFromArray(arr, target) {
  const index = arr.findIndex((value) => value === target);
  if (index === -1) {
    return false;
  }
  arr.splice(index, 1);
  return true;
}
__name(removeFromArray, "removeFromArray");
function castArray(arr) {
  const result = Array.isArray(arr) ? arr : [
    arr
  ];
  return result;
}
__name(castArray, "castArray");
function hasMinLength(arr, n) {
  return arr.length >= n;
}
__name(hasMinLength, "hasMinLength");

exports.castArray = castArray;
exports.hasMinLength = hasMinLength;
exports.removeFromArray = removeFromArray;
//# sourceMappingURL=array.cjs.map
//# sourceMappingURL=array.cjs.map