'use strict';

var base_cjs = require('./base.cjs');

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
class UnconstrainedCache extends base_cjs.BaseCache {
  static {
    __name(this, "UnconstrainedCache");
  }
  provider = /* @__PURE__ */ new Map();
  static {
    this.register();
  }
  async get(key) {
    return this.provider.get(key);
  }
  async has(key) {
    return this.provider.has(key);
  }
  async clear() {
    this.provider.clear();
  }
  async delete(key) {
    return this.provider.delete(key);
  }
  async set(key, value) {
    this.provider.set(key, value);
  }
  async size() {
    return this.provider.size;
  }
  createSnapshot() {
    return {
      enabled: this.enabled,
      provider: this.provider
    };
  }
  loadSnapshot(snapshot) {
    Object.assign(this, snapshot);
  }
}

exports.UnconstrainedCache = UnconstrainedCache;
//# sourceMappingURL=unconstrainedCache.cjs.map
//# sourceMappingURL=unconstrainedCache.cjs.map