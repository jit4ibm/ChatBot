'use strict';

var R = require('remeda');

function _interopNamespace(e) {
  if (e && e.__esModule) return e;
  var n = Object.create(null);
  if (e) {
    Object.keys(e).forEach(function (k) {
      if (k !== 'default') {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  }
  n.default = e;
  return Object.freeze(n);
}

var R__namespace = /*#__PURE__*/_interopNamespace(R);

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
  return R__namespace.isTruthy(object) && Object.getPrototypeOf(object) === constructor.prototype;
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

exports.findDescriptor = findDescriptor;
exports.isDirectInstanceOf = isDirectInstanceOf;
exports.traversePrototypeChain = traversePrototypeChain;
//# sourceMappingURL=prototype.cjs.map
//# sourceMappingURL=prototype.cjs.map