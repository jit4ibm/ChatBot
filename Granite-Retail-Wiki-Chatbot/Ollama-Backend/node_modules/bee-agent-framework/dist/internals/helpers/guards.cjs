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
function isPrimitive(value) {
  return R__namespace.isString(value) || R__namespace.isNumber(value) || R__namespace.isBoolean(value) || R__namespace.isNullish(value) || R__namespace.isSymbol(value);
}
__name(isPrimitive, "isPrimitive");

exports.isPrimitive = isPrimitive;
//# sourceMappingURL=guards.cjs.map
//# sourceMappingURL=guards.cjs.map