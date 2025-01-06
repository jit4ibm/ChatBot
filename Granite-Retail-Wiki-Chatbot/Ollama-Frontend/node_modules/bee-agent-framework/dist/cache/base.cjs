'use strict';

var serializable_cjs = require('../internals/serializable.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class BaseCache extends serializable_cjs.Serializable {
  static {
    __name(this, "BaseCache");
  }
  enabled = true;
}

exports.BaseCache = BaseCache;
//# sourceMappingURL=base.cjs.map
//# sourceMappingURL=base.cjs.map