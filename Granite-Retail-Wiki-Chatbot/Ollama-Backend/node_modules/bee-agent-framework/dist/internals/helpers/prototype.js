import * as R from 'remeda';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
function* traversePrototypeChain(value, excluded) {
  let node = value;
  while (node !== null && node !== void 0) {
    node = Object.getPrototypeOf(node);
    if (!excluded?.has?.(node)) {
      yield node;
    }
  }
}
__name(traversePrototypeChain, "traversePrototypeChain");
function isDirectInstanceOf(object, constructor) {
  return R.isTruthy(object) && Object.getPrototypeOf(object) === constructor.prototype;
}
__name(isDirectInstanceOf, "isDirectInstanceOf");
function findDescriptor(target, property) {
  for (const node of traversePrototypeChain(target)) {
    const descriptor = Object.getOwnPropertyDescriptor(node, property);
    if (descriptor) {
      return descriptor;
    }
  }
  return null;
}
__name(findDescriptor, "findDescriptor");

export { findDescriptor, isDirectInstanceOf, traversePrototypeChain };
//# sourceMappingURL=prototype.js.map
//# sourceMappingURL=prototype.js.map